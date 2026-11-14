import { Link, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { catalogQueryOptions } from '../lib/catalog-query'
import { ArrowRight } from 'lucide-react'
import { defaultCatalogSearch } from '../lib/catalog-options'
import { DeferredNFTImage } from './DeferredNFTImage'

import emeraldImage from '../assets/nft-hero.webp'
import sageImage from '../assets/sage-nomad.webp'
import ivoryImage from '../assets/ivory-baron.webp'
import goldenImage from '../assets/golden-signal.webp'

const promotions = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description:
      'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: emeraldImage,
    tab: 'new',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: ivoryImage,
    tab: 'all',
  },
] as const

const articles = [
  {
    title: 'Como funciona a propriedade de NFTs',
    date: '12 de setembro',
    readingTime: '6 min',
    description:
      'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: ivoryImage,
  },
  {
    title: '10 artistas digitais para acompanhar',
    date: '13 de setembro',
    readingTime: '2 min',
    description:
      'Conheça criadores que moldam a cultura digital.',
    image: emeraldImage,
  },
  {
    title: 'Raridade, atributos e procedência',
    date: '15 de setembro',
    readingTime: '3 min',
    description:
      'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: sageImage,
  },
  {
    title: 'Como proteger sua carteira',
    date: '15 de setembro',
    readingTime: '2 min',
    description:
      'Proteja sua carteira, seus ativos e sua identidade.',
    image: goldenImage,
  },
]

export function FeaturedNFT() {
  return (
    <section className="mt-6 overflow-hidden bg-panel pt-6 text-center">
      <h2 className="text-2xl font-bold leading-8 text-brand">
        NFT EM DESTAQUE
      </h2>

      <p className="mt-4 text-base leading-4">
        OFERTA LIMITADA
      </p>

      <Link
        to="/nft/$nftId"
        params={{ nftId: 'cosmic-bloom-118' }}
        aria-label="Ver Cosmic Bloom em destaque"
        className="mt-4 block"
      >
        <DeferredNFTImage
          src={sageImage}
          sizes="310px"
          alt="Macaco de chapéu e moletom roxo"
          width={310}
          height={368}
          loading="lazy"
          className="h-[368px] w-full object-cover"
        />
      </Link>
    </section>
  )
}

export function HomeSections() {
  const search = useSearch({ from: '/' })
  // Observe the existing request: skeletons are shorter than the completed grid.
  // Wait for its layout before deciding which lower images are near the viewport.
  const catalog = useQuery({ ...catalogQueryOptions(search), enabled: false })
  return (
    <>
      <section
        aria-label="Destaques de coleções"
        className="grid gap-7 md:grid-cols-2"
      >
        {promotions.map((promotion) => (
          <article
            key={promotion.title}
            className="grid min-h-[250px] grid-cols-2 overflow-hidden rounded-md bg-panel min-[1248px]:h-[250px]"
          >
            <DeferredNFTImage
              src={promotion.image}
              enabled={!catalog.isPending}
              sizes="(min-width: 1248px) 292px, (min-width: 768px) 25vw, 50vw"
              alt=""
              width={292}
              height={250}
              loading="lazy"
              className="h-full w-full object-cover"
            />

            <div className="flex flex-col items-end justify-center gap-3 py-6 pr-6 pl-2 text-right">
              <h2 className="text-base font-bold leading-6 lg:text-lg">
                {promotion.title}
              </h2>

              <p className="text-xs leading-5 text-subtle lg:text-sm">
                {promotion.description}
              </p>

              <Link
                to="/"
                search={{
                  ...defaultCatalogSearch,
                  tab: promotion.tab,
                }}
                hash="catalogo"
                className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-bold text-page hover:brightness-110"
              >
                Explorar
                <ArrowRight size={18} />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="mint-journal-title" className="mt-20 pb-8 md:mt-32 md:pb-12">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 id="mint-journal-title" className="text-2xl font-bold leading-[37px]">
            Diário da Cunhagem
          </h2>

          <p className="mt-4 text-sm leading-6 text-subtle">
            Histórias, guias e insights para colecionadores sobre
            o universo da propriedade digital.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {articles.map((article) => (
            <article
              key={article.title}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-panel"
            >
              <DeferredNFTImage
                src={article.image}
                enabled={!catalog.isPending}
                sizes="(min-width: 1024px) 268px, (min-width: 640px) 50vw, 100vw"
                alt=""
                width={268}
                height={268}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />

              <div className="flex flex-1 flex-col items-start p-5">
                <p className="text-xs leading-4 text-subtle">
                  {article.date} | Leitura de {article.readingTime}
                </p>

                <h3 className="mt-4 text-sm font-bold leading-6">
                  {article.title}
                </h3>

                <p className="mt-3 mb-5 text-xs leading-5 text-subtle">
                  {article.description}
                </p>

                <button
                  type="button"
                  disabled
                  title="Artigo indisponível nesta demonstração"
                  className="mt-auto text-xs leading-5 text-brand"
                >
                  Ler mais →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
