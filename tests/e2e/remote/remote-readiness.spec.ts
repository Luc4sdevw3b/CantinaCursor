import { expect, test } from '@playwright/test';

const e2eBaseUrl = process.env.E2E_BASE_URL;

test.describe('E2E remoto (Apps Script E2E + planilha isolada)', () => {
  test.skip(
    !e2eBaseUrl,
    'Defina E2E_BASE_URL para o smoke no deployment E2E. Nunca use PROD.',
  );

  test('opens the isolated E2E Web App and shows configured health', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Cantina V2 AppScript');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Cantina V2 AppScript' }),
    ).toBeVisible();
    await expect(page.getByText('Ambiente E2E funcionando')).toBeVisible();
    await expect(
      page.getByText('E2E • 0.1.0-dev • Planilha configurada'),
    ).toBeVisible();
    await expect(page.locator('#health-card')).toHaveAttribute(
      'data-app-adapter',
      'google-script',
    );
  });
});
