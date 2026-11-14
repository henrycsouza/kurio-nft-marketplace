import { nftImageSources } from './nft-images.generated'

export const catalogImageSizes = '(min-width: 1248px) 250px, (min-width: 1024px) calc((100vw - 474px) / 3), (min-width: 600px) calc((100vw - 80px) / 3), calc((100vw - 66px) / 2)'
// On mobile this matches the first card/preload, sharing one request with the banner.
export const heroImageSizes = `(min-width: 1024px) 450px, ${catalogImageSizes}`

export function responsiveNFTImage(src: string, sizes: string) {
  return nftImageSources[src] ? { srcSet: nftImageSources[src], sizes } : {}
}
