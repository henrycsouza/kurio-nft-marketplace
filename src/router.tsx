import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
} from '@tanstack/react-router'
import App from './App'
import { Hero } from './components/Hero'
import { Catalog } from './components/Catalog'
import { HomeSections } from './components/HomeSections'
import type { CatalogSearch } from './types/nft'
import Decimal from 'decimal.js'
import { safeReturnTo } from './lib/auth-navigation'
import { getSession, sessionKey } from './lib/checkout'
import { queryClient } from './lib/query-client'
import { catalogQueryOptions } from './lib/catalog-query'
import {
  categoryOptions,
  networkOptions,
  defaultCatalogSearch,
} from './lib/catalog-options'

const NFTDetails = lazyRouteComponent(() => import('./pages/NFTDetails'), 'NFTDetails')
const CartPage = lazyRouteComponent(() => import('./pages/CartPage'), 'CartPage')
const ProfilePage = lazyRouteComponent(() => import('./pages/ProfilePage'), 'ProfilePage')
const WalletsPage = lazyRouteComponent(() => import('./pages/WalletsPage'), 'WalletsPage')
const SettingsPage = lazyRouteComponent(() => import('./pages/SettingsPage'), 'SettingsPage')
const FavoritesPage = lazyRouteComponent(() => import('./pages/FavoritesPage'), 'FavoritesPage')
const CheckoutPage = lazyRouteComponent(() => import('./pages/CheckoutPage'), 'CheckoutPage')
const OrderPage = lazyRouteComponent(() => import('./pages/OrderPage'), 'OrderPage')
const LoginPage = lazyRouteComponent(() => import('./pages/LoginPage'), 'LoginPage')
const SessionError = lazyRouteComponent(() => import('./pages/LoginPage'), 'SessionError')

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: () => (
    <main className="py-16 text-center">
      <h1>Página não encontrada</h1>
      <a href="/" className="mt-4 inline-block text-brand">
        Voltar ao início
      </a>
    </main>
  ),
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Starts before the component tree mounts, without blocking the page or its error UI.
  beforeLoad: ({ search }) => { void queryClient.prefetchQuery(catalogQueryOptions(search)) },
  component: () => (
    <main className="mx-auto max-w-[1200px]">
      <Hero />
      <Catalog />
      <HomeSections />
    </main>
  ),
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
  function readList(value: unknown, options: string[]) {
    const values = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? [value]
        : []

    return [...new Set(
      values.filter(
        (item): item is string =>
          typeof item === 'string' && options.includes(item),
      ),
    )]
  }

  function readPrice(value: unknown, fallback: string) {
    const text = String(value ?? '')

    if (!/^\d+(\.\d{1,2})?$/.test(text)) return fallback

    const price = new Decimal(text)

    return price.gte('0.02') && price.lte('12.30')
      ? price.toFixed(2)
      : fallback
  }

  const page = Number(search.page)
  const minPrice = readPrice(search.minPrice, '0.02')
  const maxPrice = readPrice(search.maxPrice, '12.30')

  return {
    ...defaultCatalogSearch,
    q: typeof search.q === 'string' ? search.q : '',
    sort:
      search.sort === 'price-asc' || search.sort === 'price-desc'
        ? search.sort
        : 'recent',
    tab:
      search.tab === 'new' || search.tab === 'trending'
        ? search.tab
        : 'all',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    categories: readList(search.categories, categoryOptions),
    networks: readList(search.networks, networkOptions),
    minPrice,
    maxPrice: Decimal.max(minPrice, maxPrice).toFixed(2),
  }
},
  
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NFTDetails,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', validateSearch: (search: Record<string, unknown>) => ({ redirect: safeReturnTo(search.redirect) }), component: LoginPage })
const privateRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  errorComponent: SessionError,
  beforeLoad: async ({ location, abortController }) => {
    const session = await getSession(abortController.signal)
    queryClient.setQueryData(sessionKey, session)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href }, replace: true })
  },
})
const checkoutRoute = createRoute({ getParentRoute: () => privateRoute, path: '/checkout', component: CheckoutPage })
const profileRoute = createRoute({ getParentRoute: () => privateRoute, path: '/profile', component: ProfilePage })
const walletsRoute = createRoute({ getParentRoute: () => privateRoute, path: '/wallets', component: WalletsPage })
const settingsRoute = createRoute({ getParentRoute: () => privateRoute, path: '/settings', component: SettingsPage })
const favoritesRoute = createRoute({ getParentRoute: () => privateRoute, path: '/favorites', component: FavoritesPage })
const orderRoute = createRoute({ getParentRoute: () => privateRoute, path: '/orders/$orderId', component: OrderPage })

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, nftRoute, cartRoute, loginRoute, privateRoute.addChildren([checkoutRoute, orderRoute, profileRoute, walletsRoute, settingsRoute, favoritesRoute])]),
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
