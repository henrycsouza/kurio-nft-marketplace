import { test, expect } from '@playwright/test'
test.use({ video: 'on' })
test('banner desliza com relógio real após dez segundos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Verificação visual no celular')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const hero = page.locator('.mobile-hero')
  await expect(hero).toBeVisible()
  await expect(hero.locator('button[aria-pressed="true"]')).toHaveAttribute('aria-label', 'Mostrar destaque 1')
  const result = await hero.locator('.mobile-hero-track').evaluate((track) => new Promise<{ from: number; middle: number; to: number; width: number }>((resolve, reject) => {
    const width = track.getBoundingClientRect().width
    const from = new DOMMatrix(getComputedStyle(track).transform).m41
    let middle = from
    const deadline = performance.now() + 14000
    function sample() {
      const x = new DOMMatrix(getComputedStyle(track).transform).m41
      if (x < -width - 5 && x > -width * 2 + 5) middle = x
      if (Math.abs(x + width * 2) < 1) { resolve({ from, middle, to: x, width }); return }
      if (performance.now() > deadline) { reject(new Error(JSON.stringify({ x, middle, width, motion: document.documentElement.dataset.motion, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, focus: document.activeElement?.outerHTML, hidden: document.hidden }))); return }
      requestAnimationFrame(sample)
    }
    sample()
  }))
  expect(result.middle).toBeLessThan(-result.width)
  expect(result.middle).toBeGreaterThan(-result.width * 2)
  await expect(hero.getByRole('heading')).toHaveText('ARTE RARA, NOVAS HISTÓRIAS')
  await page.screenshot({ path: 'test-results/banner-real-segundo-slide.png' })
})
