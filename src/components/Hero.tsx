import { ArrowRight } from 'lucide-react'
import nftHero from '../assets/nft-hero.webp'
import { MobileHero } from './MobileHero'
import { heroImageSizes, responsiveNFTImage } from '../lib/nft-images'
import { useDesktopLayout } from '../lib/useDesktopLayout'

export function Hero() {
  const desktop = useDesktopLayout()
  return (
    <><MobileHero /><section className="desktop-hero mt-8 grid grid-cols-1 items-center gap-6 rounded-3xl bg-panel p-5 sm:grid-cols-2 md:gap-12 md:rounded-none md:bg-transparent md:py-0 lg:min-h-[450px] lg:grid-cols-[1fr_450px] lg:pl-10">
      <div>
        <p className="text-xs tracking-wide md:text-sm">
          Bem-vindo à Kurio
        </p>

        <h1 className="mt-3 text-lg font-bold leading-relaxed md:text-3xl lg:text-[43px] lg:leading-[70px]">
          <span className="md:hidden">
            SEJA DONO DA CULTURA DIGITAL
          </span>

          <span className="hidden md:block">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </span>
        </h1>

        <p className="mt-4 max-w-[557px] text-xs leading-5 text-subtle md:text-sm md:leading-6">
          Descubra NFTs selecionados de criadores emergentes e consagrados.
          Colecione arte digital rara e apoie artistas.
        </p>

        <a
          href="#catalogo"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand md:rounded-md md:bg-brand md:px-6 md:py-3 md:text-page md:hover:brightness-110"
        >
          EXPLORAR
          <ArrowRight size={18} />
        </a>
      </div>

      <img
        src={nftHero}
        {...responsiveNFTImage(nftHero, heroImageSizes)}
        loading={desktop ? 'eager' : 'lazy'}
        alt="NFT de um macaco com óculos dourados e jaqueta verde"
        width={450}
        height={450}
        fetchPriority="high"
        className="aspect-square w-full rounded-2xl object-cover"
      />
    </section></>
  )
}
