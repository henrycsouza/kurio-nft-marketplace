export type NFT = {
  id: string
  name: string
  image: string
  price: string
  isNew: boolean
  isTrending: boolean
  description: string
  artist: string
  network: string
  editions: NFTEdition[]  
  category: string
}

export type NFTSort = 'recent' | 'price-asc' | 'price-desc'

export type CatalogSearch = {
  q: string
  sort: NFTSort
  page: number
  tab: 'all' | 'new' | 'trending'
  categories: string[]
  networks: string[]
  minPrice: string
  maxPrice: string
}

export type NFTListResponse = {
  items: NFT[]
  total: number
  page: number
  totalPages: number
  facets: NFTFacets
}

export type NFTEdition = {
  id: string
  label: string
  stock: number
}

export type NFTFacets = {
  categories: Record<string, number>
  networks: Record<string, number>
}