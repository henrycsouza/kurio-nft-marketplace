import { lazy, Suspense } from 'react'
import type { AuthMode } from '../lib/auth'

const Dialog = lazy(() => import('./AuthDialog').then((module) => ({ default: module.AuthDialog })))

export function AuthDialog(props: { initialMode?: AuthMode; onClose: () => void }) {
  return <Suspense fallback={<span role="status" className="sr-only">Abrindo autenticação…</span>}><Dialog {...props} /></Suspense>
}
