import { Outlet, useRouterState } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useDesktopLayout } from './lib/useDesktopLayout'
import { Footer } from './components/Footer'
import { MobileChrome } from './components/MobileChrome'
import { InterfacePreferences } from './components/InterfacePreferences'
import { SessionSync } from './components/SessionSync'

const Header = lazy(() => import('./components/Header').then((module) => ({ default: module.Header })))
const RealtimeSync = lazy(() => import('./components/RealtimeSync').then((module) => ({ default: module.RealtimeSync })))

function App() {
  const desktop = useDesktopLayout()
  const path = useRouterState({ select: (state) => state.location.pathname })
  const layout = path.startsWith('/nft/') || path === '/login' || path === '/cart' || path === '/checkout' || path.startsWith('/orders/') ? 'focused' : path === '/' ? 'home' : 'account'
  return (
    <div className="app-shell min-h-screen" data-layout={layout} data-mobile-page={path === '/settings' || path === '/profile' ? 'account-form' : undefined}>
      {desktop && <Suspense fallback={<div aria-hidden="true" className="h-[85px] border-b border-line" />}><Header /></Suspense>}
      <SessionSync />
      <InterfacePreferences />
      <Suspense fallback={null}><RealtimeSync /></Suspense>
      <MobileChrome />
      <Outlet />
      <Footer />
    </div>
  )
}

export default App


