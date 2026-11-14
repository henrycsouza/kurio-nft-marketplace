import { useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { defaultCatalogSearch } from '../lib/catalog-options'

export function SearchMenu() {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const navigate = useNavigate()
  const search = useSearch({ strict: false })

  return (
    <details
      ref={detailsRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && detailsRef.current) {
          detailsRef.current.open = false
          detailsRef.current.querySelector('summary')?.focus()
        }
      }}
    >
      <summary
        aria-label="Buscar NFTs"
        className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"
      >
        <Search size={20} />
      </summary>

      <form
        className="absolute right-0 top-10 z-20 w-72 max-w-[calc(100vw-3rem)] border border-line bg-panel p-4 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault()

          const data = new FormData(event.currentTarget)

          void navigate({
            to: '/',
            search: (previous) => ({
              categories: previous.categories ?? [],
              networks: previous.networks ?? [],
              minPrice: previous.minPrice ?? defaultCatalogSearch.minPrice,
              maxPrice: previous.maxPrice ?? defaultCatalogSearch.maxPrice,
              sort: previous.sort ?? 'recent',
              tab: previous.tab ?? 'all',
              q: String(data.get('q') ?? '').trim(),
              page: 1,
            }),
            hash: 'catalogo',
          })

          if (detailsRef.current) detailsRef.current.open = false
        }}
      >
        <label htmlFor="header-search" className="mb-3 block text-sm">
          Buscar NFTs
        </label>

        <input
          key={search.q ?? ''}
          id="header-search"
          name="q"
          type="search"
          defaultValue={search.q ?? ''}
          placeholder="Nome do NFT"
          className="w-full rounded border border-line bg-page px-3 py-2 text-sm"
        />

        <button
          type="submit"
          className="mt-3 w-full rounded bg-brand py-2 text-sm font-bold text-page"
        >
          Buscar
        </button>
      </form>
    </details>
  )
}
