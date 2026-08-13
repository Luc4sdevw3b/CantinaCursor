import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/remote',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
});
