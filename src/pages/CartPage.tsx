import { PurchaseSteps } from '../components/PurchaseSteps'
import {
  defaultCatalogSearch as catalogSearch,
} from '../lib/catalog-options'
import { useState } from 'react'
import { Skeleton } from '../components/ui/skeleton'
import axios from 'axios'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import {
  cartQueryKey,
  cartQuoteQueryKey,
  getCartQuote,
  mutateCart,
} from '../lib/cart'
import type { Cart } from '../types/cart'
import { CartRecommendations } from '../components/CartRecommendations'

export function CartPage() {
  const [coupon, setCoupon] = useState('')
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: cartQuoteQueryKey,
    queryFn: ({ signal }) => getCartQuote(signal),
    staleTime: 0,
  })

  const mutation = useMutation({
    mutationFn: mutateCart,
    retry: false,
    scope: { id: 'cart' },

    onSuccess: async (cart, action) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey })

      queryClient.setQueryData<Cart>(cartQueryKey, (previous) =>
        previous && previous.version > cart.version ? previous : cart,
      )

      if (action.type === 'coupon') setCoupon('')

      await queryClient.invalidateQueries({
        queryKey: cartQuoteQueryKey,
      })
    },
  })

  const errorMessage =
    axios.isAxiosError<{ message: string }>(mutation.error)
      ? mutation.error.response?.data.message ?? 'Não foi possível atualizar.'
      : 'Não foi possível atualizar.'

  if (query.isPending) {
    return (
      <main className="mx-auto max-w-[1200px] py-10">
        <div role="status" aria-label="Carregando carrinho" className="grid gap-8 lg:grid-cols-[1fr_330px]"><div className="space-y-4" aria-hidden="true">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-24 w-full" />)}</div><div className="space-y-4" aria-hidden="true"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-40 w-full" /><Skeleton className="h-12 w-full" /></div></div>
      </main>
    )
  }

  if (query.isError) {
    return (
      <main className="mx-auto max-w-[1200px] py-10">
        <p role="alert">Não foi possível carregar o carrinho.</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-4 text-brand underline"
        >
          Tentar novamente
        </button>
      </main>
    )
  }

  const quote = query.data

  return (
    <main className="cart-page mx-auto max-w-[1200px] py-8">
      <PurchaseSteps step="cart" />
      <nav aria-label="Localização" className="mb-8 text-xs">
        <Link to="/" search={catalogSearch}>Início</Link>
        {' / Mercado / Carrinho'}
      </nav>

      {quote.items.length === 0 ? (
        <div className="py-12 text-center">
          <h1 className="text-xl font-bold">Seu carrinho está vazio</h1>
          <Link
            to="/"
            search={catalogSearch}
            hash="catalogo"
            className="mt-6 inline-block text-brand"
          >
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section aria-label="Itens do carrinho">
            <div className="cart-table-header mb-3 hidden grid-cols-[minmax(0,1fr)_85px_95px_100px_30px] gap-3 border-b border-line pb-3 text-xs md:grid">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>

            {quote.items.map((item) => (
              <article
                key={`${item.nftId}:${item.editionId}`}
                className="cart-item mb-3 grid grid-cols-2 items-center gap-3 bg-panel p-3 md:grid-cols-[minmax(0,1fr)_85px_95px_100px_30px]"
              >
                <Link
                  to="/nft/$nftId"
                  params={{ nftId: item.nftId }}
                  className="cart-item-identity col-span-2 flex min-w-0 items-center gap-3 md:col-span-1"
                >
                  <img
                    src={item.image}
                    alt=""
                    width={64}
                    height={64}
                    className="cart-item-image h-16 w-16 shrink-0 rounded object-cover"
                  />
                  <div className="cart-item-info">
                    <h2 className="text-xs font-bold">{item.name}</h2>
                    <p className="mt-2 text-xs text-subtle">
                      Edição: {item.editionLabel}
                    </p>
                    <p className="cart-mobile-price">{item.lineTotal} ETH</p>
                    {item.quantity > item.stock && (
                      <p className="mt-2 text-xs text-red-300">
                        Disponíveis: {item.stock}
                      </p>
                    )}
                  </div>
                </Link>

                <p className="text-xs text-subtle">{item.unitPrice} ETH</p>

                <div className="cart-item-quantity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    aria-label={`Diminuir ${item.name}, edição ${item.editionLabel}`}
                    disabled={mutation.isPending || item.quantity <= 1 || item.stock < 1}
                    onClick={() =>
                      mutation.mutate({
                        type: 'quantity',
                        nftId: item.nftId,
                        editionId: item.editionId,
                        quantity: Math.min(item.quantity - 1, item.stock),
                      })
                    }
                    className="h-8 w-6 rounded-full bg-brand text-page disabled:opacity-40"
                  >
                    −
                  </button>

                  <output>{item.quantity}</output>

                  <button
                    type="button"
                    aria-label={`Aumentar ${item.name}, edição ${item.editionLabel}`}
                    disabled={mutation.isPending || item.quantity >= item.stock}
                    onClick={() =>
                      mutation.mutate({
                        type: 'quantity',
                        nftId: item.nftId,
                        editionId: item.editionId,
                        quantity: item.quantity + 1,
                      })
                    }
                    className="h-8 w-6 rounded-full bg-brand text-page disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <strong className="break-all text-xs text-brand">
                  {item.lineTotal} ETH
                </strong>

                <button
                  type="button"
                  aria-label={`Remover ${item.name}, edição ${item.editionLabel}`}
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      type: 'remove',
                      nftId: item.nftId,
                      editionId: item.editionId,
                    })
                  }
                  className="flex h-8 w-8 items-center justify-center text-subtle disabled:opacity-40"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </section>

          <aside  className="cart-summary">
            <h1 className="mb-5 border-b border-line pb-3 text-sm font-bold">
              Resumo da carteira
            </h1>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                mutation.mutate({ type: 'coupon', code: coupon })
              }}
            >
              <label htmlFor="coupon" className="mb-2 block text-xs">
                Código promocional
              </label>

              <div className="flex">
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  required
                  disabled={mutation.isPending}
                  placeholder="Digite o código promocional…"
                  className="min-w-0 flex-1 border border-line bg-page px-3 py-2 text-xs"
                />

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-brand px-3 py-2 text-xs font-bold text-page disabled:opacity-40"
                >
                  Aplicar
                </button>
              </div>
            </form>

            {quote.coupon && (
              <div className="mt-3 flex justify-between text-xs text-brand">
                <span>{quote.coupon}</span>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ type: 'remove-coupon' })}
                >
                  Remover cupom
                </button>
              </div>
            )}

            {mutation.isError && (
              <p role="alert" className="mt-4 text-xs text-red-300">
                {errorMessage}
              </p>
            )}

            <p role="status" className="mt-3 min-h-5 text-xs text-subtle">
              {query.isFetching ? 'Atualizando resumo…' : ''}
            </p>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <dt>Subtotal</dt><dd>{quote.subtotal} ETH</dd>
              </div>
              <div className="cart-discount">
                <dt>Desconto do lançamento
                  <span className="cart-summary-caption">{Number(quote.discount) > 0 ? 'Economia aplicada à sua compra' : 'Aplique um código promocional'}</span>
                </dt>
                <dd>{Number(quote.discount) > 0 ? '− ' : ''}{quote.discount} ETH</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Taxa de rede</dt><dd>{quote.networkFee} ETH</dd>
              </div>
              <div className="cart-grand-total">
                <dt>Total<span className="cart-summary-caption">Taxa de rede incluída</span></dt>
                <dd>{quote.total}<span>ETH</span></dd>
              </div>
            </dl>

            {!quote.canCheckout && (
              <p role="alert" className="mt-4 text-xs text-red-300">
                Ajuste ou remova os itens sem disponibilidade.
              </p>
            )}

            <Link
              to="/checkout"
              aria-disabled={!quote.canCheckout}
              onClick={(event) => { if (!quote.canCheckout) event.preventDefault() }}
              className="mt-6 block w-full rounded bg-brand py-3 text-center text-xs font-bold text-page aria-disabled:opacity-40"
            >
              Continuar para pagamento
            </Link>

            <Link
              to="/"
              search={catalogSearch}
              hash="catalogo"
              className="mt-4 block text-center text-xs text-brand"
            >
              Continuar explorando
            </Link>
          </aside>
        </div>
      )}

      <CartRecommendations />
    </main>
  )
}




