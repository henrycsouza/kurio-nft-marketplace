import { Skeleton } from './ui/skeleton'
import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { catalogQueryOptions } from '../lib/catalog-query'
import { NFTCard } from './NFTCard'
import { CatalogFilters } from './LazyCatalogFilters'
import { useDesktopLayout } from '../lib/useDesktopLayout'
import { FeaturedNFT } from './HomeSections'
import type { CatalogSearch, NFTSort } from '../types/nft'


export function Catalog() {
  const desktop = useDesktopLayout()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })


  const query = useQuery(catalogQueryOptions(search))

  const totalPages = query.data?.totalPages

  useEffect(() => {
    if (totalPages && search.page > totalPages) {
      void navigate({
        search: (previous) => ({ ...previous, page: totalPages }),
        replace: true,
        resetScroll: false,
      })
    }
  }, [totalPages, search.page, navigate])

  function updateFilters(
  filters: Partial<Omit<CatalogSearch, 'page'>>,
) {
  void navigate({
    search: (previous) => ({
      ...previous,
      ...filters,
      page: 1,
    }),
    resetScroll: false,
  })
}

  function changePage(page: number) {
    void navigate({
      search: (previous) => ({ ...previous, page }),
      resetScroll: false,
    })
  }

  return (
    <section
      id="catalogo"
      aria-label="Catálogo de NFTs"
      className="my-16 grid gap-8 lg:my-24 lg:grid-cols-[310px_1fr] lg:gap-12"
    >
      <h2 className="sr-only">Catálogo de NFTs</h2>
      <div className="catalog-sidebar min-w-0 self-start">
        {desktop && <>
        <CatalogFilters
          filters={search}
          facets={query.data?.facets}
          onChange={updateFilters}
        />
        <FeaturedNFT />
        </>}
      </div>

      <div>
        <div className="catalog-toolbar mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-line">
          <div
            aria-label="Listas do catálogo"
            className="flex gap-4 text-xs md:gap-5 md:text-sm"
          >
            {([
              ['all', 'Todos os NFTs'],
              ['new', 'Novos lançamentos'],
              ['trending', 'Em alta'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={search.tab === value}
                onClick={() => updateFilters({ tab: value })}
                className={`whitespace-nowrap border-b-2 pb-3 ${
                  search.tab === value
                    ? 'border-brand text-brand'
                    : 'border-transparent text-copy hover:text-brand'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="catalog-sort mb-3 flex items-center gap-2 text-xs">
            Ordenar por:

            <select
              value={search.sort}
              onChange={(event) =>
                updateFilters({ sort: event.target.value as NFTSort })
              }
              className="max-w-full bg-page text-copy"
            >
              <option value="recent">Listados recentemente</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </label>
        </div>
        {query.isPending ? (
          <div className="catalog-grid grid grid-cols-2 gap-5 md:grid-cols-3" role="status" aria-label="Carregando NFTs">{Array.from({ length: 6 }, (_, index) => <div key={index} aria-hidden="true"><Skeleton className="nft-skeleton aspect-square rounded-xl" /><Skeleton className="nft-skeleton mt-3 h-4 w-3/4 rounded" /><Skeleton className="nft-skeleton mt-2 h-4 w-1/2 rounded" /></div>)}</div>
        ) : query.isError ? (
          <div role="alert">
            <p>Não foi possível carregar os NFTs.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-3 text-brand underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <p className="catalog-result-count mb-4 text-xs text-subtle" role="status">
              {query.isFetching
                ? 'Atualizando…'
                : `${query.data.total} NFTs encontrados`}
            </p>

            {query.data.items.length === 0 ? (
              <p>Nenhum NFT encontrado. Tente outra busca.</p>
            ) : (
              <div className="catalog-grid grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px]">
  {query.data.items.map((nft, index) => (
    <NFTCard key={nft.id} nft={nft} priority={index < 2} showNewBadge={search.tab === 'all' && index === 0} />
  ))}
</div>
            )}

            <nav
              aria-label="Paginação"
              className="mt-20 flex flex-wrap justify-end gap-2 text-sm"
            >
              {Array.from(
                { length: query.data.totalPages },
                (_, index) => index + 1,
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-label={`Página ${page}`}
                  aria-current={search.page === page ? 'page' : undefined}
                  onClick={() => changePage(page)}
                  className={`flex h-[35px] w-[35px] items-center justify-center border ${
                    search.page === page
                      ? 'border-brand bg-brand text-page'
                      : 'border-line text-subtle hover:border-brand'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </section>
  )
}

