import { useRef, useState } from 'react'
import { Link, useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Heart, Home, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { defaultCatalogSearch } from '../lib/catalog-options'
import { getNFTs } from '../lib/api'
import { cartQueryKey, getCart } from '../lib/cart'
import { CatalogFilters } from './LazyCatalogFilters'
import type { CatalogSearch, NFTSort } from '../types/nft'

export function MobileChrome() {
  const drawer = useRef<HTMLDialogElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeDrawer = () => { if (desktop.matches && drawer.current?.open) drawer.current.close() }
    desktop.addEventListener('change', closeDrawer)
    return () => desktop.removeEventListener('change', closeDrawer)
  }, [])
  const search = useSearch({ strict: false })
  const location = useRouterState({ select: (state) => state.location })
  const navigate = useNavigate()
  const filters: CatalogSearch = { q: search.q ?? '', sort: search.sort ?? 'recent', tab: search.tab ?? 'all', page: search.page ?? 1, categories: search.categories ?? [], networks: search.networks ?? [], minPrice: search.minPrice ?? defaultCatalogSearch.minPrice, maxPrice: search.maxPrice ?? defaultCatalogSearch.maxPrice }
  const query = useQuery({ queryKey: ['nfts', filters], queryFn: ({ signal }) => getNFTs(filters, signal), enabled: filtersOpen })
  const cart = useQuery({ queryKey: cartQueryKey, queryFn: ({ signal }) => getCart(signal) })
  const count = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  function updateFilters(next: Partial<CatalogSearch>) { void navigate({ to: '/', search: { ...filters, ...next, page: 1 }, hash: 'catalogo', resetScroll: false }) }
  const active = location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname.startsWith('/orders/') ? 'cart' : location.pathname === '/favorites' ? 'favorites' : ['/profile', '/settings', '/wallets'].includes(location.pathname) ? 'profile' : location.pathname.startsWith('/nft/') || location.hash === 'catalogo' ? 'market' : 'home'
  const isCatalog = location.pathname === '/'
  const focused = location.pathname.startsWith('/nft/') || ['/login', '/cart', '/checkout'].includes(location.pathname) || location.pathname.startsWith('/orders/')
  const pageTitle = location.pathname === '/login' ? 'Entrar na conta' : location.pathname === '/settings' ? 'Configurações' : location.pathname === '/profile' ? 'Meu perfil' : location.pathname === '/wallets' ? 'Minhas carteiras' : location.pathname === '/cart' ? 'Carrinho de NFTs' : location.pathname === '/checkout' ? 'Pagamento com carteira' : location.pathname === '/favorites' ? 'Lista de interesse' : location.pathname.startsWith('/orders/') ? 'Seu pedido' : ''
  function back() {
    if (location.pathname === '/checkout' || location.pathname.startsWith('/orders/')) void navigate({ to: '/cart' })
    else if (location.pathname === '/settings' || location.pathname === '/wallets') void navigate({ to: '/profile' })
    else void navigate({ to: '/', search: defaultCatalogSearch, hash: 'catalogo' })
  }
  return <>
    {isCatalog ? <header className="mobile-topbar">
      <form role="search" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); updateFilters({ q: String(data.get('q') ?? '').trim() }) }}>
        <button type="submit" aria-label="Buscar coleções"><Search size={19} /></button>
        <label className="sr-only" htmlFor="mobile-catalog-search">Explorar coleções</label>
        <input key={filters.q} id="mobile-catalog-search" name="q" type="search" placeholder="Explorar coleções" defaultValue={filters.q} />
      </form>
      <button type="button" className="mobile-filter-trigger" aria-label="Abrir filtros e ordenação" aria-haspopup="dialog" onClick={() => { setFiltersOpen(true); drawer.current?.showModal() }}><SlidersHorizontal size={20} />{filters.categories.length + filters.networks.length > 0 && <span>{filters.categories.length + filters.networks.length}</span>}</button>
    </header> : <header className="mobile-pagebar"><button type="button" aria-label="Voltar" onClick={back}><ChevronLeft size={19} /></button><p>{pageTitle}</p><span className="mobile-pagebar-spacer" /></header>}
    {!focused && !['/settings', '/profile'].includes(location.pathname) && <nav className="mobile-bottom-nav" aria-label="Navegação principal no celular">
      <Link to="/" search={defaultCatalogSearch} aria-label="Início" aria-current={active === 'home' ? 'page' : undefined}><Home size={21} /><span className="sr-only">Início</span></Link>
      <Link to="/favorites" aria-label="Favoritos" aria-current={active === 'favorites' ? 'page' : undefined}><Heart size={21} /><span className="sr-only">Favoritos</span></Link>
      <Link to="/" search={defaultCatalogSearch} hash="catalogo" className="mobile-market-button" aria-label="Explorar mercado" aria-current={active === 'market' ? 'page' : undefined}><ShoppingBag size={24} /><span className="sr-only">Mercado</span></Link>
      <Link to="/cart" aria-label={`Carrinho com ${count} itens`} aria-current={active === 'cart' ? 'page' : undefined}><ShoppingCart size={21} />{count > 0 && <span className="mobile-cart-count">{count > 99 ? '99+' : count}</span>}<span className="sr-only">Carrinho</span></Link>
      <Link to="/profile" aria-label="Minha conta" aria-current={active === 'profile' ? 'page' : undefined}><UserRound size={21} /><span className="sr-only">Minha conta</span></Link>
    </nav>}
    <dialog ref={drawer} className="mobile-filter-drawer" aria-labelledby="mobile-filters-title" onClose={() => setFiltersOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) drawer.current?.close() }}>
      <header><h2 id="mobile-filters-title">Filtros e ordenação</h2><button type="button" autoFocus aria-label="Fechar filtros" onClick={() => drawer.current?.close()}><X size={22} /></button></header>
      <label className="mobile-sort-label" htmlFor="mobile-sort">Ordenar por<select id="mobile-sort" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as NFTSort })}><option value="recent">Listados recentemente</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label>
      {filtersOpen && <CatalogFilters filters={filters} facets={query.data?.facets} onChange={updateFilters} />}
      {query.isError && <p role="alert" className="px-5 text-xs text-red-300">Não foi possível atualizar os resultados. <button type="button" onClick={() => query.refetch()}>Tentar novamente</button></p>}
      <footer><button type="button" className="checkout-primary" onClick={() => drawer.current?.close()}>{query.isFetching ? 'Ver resultados' : `Ver ${query.data?.total ?? ''} resultados`}</button></footer>
    </dialog>
  </>
}




