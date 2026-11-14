import { useId, useState } from 'react'
import { Slider } from './ui/slider'
import {
  categoryOptions,
  networkOptions,
  defaultCatalogSearch,
} from '../lib/catalog-options'
import type { CatalogSearch, NFTFacets } from '../types/nft'

type SidebarFilters = Pick<
  CatalogSearch,
  'categories' | 'networks' | 'minPrice' | 'maxPrice'
>

type CatalogFiltersProps = {
  filters: CatalogSearch
  facets?: NFTFacets
  onChange: (filters: Partial<SidebarFilters>) => void
}

function toggle(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

export function CatalogFilters(props: CatalogFiltersProps) {
  const filters = {
    ...defaultCatalogSearch,
    ...props.filters,
    categories: Array.isArray(props.filters.categories) ? props.filters.categories : [],
    networks: Array.isArray(props.filters.networks) ? props.filters.networks : [],
  }
  return (
    <CatalogFiltersContent
      key={`${filters.minPrice}:${filters.maxPrice}`}
      {...props}
      filters={filters}
    />
  )
}

function CatalogFiltersContent({
  filters,
  facets,
  onChange,
}: CatalogFiltersProps) {
  const priceLabelId = useId()

  const [range, setRange] = useState([
    Number(filters.minPrice),
    Number(filters.maxPrice),
  ])

  const hasFilters =
    filters.categories.length > 0 ||
    filters.networks.length > 0 ||
    range[0] !== 0.02 ||
    range[1] !== 12.3

  return (
    <aside
      aria-label="Filtros do catálogo"
      className="min-w-0 self-start bg-panel p-5"
    >
      <div className="space-y-10">
        <fieldset>
          <legend className="mb-3 text-lg font-bold leading-4">
            Coleções
          </legend>

          {categoryOptions.map((category) => (
            <label
              key={category}
              className={`flex cursor-pointer items-center justify-between px-3 text-[15px] leading-[40px] focus-within:outline-2 focus-within:outline-brand ${
                filters.categories.includes(category)
                  ? 'text-brand'
                  : 'text-subtle'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.categories.includes(category)}
                onChange={() =>
                  onChange({
                    categories: toggle(filters.categories, category),
                  })
                }
              />

              <span>{category}</span>
              <span className="w-10 text-right">
                ({facets?.categories[category] ?? '…'})
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend
            id={priceLabelId}
            className="mb-3 text-lg font-bold leading-4"
          >
            Faixa de preço
          </legend>

          <div className="pl-3">
            <Slider
              aria-labelledby={priceLabelId}
              thumbLabels={[
                'Preço mínimo em ETH',
                'Preço máximo em ETH',
              ]}
              min={0.02}
              max={12.3}
              step={0.01}
              value={range}
              onValueChange={(value) => {
                if (Array.isArray(value)) setRange(value)
              }}
            />

            <p className="mt-3 text-[15px] leading-[18px]">
              Preço: {range[0].toFixed(2).replace('.', ',')}
              {' – '}
              {range[1].toFixed(2).replace('.', ',')} ETH
            </p>

            <button
              type="button"
              onClick={() =>
                onChange({
                  minPrice: range[0].toFixed(2),
                  maxPrice: range[1].toFixed(2),
                })
              }
              className="mt-3 rounded-md bg-brand px-3 py-2 text-base font-bold leading-5 text-page hover:brightness-110"
            >
              Aplicar
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-bold leading-4">
            Rede
          </legend>

          {networkOptions.map((network) => (
            <label
              key={network}
              className={`flex cursor-pointer items-center justify-between px-3 text-[15px] leading-[40px] focus-within:outline-2 focus-within:outline-brand ${
                filters.networks.includes(network)
                  ? 'text-brand'
                  : 'text-subtle'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.networks.includes(network)}
                onChange={() =>
                  onChange({
                    networks: toggle(filters.networks, network),
                  })
                }
              />

              <span>{network}</span>
              <span className="w-10 text-right">
                ({facets?.networks[network] ?? '…'})
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {hasFilters && (
        <button
          type="button"
          className="mt-8 text-xs text-brand underline"
          onClick={() => {
            setRange([0.02, 12.3])

            onChange({
              categories: [],
              networks: [],
              minPrice: defaultCatalogSearch.minPrice,
              maxPrice: defaultCatalogSearch.maxPrice,
            })
          }}
        >
          Limpar filtros
        </button>
      )}
    </aside>
  )
}
