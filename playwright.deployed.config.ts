import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  testMatch: ['deployed.smoke.spec.ts', 'realtime.spec.ts'],
  use: { ...config.use, baseURL: 'https://kurio-nft-marketplace-lake.vercel.app' },
  webServer: undefined,
  projects: config.projects?.filter((project) => ['mobile', 'desktop'].includes(project.name ?? '')),
})
