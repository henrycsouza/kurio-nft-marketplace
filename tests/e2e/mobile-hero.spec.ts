import { test, expect } from '@playwright/test'

test('destaque desliza automaticamente, completa o ciclo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Carrossel da página inicial mobile')
  await page.clock.install()
  await page.goto('/')
  const hero = page.getByRole('region', { name: 'Destaques Kurio' })
  await expect(hero).toBeVisible()
  await expect(hero.getByRole('button', { name: 'Mostrar destaque 1' })).toHaveAttribute('aria-pressed', 'true')
  await page.clock.runFor(5000)
  const progress = await hero.locator('button[aria-pressed="true"] .mobile-hero-progress-fill').evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a)
  expect(progress).toBeGreaterThan(0.3)
  expect(progress).toBeLessThan(0.7)
  // Capture inside the browser at transition start; a slow host can finish the
  // 750ms animation before Node's next evaluate reaches the page.
  await hero.locator('.mobile-hero-track').evaluate((element) => {
    element.addEventListener('transitionrun', () => {
      const animation = element.getAnimations()[0]
      if (!animation) return
      animation.pause()
      animation.currentTime = 350
      const x = new DOMMatrix(getComputedStyle(element).transform).m41
      const width = element.getBoundingClientRect().width
      element.setAttribute('data-motion-probe', JSON.stringify({ x, width }))
      animation.finish()
    }, { once: true })
  })
  await page.screenshot({ path: 'test-results/mobile-hero-progress.png' })
  await page.clock.fastForward(5100)
  await expect(hero.getByRole('button', { name: 'Mostrar destaque 2' })).toHaveAttribute('aria-pressed', 'true')
  await expect(hero.locator('.mobile-hero-track')).toHaveCSS('transition-duration', '0.75s')
  await expect(hero.locator('.mobile-hero-track')).toHaveAttribute('data-motion-probe', /./)
  const geometry = JSON.parse(await hero.locator('.mobile-hero-track').getAttribute('data-motion-probe') ?? '{}') as { x: number; width: number }
  expect(geometry.x).toBeLessThan(-geometry.width)
  expect(geometry.x).toBeGreaterThan(-geometry.width * 2)
  await page.clock.fastForward(10100)
  await expect(hero.getByRole('button', { name: 'Mostrar destaque 3' })).toHaveAttribute('aria-pressed', 'true')
  await page.clock.fastForward(10100)
  await expect(hero.getByRole('button', { name: 'Mostrar destaque 1' })).toHaveAttribute('aria-pressed', 'true')
  await page.clock.runFor(900)
  await page.clock.fastForward(10100)
  await expect(hero.getByRole('button', { name: 'Mostrar destaque 2' })).toHaveAttribute('aria-pressed', 'true')
  await expect(hero.locator('.mobile-hero-playback')).toHaveCount(0)
})

test('banner inicia sozinho mesmo com movimento reduzido sem botão de play', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Carrossel mobile')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install()
  await page.goto('/')
  const hero = page.locator('.mobile-hero')
  await expect(hero).toBeVisible()
  await page.evaluate(() => { document.documentElement.dataset.motion = 'reduce' })
  await expect(hero.getByRole('button', { name: 'Ativar animação do banner' })).toHaveCount(0)
  await page.clock.fastForward(10100)
  await expect(hero.getByRole('button', { name: 'Mostrar destaque 2' })).toHaveAttribute('aria-pressed', 'true')
  await expect(hero.locator('.mobile-hero-track')).toHaveCSS('transition-duration', '0.75s')
  await expect(hero.locator('.mobile-hero-playback')).toHaveCount(0)
  await hero.getByRole('button', { name: 'Mostrar destaque 3' }).click()
  await expect(hero.getByRole('heading')).toHaveText('SUA PRÓXIMA COLEÇÃO COMEÇA AQUI')
})

