import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { defaultCatalogSearch } from '../lib/catalog-options'
import emerald from '../assets/nft-hero.webp'
import sage from '../assets/sage-nomad.webp'
import golden from '../assets/golden-signal.webp'
import { catalogImageSizes, responsiveNFTImage } from '../lib/nft-images'
import { useDesktopLayout } from '../lib/useDesktopLayout'

const slides = [
  { title: 'SEJA DONO DA CULTURA DIGITAL', description: 'Descubra NFTs selecionados de criadores do mundo todo.', image: emerald, inset: sage, alt: 'Emerald Ape de jaqueta verde', tab: 'all' },
  { title: 'ARTE RARA, NOVAS HISTÓRIAS', description: 'Conheça os novos lançamentos e encontre sua próxima obra.', image: sage, inset: emerald, alt: 'Macaco de chapéu e moletom roxo', tab: 'new' },
  { title: 'SUA PRÓXIMA COLEÇÃO COMEÇA AQUI', description: 'Explore as obras em alta e colecione cultura digital.', image: golden, inset: sage, alt: 'Macaco dourado com fones de ouvido', tab: 'trending' },
] as const
// Clones let the last and first images meet without sliding back through the others.
const slideDuration = 10000
const frames = [slides[slides.length - 1], ...slides, slides[0]]

export function MobileHero() {
  const desktop = useDesktopLayout()
  const [position, setPosition] = useState(1)
  const [animate, setAnimate] = useState(true)
  const [phone, setPhone] = useState(false)
  const [available, setAvailable] = useState(false)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const elapsed = useRef(0)
  const fill = useRef<HTMLSpanElement>(null)
  const revision = useRef(0)
  const [restart, setRestart] = useState(0)
  const active = (position + slides.length - 1) % slides.length

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 1023px)')
    const update = () => {
      setPhone(mobile.matches)
      setAvailable(mobile.matches && !document.hidden)
    }
    update()
    mobile.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => { mobile.removeEventListener('change', update); document.removeEventListener('visibilitychange', update) }
  }, [])

  const advance = useCallback((direction: number) => {
    revision.current += 1
    setRestart(revision.current)
    elapsed.current = 0
    setAnimate(phone)
    setPosition((previous) => previous === 0 || previous === slides.length + 1 ? previous : previous + direction)
  }, [phone])

  useEffect(() => {
    if (!available) return
    const startedAt = performance.now()
    const carried = elapsed.current
    const currentRevision = revision.current
    let switched = false
    let frame: number
    const tick = (now: number) => {
      if (fill.current) fill.current.style.transform = `scaleX(${Math.min((carried + now - startedAt) / slideDuration, 1)})`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // The image change must not depend on animation frames being delivered by the browser.
    const timer = setTimeout(() => { switched = true; elapsed.current = 0; advance(1) }, Math.max(0, slideDuration - carried))
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      if (!switched && currentRevision === revision.current) elapsed.current = Math.min(carried + performance.now() - startedAt, slideDuration)
    }
  }, [available, advance, active, restart])
  useEffect(() => {
    if (position !== 0 && position !== slides.length + 1) return
    // Also settle when a hidden tab or a motion preference cancels transitionend.
    const timer = setTimeout(() => {
      setAnimate(false)
      setPosition((previous) => previous === 0 ? slides.length : previous === slides.length + 1 ? 1 : previous)
    }, 850)
    return () => clearTimeout(timer)
  }, [position])

  function settle() {
    if (position !== 0 && position !== slides.length + 1) return
    setAnimate(false)
    setPosition(position === 0 ? slides.length : 1)
  }

  return <section className="mobile-hero" aria-roledescription="carrossel" aria-label="Destaques Kurio" data-motion-optin="true"
    onTouchStart={(event) => { const first = event.changedTouches[0]; if (first) touch.current = { x: first.clientX, y: first.clientY } }}
    onTouchEnd={(event) => { const last = event.changedTouches[0]; const first = touch.current; touch.current = null; if (!first || !last) return; const delta = last.clientX - first.x; if (Math.abs(delta) > 45 && Math.abs(delta) > Math.abs(last.clientY - first.y)) advance(delta < 0 ? 1 : -1) }}>
    <div className="mobile-hero-track" data-animate={animate && phone} style={{ transform: `translateX(-${position * 100}%)` }} onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === 'transform') settle() }}>
      {frames.map((item, index) => <div className="mobile-hero-panel" key={`${item.image}-${index}`} aria-hidden={index !== position} inert={index !== position}>
        <div className="mobile-hero-copy"><p>Bem-vindo à Kurio</p><h1>{item.title}</h1><p className="mobile-hero-description">{item.description}</p><Link to="/" search={{ ...defaultCatalogSearch, tab: item.tab }} hash="catalogo">EXPLORAR<ArrowRight size={13} /></Link></div>
        <div className="mobile-hero-art"><img className="mobile-hero-art-main" src={item.image} {...responsiveNFTImage(item.image, catalogImageSizes)} loading={desktop || index !== position ? 'lazy' : 'eager'} alt={item.alt} width={180} height={180} fetchPriority={index === position ? 'high' : 'low'} draggable={false} /><img className="mobile-hero-inset" src={item.inset} {...responsiveNFTImage(item.inset, '(min-width: 600px) 68px, 58px')} loading="lazy" alt="" width={62} height={62} draggable={false} /></div>
      </div>)}
    </div>
    <div className="mobile-hero-pagination" aria-label="Escolher destaque">{slides.map((item, index) => <button key={item.title} type="button" aria-label={`Mostrar destaque ${index + 1}`} aria-pressed={active === index} onClick={() => { revision.current += 1; setRestart(revision.current); elapsed.current = 0; if (fill.current) fill.current.style.transform = 'scaleX(0)'; setAnimate(phone); setPosition(index + 1) }}><span className="mobile-hero-progress" aria-hidden="true"><span ref={active === index ? fill : undefined} className="mobile-hero-progress-fill" style={{ transform: `scaleX(${index < active ? 1 : 0})` }} /></span></button>)}</div>
  </section>
}







