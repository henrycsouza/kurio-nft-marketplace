import { test, expect } from '@playwright/test'

test('sessão antiga sem nome é migrada sem quebrar home ou perder carrinho', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    if (localStorage.getItem('legacy-seeded')) return
    localStorage.setItem('legacy-seeded', 'yes')
    localStorage.setItem('kurio.guestId', 'legacy-browser')
    localStorage.setItem('kurio.mock.session.legacy-browser', JSON.stringify({ id: 'collector-demo', email: 'colecionador@kurio.test', expiresAt: Date.now() + 1800000 }))
    localStorage.setItem('kurio.mock.cart.user.collector-demo', JSON.stringify({ version: 1, items: [{ nftId: 'emerald-ape-042', editionId: 'limited', quantity: 2 }] }))
  })
  await page.goto('/')
  await expect(page.locator('#catalogo .nft-card').first()).toBeVisible()
  await expect(page.getByText('Something went wrong!', { exact: true })).toHaveCount(0)
  await page.goto('/profile')
  await expect(page.locator('input[name="name"]')).toHaveValue('Colecionador Kurio')
  await page.goto('/cart')
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.locator('.cart-item')).toContainText('Emerald Ape #042')
  await page.reload()
  await expect(page.locator('.cart-item')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('conta e carteira antigas e listas incompletas não derrubam as telas', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    if (localStorage.getItem('legacy-seeded')) return
    localStorage.setItem('legacy-seeded', 'yes')
    localStorage.setItem('kurio.guestId', 'legacy-browser')
    localStorage.setItem('kurio.mock.accounts.v1', JSON.stringify([{ id: 'collector-demo', email: 'colecionador@kurio.test', salt: '', hash: '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4' }]))
    localStorage.setItem('kurio.mock.session.legacy-browser', JSON.stringify({ id: 'collector-demo', expiresAt: Date.now() + 1800000 }))
    localStorage.setItem('kurio.mock.cart.user.collector-demo', JSON.stringify({ items: [{ nftId: 'emerald-ape-042', editionId: 'limited', quantity: 2 }] }))
    localStorage.setItem('kurio.mock.wallets.collector-demo', JSON.stringify([{ id: 'metamask', label: 'MetaMask', network: 'Ethereum', address: '0x1111111111111111111111111111111111111111' }]))
    localStorage.setItem('kurio.mock.favorites.collector-demo', '{"oldList":true}')
    localStorage.setItem('kurio.mock.preferences.collector-demo', '{incomplete')
  })
  await page.goto('/profile')
  await expect(page.locator('input[name="name"]')).toHaveValue('Colecionador Kurio')
  await expect(page.locator('input[name="username"]')).toHaveValue('colecionador')
  await page.goto('/wallets')
  await page.locator('.wallet-section').first().getByRole('button', { name: 'Editar', exact: true }).click()
  await expect(page.locator('input[name="nickname"]')).toHaveValue('MetaMask')
  await page.goto('/checkout')
  await expect(page.locator('.payment-wallet-option')).toHaveCount(1)
  await expect(page.locator('.payment-price')).toContainText('2.396')
  await page.goto('/settings')
  await expect(page.getByRole('switch', { name: /Reduzir animações/ })).not.toBeChecked()
  await page.goto('/favorites')
  await expect(page.getByText('Sua coleção de favoritos começa aqui')).toBeVisible()
  expect(errors).toEqual([])
})

for (const scenario of ['invalid-json', 'unknown-user']) {
  test(`sessão ${scenario} pede login sem expor outra conta`, async ({ page }) => {
    await page.addInitScript((scenario) => {
      localStorage.setItem('kurio.guestId', 'legacy-browser')
      localStorage.setItem('kurio.mock.session.legacy-browser', scenario === 'invalid-json' ? '{broken' : JSON.stringify({ id: 'unknown-user', email: 'colecionador@kurio.test', expiresAt: Date.now() + 1800000 }))
      localStorage.setItem('kurio.mock.cart.user.collector-demo', JSON.stringify({ version: 1, items: [{ nftId: 'emerald-ape-042', editionId: 'limited', quantity: 2 }] }))
    }, scenario)
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login\?/)
    await expect(page.getByRole('heading', { name: 'Entre para continuar' })).toBeVisible()
    await expect(page.locator('input[name="name"]')).toHaveCount(0)
    await page.goto('/cart')
    await expect(page.locator('.cart-item')).toHaveCount(0)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio.mock.cart.user.collector-demo')!).items[0].quantity)).toBe(2)
  })
}
