import { Button } from '../components/ui/button'
import { useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Wallet, RadioTower, Hexagon, CircleDot, ChevronDown, UserRound, ShoppingBag } from 'lucide-react'
import axios from 'axios'
import { AuthDialog } from '../components/LazyAuthDialog'
import { PurchaseSteps } from '../components/PurchaseSteps'
import { guestId } from '../lib/api'
import { getProfile } from '../lib/profile'
import { cartQuoteQueryKey, getCartQuote } from '../lib/cart'
import { connectWallet, createOrder, getSession, getWallets, sessionKey } from '../lib/checkout'
import type { CheckoutRequest, Collector } from '../types/checkout'
import type { CartQuote } from '../types/cart'
import { useCompactLayout } from '../lib/useCompactLayout'

type Provider = 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet'
const providers: Provider[] = ['WalletConnect', 'MetaMask', 'Coinbase Wallet']
const providerIcons = { WalletConnect: RadioTower, MetaMask: Hexagon, 'Coinbase Wallet': CircleDot }
const errorMessage = (error: unknown) => axios.isAxiosError<{ message: string }>(error) ? error.response?.data.message ?? 'Não foi possível conectar. Tente novamente.' : 'Não foi possível concluir a operação.'

export function CheckoutPage() {
  const compact = useCompactLayout()
  const client = useQueryClient()
  const navigate = useNavigate()
  const review = useRef<HTMLDialogElement>(null)
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal), staleTime: 0 })
  const attemptStorageKey = `kurio.checkout.attempt.${guestId}.${session.data?.id ?? 'guest'}`
  const profile = useQuery({ queryKey: ['profile', session.data?.id], queryFn: ({ signal }) => getProfile(signal), enabled: !!session.data })
  const wallets = useQuery({ queryKey: ['wallets', session.data?.id], queryFn: ({ signal }) => getWallets(signal), enabled: !!session.data })
  const quote = useQuery({ queryKey: cartQuoteQueryKey, queryFn: ({ signal }) => getCartQuote(signal), staleTime: 0 })
  const [authOpen, setAuthOpen] = useState(false)
  const [walletId, setWalletId] = useState('')
  const [provider, setProvider] = useState<Provider>('Coinbase Wallet')
  const [notice, setNotice] = useState('')
  const [reviewed, setReviewed] = useState<CartQuote | null>(null)
  const [validating, setValidating] = useState(false)
  const [attempt, setAttempt] = useState<{ key: string; payload: CheckoutRequest } | null>(() => { try { return JSON.parse(sessionStorage.getItem(attemptStorageKey) ?? 'null') } catch { return null } })
  const wallet = wallets.data?.find((item) => item.id === walletId) ?? wallets.data?.find((item) => item.slot === 'primary') ?? wallets.data?.[0]
  const collector: Collector | null = profile.data ? { displayName: profile.data.name, username: profile.data.username, profileName: profile.data.name, email: profile.data.email, ens: profile.data.ens ? `${profile.data.ens}.eth` : '', referral: '', note: '', secondaryAddress: '' } : null
  const scenarioParam = new URLSearchParams(window.location.search).get('scenario')
  const scenario: CheckoutRequest['scenario'] = scenarioParam === 'declined' || scenarioParam === 'timeout' ? scenarioParam : 'confirmed'
  const connection = useMutation({ mutationFn: connectWallet, retry: false })
  const order = useMutation({ mutationFn: createOrder, retry: false, onSuccess: async (created) => {
    sessionStorage.removeItem(attemptStorageKey)
    setAttempt(null)
    review.current?.close()
    await navigate({ to: '/orders/$orderId', params: { orderId: created.id } })
  }, onError: async (error) => {
    review.current?.close()
    setNotice(errorMessage(error))
    if (axios.isAxiosError(error) && error.response?.status === 401) await client.invalidateQueries({ queryKey: sessionKey })
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      sessionStorage.removeItem(attemptStorageKey); setAttempt(null)
      await client.invalidateQueries({ queryKey: cartQuoteQueryKey })
    }
  } })
  const busy = validating || connection.isPending || order.isPending

  async function preparePurchase() {
    if (busy || !wallet || !collector) return
    setNotice('')
    setValidating(true)
    try {
      if (!await getSession()) { client.setQueryData(sessionKey, null); setAuthOpen(true); setNotice('Entre novamente para retomar sua compra.'); return }
      const latest = await getCartQuote()
      client.setQueryData(cartQuoteQueryKey, latest)
      if (!latest.canCheckout) { setNotice('Há itens indisponíveis. Revise o carrinho antes de continuar.'); return }
      if (JSON.stringify(latest) !== JSON.stringify(quote.data)) { setNotice('Os valores mudaram. Confira o total atualizado e confirme novamente.'); return }
      await connection.mutateAsync({ walletId: wallet.id, provider, refuse: new URLSearchParams(window.location.search).get('connection') === 'declined' })
      setReviewed(latest)
      review.current?.showModal()
    } catch (error) { setNotice(errorMessage(error)) } finally { setValidating(false) }
  }
  function confirmPurchase() {
    if (!collector || !wallet || !reviewed || busy || attempt) return
    const next = { key: crypto.randomUUID(), payload: { collector, walletId: wallet.id, quote: reviewed, scenario } }
    sessionStorage.setItem(attemptStorageKey, JSON.stringify(next))
    setAttempt(next)
    order.mutate(next)
  }
  return <main className="simple-payment mx-auto py-8">
    <PurchaseSteps step="payment" />
    <h1 className="payment-page-title">Pagamento com carteira</h1>
    <div className="payment-card">
      <div className="payment-choices">
      <section className="payment-collector" aria-labelledby="payment-collector-title">
        <header><h2 id="payment-collector-title"><UserRound size={17} aria-hidden="true" />Dados do colecionador</h2><Link to="/profile">Editar perfil</Link></header>
        {profile.isPending ? <div className="nft-skeleton h-12 rounded" role="status" aria-label="Carregando dados do colecionador" /> : profile.data && <div><strong>{profile.data.name}</strong><span>{profile.data.email}</span></div>}
      </section>
      {!session.data && !session.isPending && <section className="payment-signin"><h2>Entre para continuar</h2><p>Seus itens continuam no carrinho.</p><Button variant="default" size="plain" type="button" className="checkout-primary" onClick={() => setAuthOpen(true)}>Entrar ou criar conta</Button></section>}
      {session.isError && <p role="alert">Não foi possível carregar a conta. <Button variant="ghost" size="plain" type="button" onClick={() => session.refetch()}>Tentar novamente</Button></p>}
      {session.isPending || (session.data && wallets.isPending) ? <div className="nft-skeleton h-40 rounded-xl" role="status" aria-label="Carregando carteiras" /> : session.data && <section className="payment-wallets" aria-labelledby="payment-wallet-heading">
        <header><h2 id="payment-wallet-heading">Carteira para pagamento</h2>{(wallets.data?.length ?? 0) > 1 && <span>Escolha uma</span>}</header>
        {wallets.isError ? <Button variant="ghost" size="plain" type="button" className="text-brand" onClick={() => wallets.refetch()}>Tentar carregar carteiras novamente</Button> : wallets.data?.length === 0 ? <div className="payment-empty"><Wallet size={24} /><p>Cadastre uma carteira para receber seus NFTs.</p><Link to="/wallets">Adicionar carteira</Link></div> : <fieldset disabled={busy || !!attempt}><legend className="sr-only">Selecionar carteira cadastrada</legend>{(wallets.data ?? []).map((item) => <label className="payment-wallet-option" key={item.id}><input type="radio" name="payment-wallet" checked={wallet?.id === item.id} onChange={() => { setWalletId(item.id); connection.reset() }} /><span><strong>{item.nickname}</strong><code>{item.address.slice(0, 7)}…{item.address.slice(-5)}</code><small>Rede {item.network}</small></span></label>)}</fieldset>}
      </section>}
      <fieldset className="payment-providers" disabled={!session.data || !wallet || busy || !!attempt}><legend>Conectar com</legend>{providers.map((item) => { const Icon = providerIcons[item]; return <label key={item} className="payment-provider-option"><span className="payment-provider-icon"><Icon size={19} aria-hidden="true" /></span><span>{item}</span><input type="radio" name="payment-provider" checked={provider === item} onChange={() => { setProvider(item); connection.reset() }} /></label> })}</fieldset>
      {wallet && <p className="payment-network">Rede selecionada: <strong>{wallet.network}</strong><span>A rede acompanha a carteira escolhida.</span></p>}
      {profile.isError && <p role="alert" className="payment-feedback">Não foi possível consultar seus dados. <Button variant="ghost" size="plain" type="button" onClick={() => profile.refetch()}>Tentar novamente</Button></p>}
      </div>
      <aside className="payment-order-summary" aria-label="Resumo da compra">
      {quote.data && <details className="payment-order-items" open={!compact}>
        <summary><span><ShoppingBag size={18} aria-hidden="true" />Seus NFTs <small>({quote.data.items.reduce((sum, item) => sum + item.quantity, 0)})</small></span><ChevronDown size={17} aria-hidden="true" /></summary>
        <ul>{quote.data.items.map((item) => <li key={`${item.nftId}:${item.editionId}`}><img src={item.image} alt={item.name} width={60} height={60} /><div><strong>{item.name}</strong><span>Edição {item.editionLabel} · Qtd. {item.quantity}</span></div><b>{item.lineTotal} ETH</b></li>)}</ul>
        <Link to="/cart" className="payment-edit-cart">Editar carrinho</Link>
      </details>}
      {quote.isPending ? <div className="nft-skeleton h-16 rounded" role="status" aria-label="Carregando total" /> : quote.isError ? <p role="alert">Não foi possível carregar os valores. <Button variant="ghost" size="plain" type="button" onClick={() => quote.refetch()}>Tentar novamente</Button></p> : quote.data && <section className="payment-price" aria-label="Total da compra"><p><span>Total</span><strong>{quote.data.total} ETH</strong></p><details open={!compact}><summary>Detalhes dos valores</summary><dl><div><dt>Subtotal</dt><dd>{quote.data.subtotal} ETH</dd></div><div><dt>Desconto</dt><dd>− {quote.data.discount} ETH</dd></div><div><dt>Taxa de rede</dt><dd>{quote.data.networkFee} ETH</dd></div></dl><Link to="/cart">Ver itens no carrinho</Link></details></section>}
      {quote.data && !quote.data.canCheckout && <p className="payment-feedback">{quote.data.items.length ? 'Revise a disponibilidade dos itens.' : 'Seu carrinho está vazio.'} <Link to="/cart">Voltar ao carrinho</Link></p>}
      {notice && <p role="alert" className="payment-feedback">{notice}</p>}
      <div className="payment-submit">{attempt ? <Button variant="default" size="plain" type="button" className="checkout-primary" disabled={!session.data || order.isPending} onClick={() => order.mutate(attempt)}>{order.isPending ? 'Recuperando pedido…' : 'Recuperar minha compra'}</Button> : <Button variant="default" size="plain" type="button" className="checkout-primary" disabled={!session.data || !wallet || !collector || !quote.data?.canCheckout || busy} onClick={() => void preparePurchase()}>{order.isPending ? 'Enviando…' : connection.isPending ? 'Conectando carteira…' : validating ? 'Conferindo valores…' : 'Confirmar compra'}</Button>}</div>
      <p className="payment-review-hint">Você poderá revisar os itens e valores antes de enviar o pedido.</p>
      </aside>
    </div>
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    <dialog ref={review} className="checkout-review" aria-labelledby="review-title" onCancel={(event) => { if (order.isPending) event.preventDefault() }}>
      <h2 id="review-title" className="text-xl font-bold">Revise sua compra</h2>
      <p className="mt-4 text-sm">{collector?.displayName}</p><p className="mt-2 text-xs text-subtle">{wallet?.nickname} · {wallet?.network} · {provider}</p>
      <ul className="payment-review-items">{reviewed?.items.map((item) => <li key={`${item.nftId}:${item.editionId}`}><img src={item.image} alt={item.name} width={44} height={44} /><span>{item.name}<small>{item.editionLabel} × {item.quantity}</small></span><strong>{item.lineTotal} ETH</strong></li>)}</ul>
      <p className="payment-review-total">Total <strong>{reviewed?.total} ETH</strong></p><p className="mt-3 text-xs text-subtle">Inclui desconto e taxa de rede. Transação simulada.</p>
      <div className="mt-6 flex flex-wrap gap-4"><Button variant="default" size="plain" type="button" className="checkout-primary" disabled={order.isPending} onClick={confirmPurchase}>{order.isPending ? 'Enviando…' : 'Confirmar compra'}</Button><Button variant="ghost" size="plain" type="button" disabled={order.isPending} onClick={() => review.current?.close()}>Voltar</Button></div>
    </dialog>
  </main>
}




