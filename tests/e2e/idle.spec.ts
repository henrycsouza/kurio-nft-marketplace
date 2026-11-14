import { test, expect } from '@playwright/test'
test('catálogo permanece estável durante atualizações em segundo plano', async ({ page }) => {
  test.setTimeout(100000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.nft-card').first()).toBeVisible()
  await page.waitForTimeout(65000)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.waitForTimeout(2000)
  await expect(page.getByText('Something went wrong!', { exact: true })).toHaveCount(0)
  expect(errors).toEqual([])
})


test('expiração da sessão em repouso preserva o catálogo', async ({ page }) => {
  await page.clock.install()
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Entrar ou criar conta' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name="email"]').fill('colecionador@kurio.test')
  await dialog.locator('input[name="password"]').fill('Kurio123!')
  await dialog.locator('button.auth-submit').click()
  await expect(dialog).toBeHidden()
  await page.goto('/')
  await expect(page.locator('.nft-card').first()).toBeVisible()
  await page.clock.fastForward(31 * 60000)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.auth-navbar-login')).toBeVisible()
  await expect(page.locator('.nft-card').first()).toBeVisible()
  expect(errors).toEqual([])
})

