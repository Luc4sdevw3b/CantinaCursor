import { expect, test } from '@playwright/test';

test('opens the local Cantina screen with the fake API ready', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Cantina V2 AppScript');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cantina V2 AppScript' }),
  ).toBeVisible();
  await expect(page.getByText('Ambiente local funcionando')).toBeVisible();
  await expect(
    page.getByText('LOCAL • 0.1.0-dev • API fake pronta'),
  ).toBeVisible();
  await expect(page.getByText('Fase 1')).toBeVisible();
});

test('persists light and dark theme preferences', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Escuro' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: 'Sistema' }).click();
  await expect(page.getByRole('button', { name: 'Sistema' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
