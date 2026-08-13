import { expect, type Frame, type Page, test } from '@playwright/test';
import { isLoadedE2EWebAppUrl } from '../../../src/server/e2e-web-app-url';

const e2eBaseUrl = process.env.E2E_BASE_URL;

async function e2ePage(page: Page) {
  let found: Frame | undefined;

  await expect
    .poll(
      async () => {
        for (const frame of page.frames()) {
          const heading = frame.getByRole('heading', {
            level: 1,
            name: 'Cantina V2 AppScript',
          });
          if (await heading.isVisible().catch(() => false)) {
            found = frame;
            return true;
          }
        }
        return false;
      },
      { timeout: 20_000 },
    )
    .toBe(true);

  if (!found) {
    throw new Error('Tela da Cantina não apareceu no Web App E2E.');
  }

  return found;
}

test.describe('E2E remoto (Apps Script E2E + planilha isolada)', () => {
  test.skip(
    !e2eBaseUrl,
    'Defina E2E_BASE_URL como https://script.google.com/macros/s/<id>/exec. Nunca use PROD.',
  );

  test('opens the isolated E2E Web App and shows configured health', async ({
    page,
  }) => {
    await page.goto(e2eBaseUrl as string);
    expect(isLoadedE2EWebAppUrl(page.url())).toBe(true);

    const app = await e2ePage(page);
    await expect(
      app.getByRole('heading', { level: 1, name: 'Cantina V2 AppScript' }),
    ).toBeVisible();
    await expect(app.getByText('Ambiente E2E funcionando')).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      app.getByText('E2E • 0.1.0-dev • Planilha configurada'),
    ).toBeVisible();
    await expect(app.locator('#health-card')).toHaveAttribute(
      'data-app-adapter',
      'google-script',
    );
  });
});
