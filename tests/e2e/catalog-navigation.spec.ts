import { test, expect, type Page } from '@playwright/test'

async function search(page: Page, value: string) {
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole('searchbox', { name: 'Explorar coleções' }).fill(value)
    await page.getByRole('button', { name: 'Buscar coleções' }).click()
  } else {
    await page.locator('summary[aria-label="Buscar NFTs"]').click()
    await page.getByPlaceholder('Nome do NFT').fill(value)
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  }
}

test('busca, vazio, voltar e avançar preservam resultados e URL', async ({ page }) => {
  await page.goto('/')
  const cards = page.locator('#catalogo .nft-card')
  await expect(cards).toHaveCount(9)
  await search(page, 'Emerald Ape #042')
  await expect(cards).toHaveCount(4)
  await expect(cards.first()).toContainText('Emerald Ape #042')
  const url = page.url()
  await search(page, 'inexistente-xyz')
  await expect(page.getByText('Nenhum NFT encontrado. Tente outra busca.')).toBeVisible()
  await expect(cards).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(url)
  await expect(cards).toHaveCount(4)
  await page.goForward()
  await expect(page.getByText('Nenhum NFT encontrado. Tente outra busca.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Nenhum NFT encontrado. Tente outra busca.')).toBeVisible()
})

test('catálogo recupera falha HTTP sem perder busca', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#catalogo .nft-card')).toHaveCount(9)
  async function unavailable(value: boolean) {
    expect(await page.evaluate(async (unavailable) => (await fetch('/api/demo/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unavailable }) })).status, value)).toBe(200)
  }
  await unavailable(true)
  await search(page, 'Emerald Ape #042')
  await expect(page.getByText('Não foi possível carregar os NFTs.')).toBeVisible()
  await unavailable(false)
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.locator('#catalogo .nft-card')).toHaveCount(4)
  await expect(page.locator('#catalogo .nft-card').first()).toContainText('Emerald Ape #042')
  expect(new URL(page.url()).searchParams.get('q')).toContain('Emerald')
})

test('login rejeita senha inválida e permite corrigir no mesmo formulário', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Entrar ou criar conta' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('[name=email]').fill('colecionador@kurio.test')
  await dialog.locator('[name=password]').fill('incorreta')
  await dialog.locator('button.auth-submit').click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
  await expect(dialog.locator('[name=email]')).toHaveValue('colecionador@kurio.test')
  await dialog.locator('[name=password]').fill('Kurio123!')
  await dialog.locator('button.auth-submit').click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/profile$/)
})


test('paginação e ordenação sobrevivem ao refresh e ao histórico', async ({ page }) => {
  await page.goto('/?sort=price-asc')
  const cards = page.locator('#catalogo .nft-card')
  await expect(cards).toHaveCount(9)
  const prices = await cards.locator('p').allTextContents()
  const numbers = prices.map((price) => Number.parseFloat(price))
  expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  await page.getByRole('button', { name: 'Página 2', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(cards).toHaveCount(9)
  const names = await cards.locator('h3').allTextContents()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(cards.locator('h3')).toHaveText(names)
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Página 1', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.goForward()
  await expect(cards.locator('h3')).toHaveText(names)
})

