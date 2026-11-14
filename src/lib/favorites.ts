import { api } from './api'
import type { NFT } from '../types/nft'
export async function getFavorites(signal?: AbortSignal) {
  const { data } = await api.get<NFT[]>('/favorites', { signal })
  if (!Array.isArray(data)) throw new Error('Não foi possível ler os favoritos. Tente novamente.')
  return data
}
