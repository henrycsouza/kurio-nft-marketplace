import { queryOptions } from '@tanstack/react-query'
import type { CatalogSearch } from '../types/nft'
import { getNFTs } from './api'

export function catalogQueryOptions(search: CatalogSearch) {
  return queryOptions({
    queryKey: ['nfts', search],
    queryFn: ({ signal }) => getNFTs(search, signal),
  })
}
