import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { AccountLayout } from '../components/AccountLayout'
import { getFavorites } from '../lib/favorites'
import { NFTCard } from '../components/NFTCard'
export function FavoritesPage() { return <AccountLayout active="favorites" title="Favoritos">{(user) => <FavoritesContent userId={user.id} />}</AccountLayout> }
function FavoritesContent({ userId }: { userId: string }) {
  const query = useQuery({ queryKey: ['favorites', userId], queryFn: ({ signal }) => getFavorites(signal) })
  return <section><h1 className="text-2xl font-bold">Lista de interesse</h1><p className="mt-3 text-xs text-subtle">Suas obras favoritas, salvas na sua conta.</p>{query.isPending ? <div role="status" aria-label="Carregando favoritos" className="nft-skeleton mt-6 h-64 rounded" /> : query.isError ? <div role="alert" className="mt-6"><p>Não foi possível carregar os favoritos.</p><button type="button" onClick={() => query.refetch()} className="mt-4 text-brand">Tentar novamente</button></div> : query.data.length ? <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-3">{query.data.map((nft) => <NFTCard key={nft.id} nft={nft} />)}</div> : <div className="wallet-history-empty"><Heart size={30} /><h2>Sua coleção de favoritos começa aqui</h2><p>Toque no coração das obras que você quer acompanhar.</p></div>}</section>
}

