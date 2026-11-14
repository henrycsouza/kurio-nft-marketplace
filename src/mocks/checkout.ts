import { readWallets } from './wallets'
import { readSession as session, sessionStorageKey } from './auth'
import { recordWalletActivity } from './wallet-activity-store'
import { delay, http, HttpResponse } from 'msw'
import { buildCartQuote } from './cart-actions'
import { cartFrom } from '../lib/cart-contract'
import { readJson } from './storage'
import type { CheckoutRequest, Order, Session } from '../types/checkout'
import { publish } from './events'
const fail = (message: string, status = 422) => HttpResponse.json({ message }, { status })
function orderKey(user: Session, id: string) { return `kurio.mock.order.${user.id}.${id}` }
function scheduleOrder(user: Session, order: Order) {
  if (order.status !== 'pending') return
  const timer = setTimeout(() => settleOrder(user, order.id), Math.max(0, order.settlesAt - Date.now()) + 20)
  if (typeof timer === 'object' && 'unref' in timer) (timer as { unref: () => void }).unref()
}
function settleOrder(user: Session, id: string) {
  const saved = localStorage.getItem(orderKey(user, id))
  if (!saved) return null
  const order = JSON.parse(saved) as Order
  if (order.status !== 'pending' || Date.now() < order.settlesAt) return order
  order.status = order.outcome
  if (order.status === 'confirmed') {
    const cartKey = `kurio.mock.cart.user.${user.id}`
    const cart = cartFrom(readJson(cartKey))
    cart.items = cart.items.flatMap((item) => {
      const bought = order.quote.items.find((line) => line.nftId === item.nftId && line.editionId === item.editionId)
      const quantity = item.quantity - (bought?.quantity ?? 0)
      return quantity > 0 ? [{ ...item, quantity }] : []
    })
    cart.version += 1
    if (!cart.items.length) delete cart.coupon
    localStorage.setItem(cartKey, JSON.stringify(cart))
  }
  localStorage.setItem(orderKey(user, order.id), JSON.stringify(order))
  const event = { id: `${order.id}:2`, resourceId: order.id, userId: user.id, version: 2, status: order.status }
  publish('order.updated', event)
  return order
}
export const checkoutHandlers = [
  http.post('/api/wallets/connect', async ({ request }) => {
    if (!session(request)) return fail('Sua sessão expirou. Entre novamente.', 401)
    const body = await request.json() as { walletId: string; refuse: boolean; provider?: string }
    await delay(400)
    if (body.refuse) return fail('Conexão recusada na carteira.', 409)
    const wallet = readWallets(request).find((item) => item.id === body.walletId)
    if (!wallet) return fail('Carteira não encontrada.', 404)
    if (body.provider && !['WalletConnect', 'MetaMask', 'Coinbase Wallet'].includes(body.provider)) return fail('Conexão de carteira inválida.')
    if (localStorage.getItem(`${sessionStorageKey(request)}.connection`) !== wallet.id) {
      recordWalletActivity(request, { kind: 'connected', title: 'Carteira conectada', walletId: wallet.id, walletLabel: wallet.label, network: wallet.network })
    }
    localStorage.setItem(`${sessionStorageKey(request)}.connection`, wallet.id)
    localStorage.setItem(`${sessionStorageKey(request)}.connection-provider`, body.provider ?? wallet.type)
    return HttpResponse.json(wallet)
  }),
  http.delete('/api/wallets/connect', ({ request }) => {
    if (!session(request)) return fail('Entre novamente para continuar.', 401)
    const id = localStorage.getItem(`${sessionStorageKey(request)}.connection`)
    const wallet = readWallets(request).find((item) => item.id === id)
    if (wallet) recordWalletActivity(request, { kind: 'disconnected', title: 'Carteira desconectada', walletId: wallet.id, walletLabel: wallet.label, network: wallet.network })
    localStorage.removeItem(`${sessionStorageKey(request)}.connection`)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('/api/orders', async ({ request }) => {
    const user = session(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    const key = request.headers.get('Idempotency-Key')
    if (!key) return fail('Chave de idempotência obrigatória.')
    const body = await request.json() as CheckoutRequest
    const attemptKey = `kurio.mock.attempt.${user.id}.${key}`
    const previous = localStorage.getItem(attemptKey)
    if (previous) {
      const attempt = JSON.parse(previous) as { payload: string; id: string }
      if (attempt.payload !== JSON.stringify(body)) return fail('Esta tentativa já foi usada com outros dados.', 409)
      return HttpResponse.json(JSON.parse(localStorage.getItem(orderKey(user, attempt.id))!))
    }
    if (localStorage.getItem(`${sessionStorageKey(request)}.connection`) !== body.walletId) return fail('Conecte sua carteira antes de confirmar.', 409)
    const wallet = readWallets(request).find((item) => item.id === body.walletId)
    if (!wallet || !body.collector?.displayName?.trim() || !body.collector.username?.trim() || !body.collector.profileName?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.collector.email)) return fail('Confira os dados do colecionador e a carteira.')
    let quote
    try { quote = buildCartQuote(request) } catch { return fail('Item indisponível.', 409) }
    if (!quote.canCheckout || JSON.stringify(quote) !== JSON.stringify(body.quote)) return HttpResponse.json({ message: 'A cotação mudou. Revise os valores e confirme novamente.', quote }, { status: 409 })
    const order: Order = { id: crypto.randomUUID(), userId: user.id, status: 'pending', createdAt: new Date().toISOString(), settlesAt: Date.now() + 2500, transaction: `sim-${crypto.randomUUID()}`, quote, collector: body.collector, wallet: { ...wallet, provider: localStorage.getItem(`${sessionStorageKey(request)}.connection-provider`) ?? wallet.type }, outcome: body.scenario === 'declined' ? 'declined' : 'confirmed' }
    localStorage.setItem(orderKey(user, order.id), JSON.stringify(order))
    localStorage.setItem(attemptKey, JSON.stringify({ payload: JSON.stringify(body), id: order.id }))
    // The simulated server settles independently of reads. REST reconciles after refresh.
    scheduleOrder(user, order)
    if (body.scenario === 'timeout') return HttpResponse.error()
    await delay(400)
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get('/api/orders/:id', async ({ request, params }) => {
    const user = session(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    await delay(150)
    const order = settleOrder(user, String(params.id))
    if (!order) return fail('Pedido não encontrado.', 404)
    scheduleOrder(user, order)
    return HttpResponse.json(order)
  }),
]




