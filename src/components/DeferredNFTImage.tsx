import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
import { responsiveNFTImage } from '../lib/nft-images'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & { src: string; sizes: string; enabled?: boolean }

// Native lazy loading can fetch several screens ahead on a fast connection.
// Preserve the image's dimensions, but request artwork only near the viewport.
export function DeferredNFTImage({ src, sizes, enabled = true, ...props }: Props) {
  const image = useRef<HTMLImageElement>(null)
  const [ready, setReady] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (!image.current || ready || !enabled) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setReady(true); observer.disconnect() }
    }, { rootMargin: '300px' })
    observer.observe(image.current)
    return () => observer.disconnect()
  }, [ready, enabled])
  return <img {...props} ref={image} data-deferred-image="" src={ready ? src : undefined} {...(ready ? responsiveNFTImage(src, sizes) : {})} />
}
