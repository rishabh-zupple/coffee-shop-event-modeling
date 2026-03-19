import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for CoffeeShop E2E tests.
 *
 * Assumes both servers are already running before the test suite is invoked:
 *   Backend:  http://localhost:3000  (npm run dev)
 *   Frontend: http://localhost:5173  (npm run dev:ui)
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
