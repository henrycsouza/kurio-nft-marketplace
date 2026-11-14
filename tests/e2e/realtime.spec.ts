import { test, expect, type Page } from '@playwright/test'

async function demo(page: Page, path: string, data = {}) {
  return page.evaluate(async ({ path, data }) => {
    const response = await fetch(`/api/demo/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    return response.status
  }, { path, data })
}
async function checkout(page: Page) {
  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  await page.getByRole('button', { name: 'Entrar ou criar conta' }).click()
  const auth = page.getByRole('dialog')
  await auth.locator('input[name="email"]').fill('colecionador@kurio.test')
  await auth.locator('input[name="password"]').fill('Kurio123!')
  await auth.locator('button.auth-submit').click()
  await expect(auth).toBeHidden()
  await expect(page.locator('.payment-wallet-option')).toHaveCount(2)
}

test('Socket.IO atualiza detalhe, ignora duplicatas e mantém preço no refresh', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(async () => (await (await fetch('/api/demo/realtime-status')).json()).connections)).toBe(1)
  expect(await demo(page, 'nft', { id: 'emerald-ape-042', price: '2.75' })).toBe(200)
  await expect(page.locator('.nft-price-row')).toContainText('2.75')
  let reads = 0
  page.on('request', (request) => { if (request.url().endsWith('/api/nfts/emerald-ape-042')) reads++ })
  await demo(page, 'replay', { id: 'emerald-ape-042' })
  await demo(page, 'replay', { id: 'emerald-ape-042', stale: true })
  // Wait across the normal mock latency to detect unwanted invalidations.
  await page.waitForTimeout(800)
  expect(reads).toBe(0)
  await page.reload()
  await expect(page.locator('.nft-price-row')).toContainText('2.75')
})

test('preço ao vivo invalida revisão e impede compra com cotação antiga', async ({ page }) => {
  await checkout(page)
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Revise sua compra' })
  await expect(review).toBeVisible()
  await demo(page, 'nft', { id: 'emerald-ape-042', price: '3.10' })
  await expect(page.locator('.payment-price')).toContainText('3.116')
  await review.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(review).toBeHidden()
  await expect(page.getByText('A cotação mudou. Revise os valores e confirme novamente.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/checkout/)
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(review).toBeVisible()
  await review.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
})

test('pedido pendente é recuperado após interrupção e refresh sem outra compra', async ({ page }) => {
  await checkout(page)
  let creates = 0
  page.on('request', (request) => { if (request.method() === 'POST' && request.url().endsWith('/api/orders')) creates++ })
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page.getByRole('dialog', { name: 'Revise sua compra' }).getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page).toHaveURL(/\/orders\//)
  const url = page.url()
  await demo(page, 'disconnect')
  await expect(page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  expect(page.url()).toBe(url)
  expect(creates).toBe(1)
})

test('edição esgotada atualiza o carrinho e bloqueia a finalização', async ({ page }) => {
  await checkout(page)
  await demo(page, 'nft', { id: 'emerald-ape-042', stock: 0 })
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  await page.goto('/cart')
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Continuar para pagamento' })).toHaveAttribute('aria-disabled', 'true')
})
