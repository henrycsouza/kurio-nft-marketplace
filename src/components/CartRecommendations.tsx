import { useQuery } from '@tanstack/react-query'
import { getRecommendations } from '../lib/api'
import { NFTCard } from './NFTCard'

export function CartRecommendations() {
  const query = useQuery({
    queryKey: ['nfts', 'cart-recommendations'],
    queryFn: ({ signal }) => getRecommendations(signal),
  })

  return (
    <section className="cart-recommendations">
      <h2>Colecionadores também viram</h2>

      {query.isPending ? (
        <div
          className="cart-recommendations-grid"
          role="status"
          aria-label="Carregando sugestões"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} aria-hidden="true">
              <div className="nft-skeleton aspect-[258/300] rounded" />
              <div className="nft-skeleton mt-3 h-5 w-3/4 rounded" />
              <div className="nft-skeleton mt-2 h-5 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="py-8">
          <p>Não foi possível carregar as sugestões.</p>

          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 text-brand underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="cart-recommendations-grid">
          {query.data.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </section>
  )
}