import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Copy, Plus, Wallet } from 'lucide-react'
import axios from 'axios'
import { AccountLayout } from '../components/AccountLayout'
import { WalletHistoryPanel } from '../components/WalletHistory'
import { listWallets, saveWallet } from '../lib/wallets'
import type { Session } from '../types/checkout'
import type { SavedWallet, WalletInput, WalletSlot } from '../types/wallet'

export function WalletsPage() { return <AccountLayout active="wallets" title="Minhas carteiras">{(user) => <WalletsContent key={user.id} user={user} />}</AccountLayout> }
function WalletsContent({ user }: { user: Session }) {
  const query = useQuery({ queryKey: ['wallets', user.id], queryFn: ({ signal }) => listWallets(signal) })
  if (query.isPending) return <div className="nft-skeleton h-96 rounded" role="status" aria-label="Carregando carteiras" />
  if (query.isError) return <div role="alert"><p>Não foi possível carregar suas carteiras.</p><Button variant="default" size="plain" type="button" className="checkout-primary mt-4" onClick={() => query.refetch()}>Tentar novamente</Button></div>
  const primary = query.data.find((wallet) => wallet.slot === 'primary')
  const secondary = query.data.find((wallet) => wallet.slot === 'secondary')
  return <>
    <WalletHistoryPanel userId={user.id} wallets={query.data} />
    <div className="wallet-management-heading"><h2>Gerenciar carteiras</h2><p>Cadastre ou atualize os dados usados nas suas compras.</p></div>
    <WalletSection key="primary" slot="primary" wallet={primary} user={user} />
    <WalletSection key="secondary" slot="secondary" wallet={secondary} primary={primary} user={user} />
    <p className="wallet-simulation-note">Carteiras de demonstração. Nenhuma extensão real será acessada e nunca solicitamos sua frase de recuperação ou chave privada.</p>
  </>
}
function WalletSection({ slot, wallet, primary, user }: { slot: WalletSlot; wallet?: SavedWallet; primary?: SavedWallet; user: Session }) {
  const [editing, setEditing] = useState(slot === 'primary' && !wallet)
  const [draft, setDraft] = useState<WalletInput>(() => wallet ?? { slot, displayName: user.name, nickname: '', profileName: user.name, email: user.email, address: '', network: '', type: '' as WalletInput['type'], ens: '', referral: '', secondaryAddress: '' })
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const firstInput = useRef<HTMLInputElement>(null)
  const client = useQueryClient()
  const mutation = useMutation({ mutationFn: saveWallet, retry: false, onSuccess: async (saved) => {
    client.setQueryData<SavedWallet[]>(['wallets', user.id], (previous) => previous?.some((item) => item.id === saved.id) ? previous.map((item) => item.id === saved.id ? saved : item) : [...(previous ?? []), saved])
    setNotice('Carteira salva. Ela já está disponível no pagamento.')
    await client.invalidateQueries({ queryKey: ['wallets', user.id] })
    await client.invalidateQueries({ queryKey: ['wallet-activity', user.id] })
  }, onError: (error) => {
    const field = axios.isAxiosError<{ field?: string }>(error) ? error.response?.data.field : undefined
    const input = field ? form.current?.elements.namedItem(field) : null
    if (input instanceof HTMLElement) input.focus()
  } })
  const failure = axios.isAxiosError<{ message: string; field?: string }>(mutation.error) ? mutation.error.response?.data : undefined
  const update = <K extends keyof WalletInput,>(field: K, value: WalletInput[K]) => { setDraft((previous) => ({ ...previous, [field]: value })); setNotice('') }
  const title = slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'
  const errorId = `wallet-${slot}-error`
  const common = (field: keyof WalletInput) => ({ 'aria-invalid': failure?.field === field, 'aria-describedby': failure?.field === field ? errorId : undefined })
  return <section className="wallet-section" aria-labelledby={`wallet-${slot}-title`}>
    <header className="wallet-section-header"><div><h1 id={`wallet-${slot}-title`}>{title}</h1><p>{slot === 'primary' ? 'Disponível no pagamento e para receber seus NFTs comprados.' : 'Uma alternativa para suas próximas compras.'}</p></div><Button variant="ghost" size="plain" type="button" className="wallet-add" onClick={() => { setEditing(!editing); if (slot === 'primary') firstInput.current?.focus() }} disabled={slot === 'secondary' && !primary}><Plus size={15} />{editing ? 'Recolher' : wallet ? 'Editar' : 'Adicionar'}</Button></header>
    {wallet && !editing && <div className="wallet-saved-card"><span className="wallet-card-icon"><Wallet size={22} /></span><div><strong>{wallet.nickname}</strong><span>{wallet.type} · {wallet.network}</span><code>{wallet.address}</code></div><Button variant="ghost" size="plain" type="button" aria-label="Copiar endereço da carteira" onClick={async () => { try { await navigator.clipboard.writeText(wallet.address); setCopied(true) } catch { setNotice('Não foi possível copiar o endereço.') } }}>{copied ? <Check size={17} /> : <Copy size={17} />}</Button></div>}
    {!wallet && !editing && <p className="wallet-empty">{primary ? 'Você ainda não adicionou uma carteira secundária.' : 'Cadastre sua carteira principal para adicionar uma secundária.'}</p>}
    {editing && <form ref={form} className="collector-form wallet-form" onSubmit={(event) => { event.preventDefault(); if (!mutation.isPending) mutation.mutate({ id: wallet?.id, data: { ...draft, displayName: user.name, profileName: user.name, email: user.email } }) }}>
      {slot === 'secondary' && primary && <Button variant="ghost" size="plain" type="button" className="wallet-reuse" onClick={() => { setDraft((previous) => ({ ...previous, type: primary.type, network: primary.network })); setNotice('Rede e tipo copiados. Informe o endereço e o apelido da carteira secundária.') }}><Copy size={14} />Usar rede e tipo da principal</Button>}
      <fieldset className="collector-field-grid" disabled={mutation.isPending}>
        <legend className="sr-only">Dados da {title.toLowerCase()}</legend>
        <label htmlFor={`${slot}-nickname`}>Apelido da carteira <span>*</span><Input ref={firstInput} id={`${slot}-nickname`} name="nickname" required minLength={2} maxLength={80} value={draft.nickname} onChange={(event) => update('nickname', event.target.value)} placeholder="Ex.: Minha carteira principal" {...common('nickname')} /></label>
        <label htmlFor={`${slot}-network`}>Rede <span>*</span><span className="wallet-select"><select id={`${slot}-network`} name="network" required value={draft.network} onChange={(event) => update('network', event.target.value)} {...common('network')}><option value="">Selecione uma rede</option><option>Ethereum</option><option>Polygon</option><option>Solana</option></select><ChevronDown size={14} /></span></label>
        <label htmlFor={`${slot}-address`}>Endereço da carteira <span>*</span><Input id={`${slot}-address`} name="address" required spellCheck={false} autoCapitalize="none" value={draft.address} onChange={(event) => update('address', event.target.value)} placeholder={draft.network === 'Solana' ? 'Endereço Solana' : '0x…'} {...common('address')} /></label>
        <label htmlFor={`${slot}-secondaryAddress`}>ENS ou endereço alternativo <span className="collector-optional">(opcional)</span><Input id={`${slot}-secondaryAddress`} name="secondaryAddress" value={draft.secondaryAddress} onChange={(event) => update('secondaryAddress', event.target.value)} placeholder="seunome.eth ou endereço" {...common('secondaryAddress')} /></label>
        <label htmlFor={`${slot}-type`}>Tipo de carteira <span>*</span><span className="wallet-select"><select id={`${slot}-type`} name="type" required value={draft.type} onChange={(event) => update('type', event.target.value as WalletInput['type'])} {...common('type')}><option value="">Selecione uma carteira</option><option>MetaMask</option><option>Coinbase Wallet</option><option>WalletConnect</option></select><ChevronDown size={14} /></span></label>
        <label htmlFor={`${slot}-ens`}>Nome ENS <span className="collector-optional">(opcional)</span><span className="collector-ens-field"><span aria-hidden="true">.eth</span><Input id={`${slot}-ens`} name="ens" value={draft.ens} onChange={(event) => update('ens', event.target.value.replace(/\.eth$/, ''))} placeholder="seunome" {...common('ens')} /></span></label>
      </fieldset>
      {mutation.isError && <p id={errorId} role="alert" className="auth-error">{failure?.message ?? 'Não foi possível salvar. Tente novamente.'}</p>}
      <Button variant="default" size="plain" type="submit" className="checkout-primary collector-save-button" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar carteira'}</Button>
    </form>}
    {notice && <p role="status" className="wallet-save-message"><Check size={15} />{notice}</p>}
  </section>
}





