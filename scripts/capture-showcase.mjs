import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const baseURL = process.env.SHOWCASE_URL ?? 'https://kurio-nft-marketplace-lake.vercel.app'
await mkdir('docs/images', { recursive: true })
const browser = await chromium.launch()
try {
  for (const [device, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ baseURL, viewport, deviceScaleFactor: 1, isMobile: device === 'mobile', hasTouch: device === 'mobile' })
    const page = await context.newPage()
    await page.clock.install({ time: new Date('2026-11-13T15:00:00Z') })
    async function capture(name) {
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].filter((image) => {
          const bounds = image.getBoundingClientRect()
          return bounds.width && bounds.height && bounds.top < innerHeight && bounds.bottom > 0
        }).map((image) => image.decode().catch(() => {})))
      })
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100))
      await page.screenshot({ path: `docs/images/${name}-${device}.png`, animations: 'disabled' })
      console.log(`Captured ${name}-${device}`)
      await page.clock.resume()
    }
    await page.goto('/')
    await page.locator('#catalogo .nft-card').first().waitFor()
    if (device === 'mobile') await page.getByRole('button', { name: 'Mostrar destaque 1' }).click()
    await capture('home')
    await page.goto('/nft/emerald-ape-042')
    await page.locator('.nft-price-row').waitFor()
    await capture('nft')
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
    await page.getByRole('link', { name: 'Continuar para pagamento' }).waitFor()
    await capture('cart')
    await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
    await page.getByRole('button', { name: 'Entrar ou criar conta' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('[name=email]').fill('colecionador@kurio.test')
    await dialog.locator('[name=password]').fill('Kurio123!')
    await dialog.locator('button.auth-submit').click()
    await page.locator('.payment-wallet-option').first().waitFor()
    await capture('checkout')
    await context.close()
  }
} finally { await browser.close() }
