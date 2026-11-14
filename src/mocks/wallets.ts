import { delay, http, HttpResponse } from 'msw'
import { readSession, sessionStorageKey } from './auth'
import { recordWalletActivity } from './wallet-activity-store'
import type { SavedWallet, WalletInput } from '../types/wallet'
import { readJson } from './storage'
import { isRecord, text } from '../lib/identity'
const fail = (message: string, status = 422, field?: string) => HttpResponse.json({ message, field }, { status })
function key(request: Request) { return `kurio.mock.wallets.${readSession(request)?.id}` }
export function readWallets(request: Request): SavedWallet[] {
  const user = readSession(request)
  if (!user) return []
  const saved = localStorage.getItem(key(request))
  if (saved) {
    const records = readJson(key(request), [])
    if (!Array.isArray(records)) return []
    return records.filter((item) => isRecord(item) && !!text(item.id) && !!text(item.address) && !!text(item.network)).slice(0, 2).map((item, index): SavedWallet => ({
      id: text(item.id), address: text(item.address), network: text(item.network),
      slot: item.slot === 'primary' || item.slot === 'secondary' ? item.slot : index === 0 ? 'primary' : 'secondary',
      type: item.type === 'Coinbase Wallet' || item.type === 'WalletConnect' ? item.type : item.label === 'Coinbase Wallet' || item.label === 'WalletConnect' ? item.label : 'MetaMask',
      nickname: text(item.nickname) || text(item.label) || 'Minha carteira', label: text(item.label) || text(item.nickname) || 'Minha carteira',
      displayName: user.name, profileName: user.name, email: user.email,
      ens: text(item.ens), referral: text(item.referral), secondaryAddress: text(item.secondaryAddress),
    }))
  }
  if (user.id !== 'collector-demo' && user.id !== 'collector-second') return []
  return [
    { id: 'metamask', label: 'MetaMask', type: 'MetaMask', slot: 'primary', displayName: user.name, nickname: 'Minha carteira principal', profileName: user.name, email: user.email, ens: '', referral: '', secondaryAddress: '', network: 'Ethereum', address: '0x1111111111111111111111111111111111111111' },
    { id: 'coinbase', label: 'Coinbase Wallet', type: 'Coinbase Wallet', slot: 'secondary', displayName: user.name, nickname: 'Carteira secundária', profileName: user.name, email: user.email, ens: '', referral: '', secondaryAddress: '', network: 'Ethereum', address: '0x2222222222222222222222222222222222222222' },
  ]
}
function validAddress(address: string, network: string) { return network === 'Solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) : /^0x[a-fA-F0-9]{40}$/.test(address) }
async function save(request: Request, id?: string) {
  if (!readSession(request)) return fail('Entre novamente para acessar suas carteiras.', 401)
  const body = await request.json() as WalletInput
  for (const [field, label] of [['displayName', 'nome de exibição'], ['nickname', 'apelido'], ['profileName', 'nome do perfil']] as const) {
    if (typeof body[field] !== 'string' || body[field].trim().length < 2 || body[field].trim().length > 80) return fail(`Informe ${label} com 2 a 80 caracteres.`, 422, field)
  }
  if (!['primary', 'secondary'].includes(body.slot)) return fail('Tipo de carteira inválido.')
  if (!['Ethereum', 'Polygon', 'Solana'].includes(body.network)) return fail('Selecione uma rede válida.', 422, 'network')
  if (!['MetaMask', 'Coinbase Wallet', 'WalletConnect'].includes(body.type)) return fail('Selecione o tipo da carteira.', 422, 'type')
  if (typeof body.address !== 'string' || !validAddress(body.address.trim(), body.network)) return fail(body.network === 'Solana' ? 'Informe um endereço Solana válido.' : 'Use 0x seguido de 40 caracteres hexadecimais.', 422, 'address')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email ?? '')) return fail('Informe um e-mail válido.', 422, 'email')
  if (body.ens && !/^[a-z0-9-]{3,63}(\.eth)?$/i.test(body.ens)) return fail('Nome ENS inválido.', 422, 'ens')
  if (body.referral && (typeof body.referral !== 'string' || body.referral.length > 40)) return fail('Código de indicação muito longo.', 422, 'referral')
  if (body.secondaryAddress && !validAddress(body.secondaryAddress, body.network) && !/^[a-z0-9-]{3,63}\.eth$/i.test(body.secondaryAddress)) return fail('Endereço secundário ou ENS inválido.', 422, 'secondaryAddress')
  const all = readWallets(request)
  const existing = id ? all.find((wallet) => wallet.id === id) : undefined
  if (id && !existing) return fail('Carteira não encontrada.', 404)
  if (all.some((wallet) => wallet.id !== id && wallet.slot === body.slot)) return fail('Já existe uma carteira nesta posição. Edite a carteira existente.', 409)
  if (all.some((wallet) => wallet.id !== id && wallet.network === body.network && wallet.address.toLowerCase() === body.address.trim().toLowerCase())) return fail('Este endereço já está cadastrado nesta rede.', 409, 'address')
  if (body.slot === 'secondary' && !all.some((wallet) => wallet.slot === 'primary')) return fail('Cadastre a carteira principal primeiro.', 409)
  const wallet: SavedWallet = { id: existing?.id ?? crypto.randomUUID(), slot: body.slot, displayName: body.displayName.trim(), nickname: body.nickname.trim(), profileName: body.profileName.trim(), email: body.email.trim().toLowerCase(), network: body.network, type: body.type, label: body.nickname.trim(), address: body.address.trim(), ens: body.ens?.trim() ?? '', referral: body.referral?.trim() ?? '', secondaryAddress: body.secondaryAddress?.trim() ?? '' }
  await delay(300)
  localStorage.setItem(key(request), JSON.stringify(existing ? all.map((item) => item.id === existing.id ? wallet : item) : [...all, wallet]))
  // Editing an address requires a new connection before the next purchase.
  localStorage.removeItem(`${sessionStorageKey(request)}.connection`)
  recordWalletActivity(request, { kind: existing ? 'wallet_updated' : 'wallet_created', title: existing ? 'Carteira atualizada' : 'Carteira cadastrada', walletId: wallet.id, walletLabel: wallet.nickname, network: wallet.network })
  return HttpResponse.json(wallet, { status: existing ? 200 : 201 })
}
export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => { if (!readSession(request)) return fail('Entre novamente para acessar suas carteiras.', 401); await delay(150); return HttpResponse.json(readWallets(request)) }),
  http.post('/api/wallets', ({ request }) => save(request)),
  http.patch('/api/wallets/:id', ({ request, params }) => save(request, String(params.id))),
]
