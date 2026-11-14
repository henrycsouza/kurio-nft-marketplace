import axios from 'axios'
import type { CatalogSearch, NFT, NFTListResponse } from '../types/nft'
import { whenBackendReady } from './backend-ready'


export const guestId =
  localStorage.getItem('kurio.guestId') ?? crypto.randomUUID()

localStorage.setItem('kurio.guestId', guestId)

export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: {
    'X-Guest-Id': guestId,
  },
})

api.interceptors.request.use(async (config) => {
  await whenBackendReady()
  return config
})

export async function getNFTs(
  filters: CatalogSearch,
  signal?: AbortSignal,
) {
  const response = await api.get<NFTListResponse>('/nfts', {
    params: filters,
    paramsSerializer: { indexes: null },
    signal,
  })

  const data = response.data
  if (!data || !Array.isArray(data.items) || !Number.isInteger(data.total) || !Number.isInteger(data.totalPages)) {
    throw new Error('Resposta inválida do catálogo. Tente carregar novamente.')
  }
  return data
}

export async function getNFT(
  nftId: string,
  signal?: AbortSignal,
) {
  const response = await api.get<NFT>(
    `/nfts/${encodeURIComponent(nftId)}`,
    { signal },
  )

  return response.data
}

export async function getRecommendations(signal?: AbortSignal) {
  const response = await api.get<NFT[]>('/nfts/recommendations', {
    signal,
  })

  return response.data
}
