import { ShoppingCart } from 'lucide-react'
import { AuthControls } from './AuthControls'
import { SearchMenu } from './SearchMenu'
import { useQuery } from '@tanstack/react-query'
import { cartQueryKey, getCart } from '../lib/cart'
import { Link, useRouterState } from '@tanstack/react-router'
import { defaultCatalogSearch } from '../lib/catalog-options'

export function Header() {
const isMarket = useRouterState({ select: (state) => state.location.pathname.startsWith('/nft/') || state.location.hash === 'catalogo' })
const cartQuery = useQuery({
  queryKey: cartQueryKey,
  queryFn: ({ signal }) => getCart(signal),
})

const cartCount =
  cartQuery.data?.items.reduce(
    (total, item) => total + item.quantity,
    0,
  ) ?? 0
  return (
    <header className="site-header">
      <div className="header-content">
      <a href="/" className="text-sm font-bold tracking-widest">
        KURIO
      </a>

      <nav
        aria-label="Navegação principal"
        className="order-3 flex w-full items-center justify-center gap-6 text-sm md:order-none md:w-auto md:gap-10"
      >
        <a
          href="/"
          aria-current={!isMarket ? 'page' : undefined}
          className={!isMarket ? 'border-brand text-brand' : 'hover:text-brand'}
        >
          Início
        </a>

        <Link to="/" search={defaultCatalogSearch} hash="catalogo" aria-current={isMarket ? 'page' : undefined} className={isMarket ? 'border-brand text-brand' : 'hover:text-brand'}>
          Mercado
        </Link>

        <button
          type="button"
          disabled
          title="Fora do escopo do desafio"
        >
          Criadores
        </button>

        <button
          type="button"
          disabled
          title="Fora do escopo do desafio"
        >
          Aprenda
        </button>
      </nav>

      <div className="flex items-center gap-5">
        <SearchMenu />

         <Link
  to="/cart"
  aria-label={`Carrinho com ${cartCount} itens`}
  className="relative"
>
  <ShoppingCart size={22} />

  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] text-page">
    {cartQuery.isPending ? '…' : cartQuery.isError ? '!' : cartCount}
  </span>
</Link>


        <AuthControls />
      </div>
      </div>
    </header>
  )
}
