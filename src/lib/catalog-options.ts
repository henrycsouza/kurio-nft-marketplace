import type { CatalogSearch } from '../types/nft'

export const categoryOptions = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
]

export const networkOptions = ['Ethereum', 'Polygon', 'Solana']

export const defaultCatalogSearch: CatalogSearch = {
  q: '',
  sort: 'recent',
  page: 1,
  tab: 'all',
  categories: [],
  networks: [],
  minPrice: '0.02',
  maxPrice: '12.30',
}