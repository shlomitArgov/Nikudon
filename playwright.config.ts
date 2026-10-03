import { defineConfig } from '@playwright/test'

const PORT = 5183

export default defineConfig({
  testDir: './e2e',
  timeout: 15_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
