import { lazy, Suspense, type ComponentProps } from 'react'
import type { CatalogFilters as FiltersComponent } from './CatalogFilters'

const Filters = lazy(() => import('./CatalogFilters').then((module) => ({ default: module.CatalogFilters })))

export function CatalogFilters(props: ComponentProps<typeof FiltersComponent>) {
  return <Suspense fallback={<p role="status" className="p-5 text-sm">Carregando filtros…</p>}><Filters {...props} /></Suspense>
}
