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
    await expect(
      page.getByRole('heading', { name: 'Alunos', exact: true }),
    ).toBeVisible();
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

  test('shows guardians, WhatsApp flag and sibling authorization after login', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Responsáveis', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Maria Souza • mãe • WhatsApp')).toBeVisible();
    await expect(page.getByText('Paulo Nunes • pai')).toBeVisible();
    await expect(
      page.getByText('Ana Souza • ~8 • 3º A • Resp.: Maria Souza'),
    ).toBeVisible();
    await expect(
      page.getByText('Bruno Lima pode lançar na conta de Ana Souza • ~8'),
    ).toBeVisible();
  });

  test('shows catalog products after login and keeps ad-hoc to the owner', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Produtos', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • Salgados • R$ 5,50')).toBeVisible();
    await expect(page.locator('#ad-hoc-block')).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await expect(page.getByText('Coxinha • Salgados • R$ 5,50')).toBeVisible();
    await expect(page.locator('#ad-hoc-block')).toBeHidden();
  });

  test('shows daily stock after login and keeps adjustments to the owner', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Estoque do dia', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • 10')).toBeVisible();
    await expect(page.getByText('Suco de uva • ACABOU')).toBeVisible();
    await expect(page.locator('#inventory-adjust-form')).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await expect(page.getByText('Coxinha • 10')).toBeVisible();
    await expect(page.getByText('Suco de uva • ACABOU')).toBeVisible();
    await expect(page.locator('#inventory-adjust-form')).toBeHidden();
  });

  test('records an anonymous PIX sale after login and lowers Coxinha stock', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Chave PIX de teste: cantina-e2e@example.test'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText('Anônima • Coxinha • R$ 5,50', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • 9')).toBeVisible();
  });

  test('records an anonymous cash sale with change after login', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.locator('#sale-payment-kind').selectOption('cash');
    await page.locator('#sale-cash-amount').fill('10,00');
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText('Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50'),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • 9')).toBeVisible();
  });

  test('records a student fiado sale with tomorrow shortcut after login', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText(
        'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • Sexta-feira • 14/08/26',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Próximos', exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • 9')).toBeVisible();
  });

  test('pays the oldest fiado first and keeps the later due date', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-date').fill('2026-08-12');
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#agenda-overdue')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Quarta-feira • 12/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • 8')).toBeVisible();

    await page
      .locator('#payment-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#payment-amount').fill('5,50');
    await page.getByRole('button', { name: 'Registrar pagamento' }).click();
    await expect(
      page
        .locator('#payments-list')
        .getByText('Ana Souza • ~8 • R$ 5,50 • PIX', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page
        .locator('#agenda-overdue')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Quarta-feira • 12/08/26', {
          exact: true,
        }),
    ).toHaveCount(0);
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
  });

  test('allocates a manual partial onto the later fiado due date', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Pagamentos', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-date').fill('2026-08-12');
    await page.getByRole('button', { name: 'Confirmar venda' }).click();

    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await page
      .locator('#payment-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#payment-mode').selectOption('manual');
    await page.locator('#payment-amount').fill('2,50');
    await page
      .locator('#payment-debts li')
      .filter({ hasText: 'Sexta-feira • 14/08/26' })
      .locator('input')
      .fill('2,50');
    await page.getByRole('button', { name: 'Registrar pagamento' }).click();
    await expect(
      page
        .locator('#payments-list')
        .getByText('Ana Souza • ~8 • R$ 2,50 • PIX', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page
        .locator('#agenda-overdue')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Quarta-feira • 12/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 3,00 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
  });

  test('adds owner-only interest and renegotiates a fiado due date', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('button', { name: 'Lançar juros' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await page.locator('#adjust-receivable').selectOption({
      label: 'Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26',
    });
    await page.locator('#interest-amount').fill('1,00');
    await page.locator('#interest-reason').fill('Combinado na cantina');
    await page.getByRole('button', { name: 'Lançar juros' }).click();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 6,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await page.locator('#renegotiate-due-plus7').click();
    await page.locator('#renegotiate-reason').fill('Pedido da responsável');
    await page.getByRole('button', { name: 'Renegociar vencimento' }).click();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 6,50 • Quinta-feira • 20/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Ana Souza • ~8 • Sexta-feira • 14/08/26 → Quinta-feira • 20/08/26 • Pedido da responsável',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('hides interest and renegotiation from staff', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Lançar juros' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Renegociar vencimento' }),
    ).toHaveCount(0);
  });
});
