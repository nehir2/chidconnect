import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against the real backend (seeded SQLite) and the real frontend.
// Playwright starts both servers itself; locally it reuses them if they already run.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // the tests share one seeded database
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // The seed script resets the database to the demo data before every run.
      command: 'npm run seed && npm start',
      cwd: '../backend',
      // 401 counts as "up": the endpoint needs a token, so it answers 401 once the server runs.
      url: 'http://localhost:4000/api/auth/me',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --host localhost --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
