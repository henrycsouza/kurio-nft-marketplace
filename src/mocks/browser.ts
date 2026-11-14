import { delay, http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import Decimal from 'decimal.js'
import type { NFTListResponse } from '../types/nft'
import { nfts } from './fixtures'
import { cartHandlers } from './cart'
import { cartActionHandler } from './cart-actions'
import { checkoutHandlers } from './checkout'
import { authHandlers } from './auth'
import { walletHandlers } from './wallets'
import { walletActivityHandlers } from './wallet-activity'
import { favoriteHandlers } from './favorites'
import { realtimeHandlers, restoreMarket } from './realtime'
import {
  categoryOptions,
  networkOptions,
} from '../lib/catalog-options'


// Demo controls affect only this worker and reset on a full reload.
let catalogUnavailable = false
const handlers = [
 http.post('/api/demo/catalog', async ({ request }) => {
  const body = await request.json() as { unavailable?: boolean }
  catalogUnavailable = body.unavailable === true
  return HttpResponse.json({ unavailable: catalogUnavailable })
 }),
 http.get('/api/nfts', async ({ request }) => {
  if (catalogUnavailable) return HttpResponse.json({ message: 'Catálogo temporariamente indisponível.' }, { status: 503 })
  const url = new URL(request.url)

  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const sort = url.searchParams.get('sort') ?? 'recent'
  const tab = url.searchParams.get('tab') ?? 'all'

  const categories = [...url.searchParams.getAll('categories'), ...url.searchParams.getAll('categories[]')]
  const networks = [...url.searchParams.getAll('networks'), ...url.searchParams.getAll('networks[]')]

  const minText = url.searchParams.get('minPrice') ?? '0.02'
  const maxText = url.searchParams.get('maxPrice') ?? '12.30'

  if (
    !/^\d+(\.\d{1,2})?$/.test(minText) ||
    !/^\d+(\.\d{1,2})?$/.test(maxText)
  ) {
    return HttpResponse.json(
      { message: 'Faixa de preço inválida.' },
      { status: 422 },
    )
  }

  const minPrice = new Decimal(minText)
  const maxPrice = new Decimal(maxText)

  if (minPrice.gt(maxPrice)) {
    return HttpResponse.json(
      { message: 'O preço mínimo deve ser menor que o máximo.' },
      { status: 422 },
    )
  }

  const requestedPage = Number(url.searchParams.get('page'))
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1

  const pageSize = 9

  const filtered = nfts.filter((nft) => {
    const price = new Decimal(nft.price)

    return (
      nft.name.toLowerCase().includes(q) &&
      (tab === 'new' ? nft.isNew : tab === 'trending' ? nft.isTrending : true) &&
      (categories.length === 0 || categories.includes(nft.category)) &&
      (networks.length === 0 || networks.includes(nft.network)) &&
      price.gte(minPrice) &&
      price.lte(maxPrice)
    )
  })

  if (sort === 'price-asc') {
    filtered.sort((a, b) => new Decimal(a.price).comparedTo(b.price))
  }

  if (sort === 'price-desc') {
    filtered.sort((a, b) => new Decimal(b.price).comparedTo(a.price))
  }

  const start = (page - 1) * pageSize

  await delay(500)

  return HttpResponse.json<NFTListResponse>({
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    facets: {
      categories: Object.fromEntries(
        categoryOptions.map((category) => [
          category,
          nfts.filter((nft) => nft.category === category).length,
        ]),
      ),
      networks: Object.fromEntries(
        networkOptions.map((network) => [
          network,
          nfts.filter((nft) => nft.network === network).length,
        ]),
      ),
    },
  })
}),

  http.get('/api/nfts/recommendations', async () => {
  await delay(400)

  const ids = [
    'cosmic-bloom-118',
    'violet-nomad-314',
    'ivory-baron-088',
    'golden-beat-207',
    'golden-signal-160',
  ]

  return HttpResponse.json(
    nfts.filter((nft) => ids.includes(nft.id)),
  )
}),
  http.get('/api/nfts/:nftId', async ({ params }) => {
  await delay(500)

  const nft = nfts.find((item) => item.id === params.nftId)

  if (!nft) {
    return HttpResponse.json(
      { message: 'NFT não encontrado.' },
      { status: 404 },
    )
  }

  return HttpResponse.json(nft)
}),
]

restoreMarket()
export const worker = setupWorker(
  ...realtimeHandlers,
  ...authHandlers,
  ...favoriteHandlers,
  ...walletHandlers,
  ...walletActivityHandlers,
  ...checkoutHandlers,
  ...handlers,
  ...cartHandlers,
  cartActionHandler,
)

