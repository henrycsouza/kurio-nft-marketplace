import { test, expect } from '@playwright/test'

test.use({ deviceScaleFactor: 1.75 })

test('interface aparece antes do backend e aguarda antes de enviar requisições', async ({ page }) => {
  let release = () => {}
  const held = new Promise<void>((resolve) => { release = resolve })
  let reads = 0
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) reads++ })
  await page.route(/\/(src\/mocks\/browser\.ts|assets\/browser-[^/]+\.js)(\?|$)/, async (route) => {
    await held
    await route.continue()
  })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator(page.viewportSize()!.width < 1024 ? '.mobile-hero' : '.desktop-hero')).toBeVisible()
    await expect(page.locator('#catalogo .nft-card')).toHaveCount(0)
    expect(reads).toBe(0)
    release()
    await expect(page.locator('#catalogo .nft-card')).toHaveCount(9)
    expect(reads).toBeGreaterThan(0)
  } finally { release() }
})

test('primeira imagem compartilha preload responsivo e catálogo faz uma consulta', async ({ page }) => {
  const images: string[] = []
  let catalogs = 0
  page.on('request', (request) => {
    if (request.resourceType() === 'image') images.push(request.url())
  })
  // StrictMode may abort its first observer; count responses actually delivered.
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/api/nfts' && response.status() === 200) catalogs++
  })
  await page.goto('/')
  const cards = page.locator('#catalogo .nft-card')
  await expect(cards).toHaveCount(9)
  const first = cards.first().locator('img')
  await expect(first).toHaveJSProperty('complete', true)
  const width = await first.evaluate((image: HTMLImageElement) => image.naturalWidth)
  expect(width).toBeGreaterThan(0)
  expect(catalogs).toBe(1)
  const desktopHero = page.locator('.desktop-hero img')
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveAttribute('imagesizes', await desktopHero.getAttribute('sizes') ?? '')
  if (page.viewportSize()!.width < 600) {
    expect(width).toBeLessThanOrEqual(320)
    expect(await first.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/nft-hero-(160|240|320)[.-]/)
    const original = new URL(await first.getAttribute('src') ?? '', page.url()).href
    expect(images).not.toContain(original)
  } else if (page.viewportSize()!.width >= 1024) {
    await expect(desktopHero).toHaveJSProperty('complete', true)
    await expect(desktopHero).toHaveJSProperty('naturalWidth', 450)
  }
})
