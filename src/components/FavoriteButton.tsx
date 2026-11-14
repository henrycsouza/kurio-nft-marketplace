import { getFavorites } from '../lib/favorites'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { api } from '../lib/api'
import { getSession, sessionKey } from '../lib/checkout'
import type { NFT } from '../types/nft'
import { AuthDialog } from './LazyAuthDialog'
export function FavoriteButton({ nft, compact = false }: { nft: NFT; compact?: boolean }) {
  const client = useQueryClient()
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal) })
  const favoritesKey = ['favorites', session.data?.id] as const
  const favorites = useQuery({ queryKey: favoritesKey, queryFn: ({ signal }) => getFavorites(signal), enabled: !!session.data })
  const [authOpen, setAuthOpen] = useState(false)
  const saved = favorites.data?.some((item) => item.id === nft.id) ?? false
  const mutation = useMutation({ mutationFn: async (remove: boolean) => { await api.request({ url: `/favorites/${encodeURIComponent(nft.id)}`, method: remove ? 'delete' : 'post' }) }, onMutate: async (remove) => {
    await client.cancelQueries({ queryKey: favoritesKey })
    const previous = client.getQueryData<NFT[]>(favoritesKey)
    client.setQueryData<NFT[]>(favoritesKey, (items) => remove ? (items ?? []).filter((item) => item.id !== nft.id) : [...(items ?? []).filter((item) => item.id !== nft.id), nft])
    return { previous }
  }, onError: (_error, _variables, context) => { client.setQueryData(favoritesKey, context?.previous ?? []) }, onSettled: () => client.invalidateQueries({ queryKey: favoritesKey }) })
  return <>
    <button type="button" className={compact ? 'nft-card-favorite' : 'nft-favorite'} aria-label={saved ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`} aria-pressed={saved} disabled={mutation.isPending || (!!session.data && favorites.isPending)} onClick={() => { if (!session.data) setAuthOpen(true); else mutation.mutate(saved) }}><Heart size={compact ? 16 : 18} fill={saved ? 'currentColor' : 'none'} />{!compact && (saved ? 'Favoritado' : 'Favoritar')}</button>
    {mutation.isError && <p role="alert" className="favorite-error">Não foi possível atualizar o favorito. Tente novamente.</p>}
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
  </>
}

