import { PurchaseSteps } from '../components/PurchaseSteps'
import { PurchaseConfirmation } from '../components/PurchaseConfirmation'
import { useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrder, getSession, sessionKey } from '../lib/checkout'
import { cartQueryKey, cartQuoteQueryKey } from '../lib/cart'
export function OrderPage() {
  const { orderId } = useParams({ from: '/_authenticated/orders/$orderId' })
  const client = useQueryClient()
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal), staleTime: 0 })
  const query = useQuery({ queryKey: ['order', session.data?.id, orderId], queryFn: ({ signal }) => getOrder(orderId, signal), enabled: !!session.data })
  const status = query.data?.status
  useEffect(() => { if (status === 'confirmed') { void client.invalidateQueries({ queryKey: cartQueryKey }); void client.invalidateQueries({ queryKey: cartQuoteQueryKey }) } }, [status, client])
  if (session.isPending || (session.data && query.isPending)) return <main className="mx-auto py-12"><div role="status" aria-label="Carregando pedido" className="nft-skeleton h-72 rounded" /></main>
  if (!session.data) return <main className="mx-auto py-12"><p>Entre novamente para consultar seu pedido.</p><Link to="/checkout" className="text-brand">Entrar e retomar</Link></main>
  if (query.isError || !query.data) return <main className="mx-auto py-12"><p role="alert">Não foi possível consultar o pedido.</p><button onClick={() => query.refetch()} className="mt-4 text-brand">Tentar novamente</button></main>
  const order = query.data
  return <main className="mx-auto py-12"><PurchaseSteps step={order.status === 'confirmed' ? 'complete' : 'payment'} status={order.status} /><section className="checkout-receipt"><p className="text-xs text-subtle">Pedido simulado · {order.id}</p><h1 className="mt-4 text-2xl font-bold" role="status">{order.status === 'confirmed' ? 'Compra confirmada' : order.status === 'declined' ? 'Pagamento recusado' : 'Pagamento em processamento…'}</h1><p className="mt-4 text-sm text-subtle">{order.status === 'confirmed' ? 'Sua compra foi confirmada pela API simulada.' : order.status === 'declined' ? 'Seus itens continuam no carrinho. Você pode tentar novamente.' : 'Você pode atualizar esta página: o mesmo pedido será recuperado.'}</p><div className="mt-8 space-y-4">{order.quote.items.map((item) => <div className="checkout-line" key={`${item.nftId}:${item.editionId}`}><img src={item.image} alt={item.name} width={52} height={52} /><div>{item.name}<p className="text-xs text-subtle">{item.editionLabel} × {item.quantity}</p></div><strong>{item.lineTotal} ETH</strong></div>)}</div><dl className="checkout-totals mt-6"><div><dt>Subtotal</dt><dd>{order.quote.subtotal} ETH</dd></div><div><dt>Desconto</dt><dd>− {order.quote.discount} ETH</dd></div><div><dt>Taxa de rede</dt><dd>{order.quote.networkFee} ETH</dd></div><div className="checkout-total"><dt>Total</dt><dd>{order.quote.total} ETH</dd></div></dl>{order.status === 'confirmed' && <p className="mt-6 break-all text-xs text-subtle">Transação simulada: {order.transaction}<br />{order.wallet.label} · {order.wallet.network}</p>}<Link to="/cart" className="mt-8 inline-block text-brand">{order.status === 'declined' ? 'Voltar ao carrinho e tentar novamente' : 'Voltar ao carrinho'}</Link></section><PurchaseConfirmation key={order.id} order={order} /></main>
}



