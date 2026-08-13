import { defineConfig, devices } from '@playwright/test';

/**
 * E2E remoto da Fase 3: Web App Apps Script E2E + planilha E2E.
 * Exige E2E_BASE_URL. Nunca apontar para PROD.
 * Sem E2E_BASE_URL os testes são ignorados.
 */
const e2eBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e/remote',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: e2eBaseUrl || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
