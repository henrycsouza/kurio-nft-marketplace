import { delay, http, HttpResponse } from 'msw'
import type { Session } from '../types/checkout'
import type { CollectorProfile, ProfileUpdate } from '../types/profile'
import { displayName, isRecord, sessionFrom, text } from '../lib/identity'
import { cartFrom } from '../lib/cart-contract'
import { readJson } from './storage'

type Account = { id: string; name: string; email: string; salt: string; hash: string; provider?: string; username?: string; ens?: string; walletNickname?: string; avatar?: string | null }
const accountsKey = 'kurio.mock.accounts.v1'
const demoHash = '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4'
const error = (message: string, status = 422, field?: string) => HttpResponse.json({ message, field }, { status })
export const sessionStorageKey = (request: Request) => `kurio.mock.session.${request.headers.get('X-Guest-Id')}`
export function readSession(request: Request): Session | null {
  try {
    const saved = localStorage.getItem(sessionStorageKey(request))
    if (!saved) return null
    const value: unknown = JSON.parse(saved)
    if (!isRecord(value) || typeof value.id !== 'string') return null
    const account = accounts().find((item) => item.id === value.id)
    if (!account) return null
    const current = sessionFrom({ id: account.id, name: account.name, email: account.email, avatar: account.avatar, expiresAt: value.expiresAt })
    if (current && JSON.stringify(current) !== saved) localStorage.setItem(sessionStorageKey(request), JSON.stringify(current))
    return current
  } catch { return null }
}
function accounts(): Account[] {
  const defaults: Account[] = [
    { id: 'collector-demo', name: 'Colecionador Kurio', email: 'colecionador@kurio.test', salt: '', hash: demoHash },
    { id: 'collector-second', name: 'Ana Colecionadora', email: 'ana@kurio.test', salt: '', hash: demoHash },
  ]
  let saved: unknown
  try { saved = JSON.parse(localStorage.getItem(accountsKey) ?? 'null') } catch { return defaults }
  if (!Array.isArray(saved)) return defaults
  return saved.filter((item): item is Record<string, unknown> => isRecord(item) && !!text(item.id) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(item.email)) && typeof item.hash === 'string' && typeof item.salt === 'string').map((item) => ({
    id: text(item.id), email: text(item.email).toLowerCase(), name: displayName({ ...item, name: text(item.name) || defaults.find((account) => account.id === item.id)?.name }),
    hash: item.hash as string, salt: item.salt as string,
    username: text(item.username) || undefined, ens: text(item.ens), walletNickname: text(item.walletNickname), avatar: typeof item.avatar === 'string' ? item.avatar : null,
    provider: typeof item.provider === 'string' ? item.provider : undefined,
  }))
}
async function passwordHash(password: string, salt: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
function beginSession(request: Request, account: Account) {
  const previous = readSession(request)
  const guestId = request.headers.get('X-Guest-Id') ?? 'guest'
  const visitorKey = `kurio.mock.cart.${guestId}`
  const userKey = `kurio.mock.cart.user.${account.id}`
  // Only the visitor cart is merged; another account's items remain isolated.
  if (!previous) {
    const visitor = cartFrom(readJson(visitorKey))
    const target = cartFrom(readJson(userKey))
    for (const item of visitor.items) {
      const existing = target.items.find((line) => line.nftId === item.nftId && line.editionId === item.editionId)
      if (existing) existing.quantity += item.quantity
      else target.items.push(item)
    }
    if (visitor.items.length) { target.version += 1; localStorage.setItem(userKey, JSON.stringify(target)) }
    localStorage.removeItem(visitorKey)
  }
  const user: Session = { id: account.id, name: account.name, email: account.email, expiresAt: Date.now() + 30 * 60 * 1000 }
  localStorage.setItem(sessionStorageKey(request), JSON.stringify(user))
  localStorage.removeItem(`${sessionStorageKey(request)}.connection`)
  return HttpResponse.json(user)
}
function profileOf(user: Session, account: Account): CollectorProfile {
  return { ...user, name: account.name, email: account.email, username: account.username ?? account.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'), ens: account.ens ?? '', walletNickname: account.walletNickname ?? '', avatar: account.avatar ?? null, provider: account.provider ?? null }
}
export const authHandlers = [
  http.get('/api/preferences', ({ request }) => {
    const user = readSession(request)
    if (!user) return error('Entre novamente para continuar.', 401)
    const saved = readJson(`kurio.mock.preferences.${user.id}`)
    return HttpResponse.json({ reduceMotion: isRecord(saved) && saved.reduceMotion === true })
  }),
  http.patch('/api/preferences', async ({ request }) => {
    const user = readSession(request)
    if (!user) return error('Entre novamente para continuar.', 401)
    const body = await request.json() as { reduceMotion?: boolean }
    if (typeof body.reduceMotion !== 'boolean') return error('Preferência inválida.')
    const preferences = { reduceMotion: body.reduceMotion }
    localStorage.setItem(`kurio.mock.preferences.${user.id}`, JSON.stringify(preferences))
    return HttpResponse.json(preferences)
  }),
  http.get('/api/profile', async ({ request }) => {
    const user = readSession(request)
    if (!user) return error('Sua sessão expirou. Entre novamente.', 401)
    const account = accounts().find((item) => item.id === user.id)
    if (!account) return error('Conta não encontrada.', 404)
    await delay(200)
    return HttpResponse.json(profileOf(user, account))
  }),
  http.patch('/api/profile', async ({ request }) => {
    const user = readSession(request)
    if (!user) return error('Sua sessão expirou. Entre novamente.', 401)
    const body = await request.json() as Partial<ProfileUpdate>
    const all = accounts()
    const account = all.find((item) => item.id === user.id)
    if (!account) return error('Conta não encontrada.', 404)
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80) return error('Informe um nome entre 2 e 80 caracteres.', 422, 'name')
    const email = body.email === undefined ? account.email : String(body.email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Informe um e-mail válido.', 422, 'email')
    if (all.some((item) => item.id !== account.id && item.email === email)) return error('Este e-mail já pertence a outra conta.', 409, 'email')
    const username = body.username === undefined ? profileOf(user, account).username : String(body.username).trim()
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return error('Use de 3 a 30 letras, números ou sublinhados.', 422, 'username')
    if (all.some((item) => item.id !== account.id && (item.username ?? item.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')) === username)) return error('Nome de usuário já utilizado.', 409, 'username')
    const ens = body.ens === undefined ? account.ens ?? '' : String(body.ens).trim().toLowerCase().replace(/\.eth$/, '')
    if (ens && !/^[a-z0-9-]{3,63}$/.test(ens)) return error('Use de 3 a 63 letras, números ou hífens no ENS.', 422, 'ens')
    const nickname = body.walletNickname === undefined ? account.walletNickname ?? '' : String(body.walletNickname).trim()
    if (nickname.length > 60) return error('O apelido deve ter até 60 caracteres.', 422, 'walletNickname')
    const avatar = body.avatar === undefined ? account.avatar ?? null : body.avatar
    if (avatar !== null && (typeof avatar !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar) || avatar.length > 1400000)) return error('Use uma imagem PNG, JPG ou WebP de até 1 MB.', 422, 'avatar')
    let nextSalt = account.salt
    let nextHash = account.hash
    if (body.currentPassword || body.newPassword || body.confirmation) {
      if (account.provider) return error('Sua senha é gerenciada pelo provedor de acesso.', 422, 'currentPassword')
      if (typeof body.currentPassword !== 'string' || await passwordHash(body.currentPassword, account.salt) !== account.hash) return error('Senha atual incorreta.', 422, 'currentPassword')
      if (typeof body.newPassword !== 'string' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(body.newPassword)) return error('Use de 8 a 128 caracteres, com maiúscula, minúscula e número.', 422, 'newPassword')
      if (body.newPassword !== body.confirmation) return error('As senhas não coincidem.', 422, 'confirmation')
      nextSalt = crypto.randomUUID()
      nextHash = await passwordHash(body.newPassword, nextSalt)
    }
    await delay(300)
    Object.assign(account, { name: body.name.trim(), email, username, ens, walletNickname: nickname, avatar, salt: nextSalt, hash: nextHash })
    localStorage.setItem(accountsKey, JSON.stringify(all))
    const updated = { ...user, name: account.name, email: account.email, avatar: account.avatar ?? null }
    localStorage.setItem(sessionStorageKey(request), JSON.stringify(updated))
    return HttpResponse.json(profileOf(updated, account))
  }),
  http.get('/api/session', async ({ request }) => { await delay(150); return HttpResponse.json(readSession(request)) }),
  http.post('/api/session', async ({ request }) => {
    await delay(300)
    const body = await request.json() as { email?: string; password?: string }
    const account = accounts().find((item) => item.email === text(body.email).toLowerCase())
    if (!account || account.provider || account.hash !== await passwordHash(body.password ?? '', account.salt)) return error('E-mail ou senha inválidos.', 401)
    return beginSession(request, account)
  }),
  http.post('/api/accounts', async ({ request }) => {
    await delay(350)
    const body = await request.json() as { name?: string; email?: string; password?: string }
    if (typeof body.name !== 'string' || body.name.trim().length < 2) return error('Informe seu nome, com pelo menos 2 caracteres.', 422, 'name')
    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return error('Informe um e-mail válido.', 422, 'email')
    if (!body.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(body.password)) return error('Use de 8 a 128 caracteres, com maiúscula, minúscula e número.', 422, 'password')
    const all = accounts()
    const email = body.email.trim().toLowerCase()
    if (all.some((item) => item.email === email)) return error('Já existe uma conta com este e-mail. Entre ou recupere sua senha.', 409, 'email')
    const salt = crypto.randomUUID()
    const account: Account = { id: crypto.randomUUID(), name: body.name.trim(), email, salt, hash: await passwordHash(body.password, salt) }
    all.push(account)
    localStorage.setItem(accountsKey, JSON.stringify(all))
    return beginSession(request, account)
  }),
  http.delete('/api/session', ({ request }) => { localStorage.removeItem(sessionStorageKey(request)); localStorage.removeItem(`${sessionStorageKey(request)}.connection`); return new HttpResponse(null, { status: 204 }) }),
  http.post('/api/password/forgot', async ({ request }) => {
    await delay(300)
    const body = await request.json() as { email?: string }
    const account = accounts().find((item) => item.email === text(body.email).toLowerCase() && !item.provider)
    const token = crypto.randomUUID()
    if (account) localStorage.setItem(`kurio.mock.reset.${token}`, JSON.stringify({ id: account.id, expiresAt: Date.now() + 10 * 60 * 1000 }))
    return HttpResponse.json({ message: 'Se houver uma conta com este e-mail, a recuperação estará disponível.', demoToken: token })
  }),
  http.post('/api/password/reset', async ({ request }) => {
    await delay(300)
    const body = await request.json() as { token: string; password: string }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(body.password ?? '')) return error('Use de 8 a 128 caracteres, com maiúscula, minúscula e número.', 422, 'password')
    const key = `kurio.mock.reset.${body.token}`
    const reset = JSON.parse(localStorage.getItem(key) ?? 'null') as { id: string; expiresAt: number } | null
    if (!reset || reset.expiresAt < Date.now()) return error('Código inválido ou expirado. Solicite outro.')
    const all = accounts()
    const account = all.find((item) => item.id === reset.id)
    if (!account) return error('Código inválido ou expirado.')
    account.salt = crypto.randomUUID()
    account.hash = await passwordHash(body.password, account.salt)
    localStorage.setItem(accountsKey, JSON.stringify(all)); localStorage.removeItem(key)
    return HttpResponse.json({ message: 'Senha alterada. Entre com sua nova senha.' })
  }),
  http.post('/api/session/social', async ({ request }) => {
    await delay(400)
    const body = await request.json() as { provider: string; accepted: boolean }
    if (!['google', 'facebook'].includes(body.provider)) return error('Provedor inválido.')
    if (!body.accepted) return error('Autorização cancelada.', 409)
    const all = accounts()
    let account = all.find((item) => item.id === `social-${body.provider}`)
    if (!account) { account = { id: `social-${body.provider}`, email: `${body.provider}@kurio.test`, name: `Colecionador ${body.provider === 'google' ? 'Google' : 'Facebook'}`, salt: '', hash: '', provider: body.provider }; all.push(account); localStorage.setItem(accountsKey, JSON.stringify(all)) }
    return beginSession(request, account)
  }),
]



