import { defineConfig, devices } from '@playwright/test';

const localPort = Number(process.env.HACKTOR_TEST_PORT || 8791);

export default defineConfig({
  testDir: './tests/ui',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${localPort}`,
    channel: process.env.CI ? undefined : 'chrome',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', grep: /desktop (hackathon|continuity)/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', grep: /mobile (idea-first|continuity)/, use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'mobile-320', grep: /required compact/, use: { browserName: 'chromium', viewport: { width: 320, height: 800 }, hasTouch: true, isMobile: true } },
    { name: 'tablet', grep: /required compact/, use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, hasTouch: true } },
  ],
  webServer: {
    command: `pnpm --filter @hacktor/web build && pnpm --filter @hacktor/web exec wrangler d1 migrations apply DB --local && pnpm --filter @hacktor/web exec wrangler dev --port ${localPort} --local`,
    url: `http://127.0.0.1:${localPort}/api/v1/health`,
    reuseExistingServer: !process.env.CI && !process.env.HACKTOR_FRESH_SERVER,
    timeout: 120_000,
  },
});
