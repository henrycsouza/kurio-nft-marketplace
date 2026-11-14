import { test, expect, type Page } from '@playwright/test'

async function snapshot(page: Page, name: string) {
  await expect(page.locator('.nft-skeleton')).toHaveCount(0)
  // Reveal artwork just as a user scrolling through the whole page would.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)
    }
    window.scrollTo(0, 0)
    await new Promise(requestAnimationFrame)
  })
  await expect(page.locator('[data-deferred-image]:not([src])')).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    // Full-page screenshots include images that started below the fold.
    await Promise.all([...document.images].map(async (image) => {
      image.loading = 'eager'
      await image.decode().catch(() => {})
    }))
  })
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100))
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: 'disabled',
    // Adaptive image cache/decoding can vary a few edge pixels between runs.
    maxDiffPixels: 10,
    // Autoplay progress has its own rAF clock; capture the start of the slide.
    style: '.mobile-hero-progress-fill { transform: scaleX(0) !important; }',
  })
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-13T15:00:00Z') })
})

test('@visual início', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#catalogo .nft-card')).toHaveCount(9)
  if (page.viewportSize()!.width < 1024) await page.getByRole('button', { name: 'Mostrar destaque 1' }).click()
  await snapshot(page, 'inicio.png')
})

test('@visual detalhe', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await expect(page.locator('.nft-price-row')).toContainText('1.19')
  await expect(page.locator('.nft-card').first()).toBeVisible()
  await snapshot(page, 'detalhe.png')
})

for (const screen of ['carrinho', 'pagamento']) {
  test(`@visual ${screen}`, async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
    await expect(page.getByRole('link', { name: 'Continuar para pagamento' })).toBeVisible()
    if (screen === 'pagamento') {
      await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
      await page.getByRole('button', { name: 'Entrar ou criar conta' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.locator('[name=email]').fill('colecionador@kurio.test')
      await dialog.locator('[name=password]').fill('Kurio123!')
      await dialog.locator('button.auth-submit').click()
      await expect(dialog).toBeHidden()
      await expect(page.locator('.payment-wallet-option')).toHaveCount(2)
      await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled()
    }
    await snapshot(page, `${screen}.png`)
  })
}
