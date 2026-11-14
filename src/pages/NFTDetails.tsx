import { useCompactLayout } from '../lib/useCompactLayout'
import Decimal from 'decimal.js'
import { Skeleton } from '../components/ui/skeleton'
import { FavoriteButton } from '../components/FavoriteButton'
import { useRef, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Mail, Share2, ShoppingCart, Star, X, ZoomIn } from 'lucide-react'
import { defaultCatalogSearch as catalogSearch } from '../lib/catalog-options'
import { getNFT, getRecommendations } from '../lib/api'
import { AddToCartButton } from '../components/AddToCartButton'
import { NFTCard } from '../components/NFTCard'

export function NFTDetails() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  return <NFTDetailsContent key={nftId} nftId={nftId} />
}

function NFTDetailsContent({ nftId }: { nftId: string }) {
  const compact = useCompactLayout()
  const touchStart = useRef(0)
  const [editionId, setEditionId] = useState('limited')
  const [quantity, setQuantity] = useState(1)
  const [view, setView] = useState(0)
  const [tab, setTab] = useState('details')
  const [shareMessage, setShareMessage] = useState('')
  const zoomRef = useRef<HTMLDialogElement>(null)
  const query = useQuery({
    queryKey: ['nft', nftId],
    queryFn: ({ signal }) => getNFT(nftId, signal),
    retry: (count, error) => count < 1 && !(axios.isAxiosError(error) && error.response?.status === 404),
  })
  const recommendations = useQuery({
    queryKey: ['nfts', 'recommendations'],
    queryFn: ({ signal }) => getRecommendations(signal),
  })

  if (query.isPending) return <main className="mx-auto max-w-[1200px] py-12" role="status" aria-label="Carregando NFT"><div className="grid gap-8 md:grid-cols-2" aria-hidden="true"><Skeleton className="aspect-square w-full rounded-2xl" /><div className="space-y-6"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-36 w-full" /><Skeleton className="h-12 w-full" /></div></div></main>
  if (query.isError) return (
    <main className="mx-auto py-12">
      <h1 role="alert">{axios.isAxiosError(query.error) && query.error.response?.status === 404 ? 'NFT não encontrado.' : 'Não foi possível carregar este NFT.'}</h1>
      <button type="button" onClick={() => query.refetch()} className="mt-4 text-brand underline">Tentar novamente</button>
      <Link to="/" search={catalogSearch} hash="catalogo" className="mt-6 block text-brand">Voltar ao mercado</Link>
    </main>
  )

  const nft = query.data
  const stock = nft.editions.find((edition) => edition.id === editionId)?.stock ?? 0
  const views = ['Obra completa', 'Detalhe do rosto', 'Detalhe à esquerda', 'Detalhe à direita']
  const imageStyle = { transform: `scale(${view === 0 ? 1 : 1.45})`, objectPosition: view === 2 ? '25% center' : view === 3 ? '75% center' : 'center' }

  return (
    <main className="nft-market mx-auto py-8">
      <nav aria-label="Localização" className="mb-6 flex gap-2 text-xs">
        <Link to="/" search={catalogSearch} className="hover:text-brand">Início</Link><span>/</span>
        <Link to="/" search={catalogSearch} hash="catalogo" className="hover:text-brand">Mercado</Link>
      </nav>

      <section className="nft-product">
        <div className="nft-gallery" onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX }} onTouchEnd={(event) => { const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 45) setView((previous) => (previous + (delta < 0 ? 1 : -1) + views.length) % views.length) }}>
          <div className="nft-thumbnails" aria-label="Visualizações da obra">
            {views.map((label, index) => (
              <button key={label} type="button" aria-label={label} aria-pressed={view === index} onClick={() => setView(index)} className={view === index ? 'is-selected' : ''}>
                <img src={nft.image} alt="" width={96} height={96} style={{ transform: `scale(${index === 0 ? 1 : 1.3})` }} />
              </button>
            ))}
          </div>
          <div className="nft-main-image">
            <div className="nft-image-window"><img src={nft.image} alt={`${nft.name} — ${views[view]}`} width={500} height={500} style={imageStyle} /></div>
            <button type="button" onClick={() => zoomRef.current?.showModal()} aria-label="Ampliar imagem" className="nft-zoom"><ZoomIn size={22} /></button>
          </div>
        </div>

        <div className="nft-information">
          <h1 className="text-2xl font-bold lg:text-3xl">{nft.name}</h1>
          <div className="nft-price-row">
            <p className="text-xl font-bold text-brand">{nft.price} ETH</p>
            <a href="#nft-information-tabs" onClick={() => setTab('reviews')} className="flex items-center gap-2 text-xs text-subtle"><Star size={15} className="text-brand" /> Avaliações de colecionadores</a>
          </div>
          <h2 className="mt-4 text-sm font-bold">Sobre este NFT:</h2>
          <p className="mt-3 text-xs leading-6 text-subtle">{nft.description}</p>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm">Edição:</legend>
            <div className="flex flex-wrap gap-2">
              {nft.editions.map((edition) => (
                <button key={edition.id} type="button" aria-pressed={editionId === edition.id} disabled={edition.stock === 0} title={edition.stock === 0 ? 'Edição esgotada' : `${edition.stock} disponíveis`} onClick={() => { setEditionId(edition.id); setQuantity(1) }} className={`rounded-full border px-2 py-1 text-xs disabled:opacity-40 ${editionId === edition.id ? 'border-brand text-brand' : 'border-line text-subtle'}`}>{edition.label}</button>
              ))}
            </div>
          </fieldset>
          <div className="nft-purchase">
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)} className="nft-quantity">−</button>
              <output aria-label="Quantidade selecionada">{quantity}</output>
              <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= stock} onClick={() => setQuantity(quantity + 1)} className="nft-quantity">+</button>
            </div>
            <p className="nft-mobile-total">{new Decimal(nft.price).times(quantity).toFixed()} ETH</p>
            <div className="nft-purchase-actions">
              <AddToCartButton label={compact ? 'Comprar NFT' : 'COMPRAR'} nftId={nft.id} editionId={editionId} quantity={quantity} disabled={stock === 0 || quantity > stock} />
              <FavoriteButton nft={nft} />
              <Link to="/cart" className="nft-mobile-cart" aria-label="Abrir carrinho"><ShoppingCart size={18} /></Link>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-xs text-subtle">
            <div><dt className="inline">ID do token: </dt><dd className="inline">#{nft.id.split('-').at(-1)}</dd></div>
            <div><dt className="inline">Coleção: </dt><dd className="inline">{nft.artist}</dd></div>
            <div><dt className="inline">Categoria: </dt><dd className="inline">{nft.category}</dd></div>
          </dl>
          <div className="nft-share-row mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span>Compartilhar este NFT:</span>
            <a href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(window.location.href)}`} aria-label="Compartilhar por e-mail"><Mail size={16} /></a>
            <button type="button" aria-label="Copiar link do NFT" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setShareMessage('Link copiado!') } catch { setShareMessage('Não foi possível copiar o link.') } }}><Share2 size={16} /></button>
            <span role="status" className="text-brand">{shareMessage}</span>
          </div>
        </div>
      </section>

      <section id="nft-information-tabs" className="nft-description"><details className="nft-extra-details" open={!compact}><summary>Detalhes e avaliações</summary>
        <div role="tablist" aria-label="Informações do NFT" className="nft-tabs">
          <button id="details-tab" role="tab" type="button" aria-selected={tab === 'details'} aria-controls="details-panel" tabIndex={tab === 'details' ? 0 : -1} onClick={() => setTab('details')} onKeyDown={(event) => { if (event.key === 'ArrowRight') { setTab('reviews'); document.getElementById('reviews-tab')?.focus() } }}>Detalhes do NFT</button>
          <button id="reviews-tab" role="tab" type="button" aria-selected={tab === 'reviews'} aria-controls="reviews-panel" tabIndex={tab === 'reviews' ? 0 : -1} onClick={() => setTab('reviews')} onKeyDown={(event) => { if (event.key === 'ArrowLeft') { setTab('details'); document.getElementById('details-tab')?.focus() } }}>Avaliações de colecionadores</button>
        </div>
        {tab === 'details' ? (
          <div id="details-panel" role="tabpanel" aria-labelledby="details-tab" tabIndex={0} className="space-y-5 text-xs leading-7 text-subtle">
            <p>{nft.name} é uma obra digital da coleção {nft.artist}. {nft.description}</p>
            <p>A propriedade inclui a arte digital e sua procedência na rede {nft.network}. Consulte os termos da coleção para conhecer os direitos de uso.</p>
            <div><h3 className="text-copy">Rede:</h3><p>{nft.network}</p></div>
            <div><h3 className="text-copy">Criador:</h3><p>{nft.artist}</p></div>
            <div><h3 className="text-copy">Direitos autorais:</h3><p>Consulte as condições e a licença disponibilizadas pelo criador.</p></div>
          </div>
        ) : <div id="reviews-panel" role="tabpanel" aria-labelledby="reviews-tab" tabIndex={0} className="py-8 text-sm text-subtle">Ainda não há avaliações para este NFT.</div>}
      </details></section>

      <section className="mt-20 mb-10" aria-labelledby="more-collection">
        <h2 id="more-collection" className="border-b border-line pb-3 text-sm font-bold text-brand">Mais desta coleção</h2>
        {recommendations.isPending ? <p role="status" className="py-8">Carregando coleção…</p> : recommendations.isError ? <button type="button" onClick={() => recommendations.refetch()} className="py-8 text-brand">Tentar carregar a coleção novamente</button> : (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">{recommendations.data.filter((item) => item.id !== nft.id && item.artist === nft.artist).map((item) => <NFTCard key={item.id} nft={item} />)}</div>
        )}
      </section>

      <dialog ref={zoomRef} className="nft-lightbox" aria-label={`Imagem ampliada de ${nft.name}`} onClick={(event) => { if (event.target === event.currentTarget) zoomRef.current?.close() }}>
        <button type="button" autoFocus onClick={() => zoomRef.current?.close()} aria-label="Fechar imagem ampliada"><X size={24} /></button>
        <img src={nft.image} alt={nft.name} />
      </dialog>
    </main>
  )
}



