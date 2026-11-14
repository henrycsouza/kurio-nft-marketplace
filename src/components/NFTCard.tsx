import { Link } from '@tanstack/react-router'
import type { NFT } from '../types/nft'
import { FavoriteButton } from './FavoriteButton'
import { catalogImageSizes, responsiveNFTImage } from '../lib/nft-images'

type NFTCardProps = {
  nft: NFT
  showNewBadge?: boolean
  priority?: boolean
}

export function NFTCard({ nft, showNewBadge = false, priority = false }: NFTCardProps) {
  return (
    <article className="nft-card">
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="block"
      >
        <div className="nft-card-image flex aspect-[258/300] items-center rounded bg-panel p-1">
          {nft.isNew && showNewBadge && <span className="nft-card-badge">NOVO</span>}
          <img
            src={nft.image}
            {...responsiveNFTImage(nft.image, catalogImageSizes)}
            alt={nft.name}
            width={250}
            height={250}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="aspect-square w-full rounded-xl object-cover"
          />
        </div>

        <h3 className="mt-3 text-sm">{nft.name}</h3>

        <p className="mt-2 text-sm font-bold text-brand">
          {nft.price} ETH
        </p>
      </Link>
      <FavoriteButton nft={nft} compact />
    </article>
  )
}
