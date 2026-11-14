import type { NFT } from '../types/nft'

import emeraldImage from '../assets/nft-hero.webp'
import sageImage from '../assets/sage-nomad.webp'
import ivoryImage from '../assets/ivory-baron.webp'
import goldenImage from '../assets/golden-signal.webp'
import {
  categoryOptions,
  networkOptions,
} from '../lib/catalog-options'

 const firstPage: NFT[] = [
  {
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    image: emeraldImage,
    price: '1.19',
  },
  {
    id: 'sage-nomad-009',
    name: 'Sage Nomad #009',
    image: sageImage,
    price: '1.69',
  },
  {
    id: 'neon-vessel-552',
    name: 'Neon Vessel #552',
    image: ivoryImage,
    price: '1.99',
  },
  {
    id: 'cosmic-bloom-118',
    name: 'Cosmic Bloom #118',
    image: sageImage,
    price: '1.29',
  },
  {
    id: 'violet-nomad-314',
    name: 'Violet Nomad #314',
    image: sageImage,
    price: '1.39',
  },
  {
    id: 'ivory-baron-088',
    name: 'Ivory Baron #088',
    image: ivoryImage,
    price: '1.79',
  },
  {
    id: 'golden-beat-207',
    name: 'Golden Beat #207',
    image: goldenImage,
    price: '0.99',
  },
  {
    id: 'golden-frequency-071',
    name: 'Golden Frequency #071',
    image: goldenImage,
    price: '0.59',
  },
  {
    id: 'golden-signal-160',
    name: 'Golden Signal #160',
    image: goldenImage,
    price: '0.39',
  },
].map((nft, index) => ({
  ...nft,
  isNew: index < 3,
  isTrending: [2, 4, 8].includes(index),
  description:
    'Um colecionável digital de edição limitada da coleção Kurio Editions. Uma obra sobre identidade, expressão e cultura digital.',
  artist: 'Kurio Editions',
  category: categoryOptions[index % categoryOptions.length],
    network: networkOptions[index % networkOptions.length],
  editions: [
    { id: 'unique', label: '1/1', stock: index === 0 ? 0 : 1 },
    { id: 'ten', label: '1/10', stock: 5 },
    { id: 'limited', label: '1/50', stock: 10 },
    { id: 'open', label: 'ABERTA', stock: 100 },
  ],

  
}))

export const nfts: NFT[] = Array.from(
  { length: 4 },
  (_, series) =>
    firstPage.map((nft) => ({
      ...structuredClone(nft),
      id:
        series === 0
          ? nft.id
          : `series-${series + 1}-${nft.id}`,
      name:
        series === 0
          ? nft.name
          : `${nft.name} · Série ${series + 1}`,
    })),
).flat()