import { expect, type Page, test } from '@playwright/test';

function isAllowedLocalUrl(url: string): boolean {
  const parsed = new URL(url);
  if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
    return true;
  }

  return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
}

async function openLocalApp(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (isAllowedLocalUrl(url)) {
      return route.continue();
    }

    externalRequests.push(url);
    return route.abort();
  });

  await page.goto('/');

  return { consoleErrors, pageErrors, externalRequests };
}

test.describe('E2E local (preview + FakeAppApi)', () => {
  test('opens the application', async ({ page }) => {
    await openLocalApp(page);
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('shows the Cantina V2 AppScript title', async ({ page }) => {
    await openLocalApp(page);
    await expect(page).toHaveTitle('Cantina V2 AppScript');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Cantina V2 AppScript' }),
    ).toBeVisible();
  });

  test('has no unexpected console or page errors', async ({ page }) => {
    const { consoleErrors, pageErrors } = await openLocalApp(page);
    await expect(page.getByText('Ambiente local funcionando')).toBeVisible();
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('system theme follows prefers-color-scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Sistema' }).click();
    await expect(page.getByRole('button', { name: 'Sistema' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('light theme applies', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Claro' }).click();
    await expect(page.getByRole('button', { name: 'Claro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-preference',
      'light',
    );
  });

  test('dark theme applies', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Escuro' }).click();
    await expect(page.getByRole('button', { name: 'Escuro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-preference',
      'dark',
    );
  });

  test('theme preference persists after reload', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Escuro' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Escuro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('FakeAppApi health is visible', async ({ page }) => {
    await openLocalApp(page);
    await expect(page.getByText('Ambiente local funcionando')).toBeVisible();
    await expect(
      page.getByText('LOCAL • 0.1.0-dev • API fake pronta'),
    ).toBeVisible();
    await expect(page.locator('#health-card')).toHaveAttribute(
      'data-app-adapter',
      'fake',
    );
  });

  test('does not make external network calls', async ({ page }) => {
    const { externalRequests } = await openLocalApp(page);
    await expect(page.getByText('Ambiente local funcionando')).toBeVisible();
    expect(externalRequests).toEqual([]);
  });

  test('logs in as dona or staff and logs out without a password field', async ({
    page,
  }) => {
    await openLocalApp(page);
    await expect(page.getByText('Ambiente local funcionando')).toBeVisible();
    expect(await page.locator('input[type="password"]').count()).toBe(0);

    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(page.getByText('Sessão: Dona')).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(
      page.getByRole('button', { name: 'Entrar como dona' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await expect(page.getByText('Sessão: Funcionário')).toBeVisible();
  });

  test('shows distinguishable homonyms and requires review to reactivate', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(page.getByRole('heading', { name: 'Alunos', exact: true })).toBeVisible();
    await expect(page.getByText('Ana Souza • ~8 • 3º A')).toBeVisible();
    await expect(page.getByText('Ana Souza • 10 • 2º B')).toBeVisible();

    const bruno = page.getByRole('listitem').filter({ hasText: 'Bruno Lima' });
    await bruno.getByRole('button', { name: 'Desativar' }).click();
    await bruno.getByRole('button', { name: 'Reativar' }).click();
    await expect(
      page.getByText('Revise o cadastro antes de reativar.'),
    ).toBeVisible();
    await bruno.getByLabel(/Revisei o cadastro/).check();
    await bruno.getByRole('button', { name: 'Reativar' }).click();
    await expect(
      bruno.getByRole('button', { name: 'Desativar' }),
    ).toBeVisible();
  });
});
