import { expect, type Page, test } from '@playwright/test';

function isAllowedLocalUrl(url: string): boolean {
  const parsed = new URL(url);
  if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
    return true;
  }

  return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
}

async function openLocalApp(page: Page, path = '/') {
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

  await page.goto(path);

  return { consoleErrors, pageErrors, externalRequests };
}

async function goToArea(page: Page, name: string) {
  await page
    .locator('#area-nav')
    .getByRole('button', { name, exact: true })
    .click();
}

type CantinaPerfSnapshot = { calls: number; methods: string[] };

async function resetCantinaPerf(page: Page): Promise<void> {
  await page.evaluate(() => {
    const perf = (
      window as Window & {
        __cantinaPerf?: { reset: () => void };
      }
    ).__cantinaPerf;
    if (!perf) {
      throw new Error('__cantinaPerf ausente');
    }
    perf.reset();
  });
}

async function snapshotCantinaPerf(page: Page): Promise<CantinaPerfSnapshot> {
  return page.evaluate(() => {
    const perf = (
      window as Window & {
        __cantinaPerf?: {
          snapshot: () => { calls: number; methods: string[] };
        };
      }
    ).__cantinaPerf;
    if (!perf) {
      throw new Error('__cantinaPerf ausente');
    }
    return perf.snapshot();
  });
}

async function fillInternalReservationStudent(page: Page) {
  await page.locator('#reservation-student-search').fill('Ana Souza');
  await page.locator('#reservation-student').selectOption({
    label: 'Ana Souza • ~8',
  });
  await expect(page.locator('#reservation-classroom')).toHaveValue('3º A');
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

  test('interface is fixed on the pastel light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openLocalApp(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-preference',
      'light',
    );
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('keeps every management form before its independently scrollable list', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    const areas: Array<{
      name: string;
      pairs: Array<[string, string]>;
    }> = [
      {
        name: 'Alunos',
        pairs: [
          ['#student-form', '#students-list'],
          ['#classroom-form', '#classrooms-list'],
        ],
      },
      {
        name: 'Responsáveis',
        pairs: [
          ['#guardian-form', '#guardians-list'],
          ['#sibling-auth-form', '#authorizations-list'],
          ['#guardian-credit-auth-form', '#guardian-credit-links'],
        ],
      },
      {
        name: 'Cardápio',
        pairs: [
          ['#category-form', '#categories-list'],
          ['#product-form', '#products-list'],
          ['#ad-hoc-form', '#ad-hoc-list'],
        ],
      },
      {
        name: 'Estoque',
        pairs: [['#inventory-adjust-form', '#inventory-list']],
      },
      {
        name: 'Reservas',
        pairs: [
          ['#reservation-slot-form', '#reservation-slots-list'],
          ['#reservation-create-form', '#reservation-availability'],
          ['#reservation-action-reason', '#reservations-list'],
        ],
      },
      {
        name: 'Vendas',
        pairs: [['#sale-confirm-form', '#sale-cart-list']],
      },
      {
        name: 'Pagamentos',
        pairs: [['#family-payment-form', '#payments-list']],
      },
      {
        name: 'Crédito',
        pairs: [['#guardian-credit-deposit-form', '#credits-list']],
      },
      {
        name: 'Caixa',
        pairs: [['#cash-open-form', '#cash-movements']],
      },
      {
        name: 'Estornos',
        pairs: [['#reversal-forms', '#reversals-history']],
      },
      {
        name: 'Juros',
        pairs: [['#renegotiate-form', '#due-date-history']],
      },
    ];

    for (const area of areas) {
      await goToArea(page, area.name);
      for (const [controlSelector, listSelector] of area.pairs) {
        const layout = await page.evaluate(
          ({ controlSelector, listSelector }) => {
            const control = document.querySelector(controlSelector);
            const list = document.querySelector(listSelector);
            if (
              !(control instanceof HTMLElement) ||
              !(list instanceof HTMLElement)
            ) {
              return null;
            }
            return {
              controlComesFirst: Boolean(
                control.compareDocumentPosition(list) &
                Node.DOCUMENT_POSITION_FOLLOWING,
              ),
              overflowY: getComputedStyle(list).overflowY,
              maxHeight: getComputedStyle(list).maxHeight,
            };
          },
          { controlSelector, listSelector },
        );
        expect(
          layout,
          `${area.name}: ${controlSelector} → ${listSelector}`,
        ).not.toBeNull();
        expect(layout?.controlComesFirst).toBe(true);
        expect(layout?.overflowY).toBe('auto');
        expect(layout?.maxHeight).not.toBe('none');
      }
    }
  });

  test('keeps credit fields visible while a long credit list scrolls on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Crédito');
    await expect(page.locator('#credit-student')).toContainText('Ana Souza');
    await page.locator('#credits-list').evaluate((list) => {
      for (let index = 0; index < 40; index += 1) {
        const item = document.createElement('li');
        item.textContent = `Crédito de teste ${index + 1}`;
        list.append(item);
      }
    });
    const form = page.locator('#guardian-credit-deposit-form');
    const list = page.locator('#credits-list');
    await form.scrollIntoViewIfNeeded();
    const before = await form.boundingBox();
    const scrollState = await list.evaluate((element) => {
      element.scrollTo({ top: 240, behavior: 'instant' });
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
    });
    const after = await form.boundingBox();
    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
    expect(scrollState.scrollTop).toBeGreaterThan(0);
    expect(after?.y).toBe(before?.y);
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
    await goToArea(page, 'Alunos');
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
    await goToArea(page, 'Responsáveis');
    await expect(
      page.getByRole('heading', { name: 'Responsáveis', exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('#guardians-list').getByText('Maria Souza • mãe • WhatsApp'),
    ).toBeVisible();
    await expect(
      page.locator('#guardians-list').getByText('Paulo Nunes • pai'),
    ).toBeVisible();
    await expect(
      page.getByText('Bruno Lima pode lançar na conta de Ana Souza • ~8'),
    ).toBeVisible();
    await goToArea(page, 'Alunos');
    await expect(
      page.getByText('Ana Souza • ~8 • 3º A • Resp.: Maria Souza'),
    ).toBeVisible();
  });

  test('shows catalog products after login and keeps ad-hoc to the owner', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Cardápio');
    await expect(
      page.getByRole('heading', { name: 'Cardápio', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Categorias', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Produtos', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • Salgados • R$ 5,50')).toBeVisible();
    await expect(page.locator('#ad-hoc-block')).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await goToArea(page, 'Cardápio');
    await expect(page.getByText('Coxinha • Salgados • R$ 5,50')).toBeVisible();
    await expect(page.locator('#ad-hoc-block')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Editar' }).first(),
    ).toBeVisible();
  });

  test('edits an existing catalog product from the cardápio', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Cardápio');
    const coxinha = page
      .locator('#products-list')
      .getByRole('listitem')
      .filter({ hasText: 'Coxinha • Salgados • R$ 5,50' });
    await coxinha.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#product-name')).toHaveValue('Coxinha');
    await expect(page.locator('#product-price')).toHaveValue('5,50');
    await expect(page.locator('#product-discount')).toBeChecked();
    await expect(page.locator('#product-stock')).toBeChecked();
    await expect(page.locator('#product-reservable')).toBeChecked();
    await page.locator('#product-price').fill('6,00');
    await page.getByRole('button', { name: 'Salvar produto' }).click();
    await expect(
      page.locator('#products-list').getByText('Coxinha • Salgados • R$ 6,00'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Cadastrar produto' }),
    ).toBeVisible();
    await goToArea(page, 'Vendas');
    await expect(page.locator('#sale-product')).toContainText(
      'Coxinha • R$ 6,00',
    );
    await goToArea(page, 'Cardápio');
    await page.locator('#product-name').fill('Produto e2e excluir');
    await page.locator('#product-price').fill('1,00');
    await page.getByRole('button', { name: 'Cadastrar produto' }).click();
    const extraProduct = page
      .locator('#products-list')
      .getByRole('listitem')
      .filter({ hasText: 'Produto e2e excluir' });
    await goToArea(page, 'Estoque');
    await expect(page.locator('#inventory-adjust-product')).toContainText(
      'Produto e2e excluir',
    );
    await expect(page.getByText('Produto e2e excluir • ACABOU')).toBeVisible();
    await goToArea(page, 'Cardápio');
    await extraProduct.getByRole('button', { name: 'Excluir' }).click();
    await expect(
      page
        .locator('#products-list')
        .getByRole('listitem')
        .filter({ hasText: 'Produto e2e excluir' }),
    ).toHaveCount(0);
    await goToArea(page, 'Vendas');
    await expect(page.locator('#sale-product')).not.toContainText(
      'Produto e2e excluir',
    );
    await goToArea(page, 'Cardápio');
    await page.locator('#product-name').fill('Produto e2e inativar');
    await page.locator('#product-price').fill('1,00');
    await page.getByRole('button', { name: 'Cadastrar produto' }).click();
    const inactiveProduct = page
      .locator('#products-list')
      .getByRole('listitem')
      .filter({ hasText: 'Produto e2e inativar' });
    await inactiveProduct.getByRole('button', { name: 'Inativar' }).click();
    await expect(inactiveProduct).toContainText('Inativo');
    await expect(
      inactiveProduct.getByRole('button', { name: 'Inativar' }),
    ).toHaveCount(0);
    await goToArea(page, 'Estoque');
    await expect(page.locator('#inventory-adjust-product')).not.toContainText(
      'Produto e2e inativar',
    );
    await goToArea(page, 'Vendas');
    await expect(page.locator('#sale-product')).not.toContainText(
      'Produto e2e inativar',
    );
    await goToArea(page, 'Cardápio');
    await page
      .locator('#products-list')
      .getByRole('listitem')
      .filter({ hasText: 'Coxinha • Salgados • R$ 6,00' })
      .getByRole('button', { name: 'Excluir' })
      .click();
    await expect(page.locator('#products-status')).toHaveText(
      'Não é possível excluir o produto porque ele já entrou em venda, estoque ou reserva. Inative-o.',
    );
    await expect(
      page.locator('#products-list').getByText('Coxinha • Salgados • R$ 6,00'),
    ).toBeVisible();
  });

  test('edits an existing student and creates a classroom', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Alunos');
    await page.locator('#classroom-name').fill('5º C');
    await page.getByRole('button', { name: 'Cadastrar turma' }).click();
    await expect(page.locator('#student-classroom')).toContainText('5º C');
    const ana = page
      .locator('#students-list')
      .getByRole('listitem')
      .filter({ hasText: 'Ana Souza • ~8 • 3º A' });
    await ana.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#student-name')).toHaveValue('Ana Souza');
    await page.locator('#student-classroom').selectOption({ label: '5º C' });
    await page.getByRole('button', { name: 'Salvar aluno' }).click();
    await expect(
      page
        .locator('#students-list')
        .getByText('Ana Souza • ~8 • 5º C', { exact: false }),
    ).toBeVisible();
    await expect(page.locator('#busy-banner')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Cadastrar aluno' }),
    ).toBeVisible();
    await expect(
      page.locator('#classrooms-list').getByText('5º C'),
    ).toBeVisible();
    await page.locator('#classroom-name').fill('6º D');
    await page.getByRole('button', { name: 'Cadastrar turma' }).click();
    const sixth = page
      .locator('#classrooms-list')
      .getByRole('listitem')
      .filter({ hasText: '6º D' });
    await sixth.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#classroom-name')).toHaveValue('6º D');
    await page.locator('#classroom-name').fill('6º E');
    await page.getByRole('button', { name: 'Salvar turma' }).click();
    const sixthRenamed = page
      .locator('#classrooms-list')
      .getByRole('listitem')
      .filter({ hasText: '6º E' });
    await expect(sixthRenamed).toBeVisible();
    await sixthRenamed.getByRole('button', { name: 'Excluir' }).click();
    await expect(
      page.locator('#classrooms-list').getByText('6º E (inativa)'),
    ).toBeVisible();
    await expect(page.locator('#student-classroom')).not.toContainText('6º E');
    const third = page
      .locator('#classrooms-list')
      .getByRole('listitem')
      .filter({ hasText: '3º A' });
    await third.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator('#students-status')).toHaveText(
      'Não é possível excluir a turma enquanto houver alunos ativos nela.',
    );
    await expect(third.getByRole('button', { name: 'Excluir' })).toBeVisible();
  });

  test('shows Processando while a cadastro save runs', async ({ page }) => {
    await openLocalApp(page, '/?e2eBusy=1');
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Alunos');
    const ana = page
      .locator('#students-list')
      .getByRole('listitem')
      .filter({ hasText: 'Ana Souza • ~8 • 3º A' });
    await ana.getByRole('button', { name: 'Editar' }).click();
    const pending = page.getByRole('button', { name: 'Salvar aluno' }).click();
    await expect(page.locator('#busy-banner')).toHaveText('Processando ação…');
    await pending;
    await expect(page.locator('#busy-banner')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Cadastrar aluno' }),
    ).toBeVisible();
  });

  test('edits an existing guardian', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Responsáveis');
    const maria = page
      .locator('#guardians-list')
      .getByRole('listitem')
      .filter({ hasText: 'Maria Souza • mãe • WhatsApp' });
    await maria.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#guardian-name')).toHaveValue('Maria Souza');
    await page.locator('#guardian-relation').fill('titia');
    await page.getByRole('button', { name: 'Salvar responsável' }).click();
    await expect(
      page
        .locator('#guardians-list')
        .getByText('Maria Souza • titia • WhatsApp'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Cadastrar responsável' }),
    ).toBeVisible();
    await page.locator('#guardian-name').fill('Responsável e2e');
    await page.getByRole('button', { name: 'Cadastrar responsável' }).click();
    const extraGuardian = page
      .locator('#guardians-list')
      .getByRole('listitem')
      .filter({ hasText: 'Responsável e2e' });
    await extraGuardian.getByRole('button', { name: 'Desativar' }).click();
    await expect(
      page.locator('#guardians-list').getByText('Responsável e2e • Inativo'),
    ).toBeVisible();
    await expect(
      extraGuardian.getByRole('button', { name: 'Desativar' }),
    ).toHaveCount(0);
    await extraGuardian.getByRole('button', { name: 'Reativar' }).click();
    await expect(extraGuardian).toBeVisible();
    await expect(extraGuardian).not.toContainText('Inativo');
    await expect(
      extraGuardian.getByRole('button', { name: 'Desativar' }),
    ).toBeVisible();
  });

  test('sets a primary guardian and unlinks via the links list', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Responsáveis');
    await page.locator('#credit-auth-student').selectOption({
      label: 'Ana Souza • ~8',
    });
    await page.locator('#credit-auth-guardian').selectOption({
      label: 'Paulo Nunes • pai',
    });
    await page.getByRole('button', { name: 'Salvar autorização' }).click();
    const pauloLink = page
      .locator('#guardian-credit-links')
      .getByRole('listitem')
      .filter({ hasText: 'Ana Souza • ~8 • Paulo Nunes' });
    await expect(pauloLink).toBeVisible();
    await pauloLink.getByRole('button', { name: 'Tornar principal' }).click();
    await expect(
      page
        .locator('#guardian-credit-links')
        .getByText('Ana Souza • ~8 • Paulo Nunes • principal', { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('#guardian-credit-links')
        .getByText('Ana Souza • ~8 • Maria Souza • principal', { exact: true }),
    ).toHaveCount(0);
    await pauloLink.getByRole('button', { name: 'Desvincular' }).click();
    await expect(pauloLink).toHaveCount(0);
    await expect(
      page
        .locator('#guardian-credit-links')
        .getByText('Ana Souza • ~8 • Maria Souza', { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('#guardian-credit-links')
        .getByText('Ana Souza • 10 • Paulo Nunes • principal', { exact: true }),
    ).toBeVisible();
  });

  test('creates and edits a product category', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Cardápio');
    await expect(
      page.getByRole('button', { name: 'Cadastrar categoria' }),
    ).toBeVisible();
    await page.locator('#category-name').fill('Lanches');
    await page.getByRole('button', { name: 'Cadastrar categoria' }).click();
    const lanches = page
      .locator('#categories-list')
      .getByRole('listitem')
      .filter({ hasText: 'Lanches' });
    await expect(lanches).toBeVisible();
    await lanches.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#category-name')).toHaveValue('Lanches');
    await page.locator('#category-name').fill('Lanche da tarde');
    await page.getByRole('button', { name: 'Salvar categoria' }).click();
    await expect(
      page.locator('#categories-list').getByText('Lanche da tarde'),
    ).toBeVisible();
    await expect(page.locator('#product-category')).toContainText(
      'Lanche da tarde',
    );
    await expect(
      page.getByRole('button', { name: 'Cadastrar categoria' }),
    ).toBeVisible();
    await page
      .locator('#categories-list')
      .getByRole('listitem')
      .filter({ hasText: 'Lanche da tarde' })
      .getByRole('button', { name: 'Excluir' })
      .click();
    await expect(
      page.locator('#categories-list').getByText('Lanche da tarde'),
    ).toHaveCount(0);
    await expect(page.locator('#product-category')).not.toContainText(
      'Lanche da tarde',
    );
    await page.locator('#category-name').fill('Lanche inativar');
    await page.getByRole('button', { name: 'Cadastrar categoria' }).click();
    const inactivateCategory = page
      .locator('#categories-list')
      .getByRole('listitem')
      .filter({ hasText: 'Lanche inativar' });
    await inactivateCategory.getByRole('button', { name: 'Inativar' }).click();
    await expect(
      page.locator('#categories-list').getByText('Lanche inativar (inativa)'),
    ).toBeVisible();
    await expect(page.locator('#product-category')).not.toContainText(
      'Lanche inativar',
    );
    await page
      .locator('#categories-list')
      .getByRole('listitem')
      .filter({ hasText: 'Salgados' })
      .getByRole('button', { name: 'Excluir' })
      .click();
    await expect(page.locator('#products-status')).toHaveText(
      'Não é possível excluir a categoria enquanto houver produtos nela.',
    );
    await expect(
      page
        .locator('#categories-list')
        .getByRole('listitem')
        .filter({ hasText: 'Salgados' })
        .getByRole('button', { name: 'Excluir' }),
    ).toBeVisible();
  });

  test('shows daily stock after login and keeps adjustments to the owner', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Estoque');
    await expect(
      page.getByRole('heading', { name: 'Estoque do dia', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Coxinha • 10')).toBeVisible();
    await expect(page.getByText('Suco de uva • ACABOU')).toBeVisible();
    await expect(page.locator('#inventory-adjust-form')).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await goToArea(page, 'Estoque');
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
      page
        .locator('#sales-list')
        .getByText('Anônima • Coxinha • R$ 5,50', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9')).toBeVisible();
  });

  test('records an anonymous cash sale with change after login', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Caixa');
    await page.getByRole('button', { name: 'Abrir caixa' }).click();
    await expect(page.getByText(/Aberto •/)).toBeVisible();
    await goToArea(page, 'Vendas');
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.locator('#sale-payment-kind').selectOption('cash');
    await page.locator('#sale-cash-amount').fill('10,00');
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText('Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50'),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
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
    await goToArea(page, 'Agenda');
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
    await goToArea(page, 'Estoque');
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
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-overdue')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Quarta-feira • 12/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await goToArea(page, 'Vendas');
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 8')).toBeVisible();

    await goToArea(page, 'Pagamentos');
    await page
      .locator('#payment-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#payment-amount').fill('5,50');
    await page
      .getByRole('button', { name: 'Registrar pagamento', exact: true })
      .click();
    await expect(
      page
        .locator('#payments-list')
        .getByText('Ana Souza • ~8 • R$ 5,50 • PIX', {
          exact: true,
        }),
    ).toBeVisible();
    await goToArea(page, 'Agenda');
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
      page.getByRole('heading', { name: 'Vendas', exact: true }),
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
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await goToArea(page, 'Pagamentos');
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
    await page
      .getByRole('button', { name: 'Registrar pagamento', exact: true })
      .click();
    await expect(
      page
        .locator('#payments-list')
        .getByText('Ana Souza • ~8 • R$ 2,50 • PIX', {
          exact: true,
        }),
    ).toBeVisible();
    await goToArea(page, 'Agenda');
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
      page.locator('#area-nav').getByRole('button', { name: 'Juros' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await goToArea(page, 'Juros');
    await expect(
      page.getByRole('button', { name: 'Lançar juros' }),
    ).toBeVisible();
    await page.locator('#adjust-receivable').selectOption({
      label: 'Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26',
    });
    await page.locator('#interest-amount').fill('1,00');
    await page.locator('#interest-reason').fill('Combinado na cantina');
    await page.getByRole('button', { name: 'Lançar juros' }).click();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 6,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();

    await goToArea(page, 'Juros');
    await page.locator('#renegotiate-due-plus7').click();
    await page.locator('#renegotiate-reason').fill('Pedido da responsável');
    await page.getByRole('button', { name: 'Renegociar vencimento' }).click();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 6,50 • Quinta-feira • 20/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await goToArea(page, 'Juros');
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
      page.locator('#area-nav').getByRole('button', { name: 'Juros' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Lançar juros' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Renegociar vencimento' }),
    ).toHaveCount(0);
    await goToArea(page, 'Crédito');
    await expect(
      page.getByRole('button', { name: 'Devolver crédito', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Entrar crédito', exact: true }),
    ).toBeVisible();
  });

  test('uses personal credit on fiado and leaves the remainder', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Crédito');
    await page.locator('#credit-student').selectOption({
      label: 'Ana Souza • ~8',
    });
    await page.locator('#credit-amount').fill('2,00');
    await page
      .getByRole('button', { name: 'Entrar crédito', exact: true })
      .click();
    await expect(
      page.locator('#credits-list').getByText('Ana Souza • ~8 • R$ 2,00', {
        exact: true,
      }),
    ).toBeVisible();

    await goToArea(page, 'Vendas');
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText(
        'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito R$ 2,00 • Sexta-feira • 14/08/26',
        { exact: true },
      ),
    ).toBeVisible();
    await goToArea(page, 'Crédito');
    await expect(
      page.locator('#credits-list').getByText('Ana Souza • ~8 • R$ 0,00', {
        exact: true,
      }),
    ).toBeVisible();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 3,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
  });

  test('uses authorized guardian credit on fiado and keeps sibling credit unused', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Responsáveis');
    await page.locator('#credit-auth-student').selectOption({
      label: 'Ana Souza • ~8',
    });
    await page.locator('#credit-auth-guardian').selectOption({
      label: 'Maria Souza • mãe • WhatsApp',
    });
    await page.locator('#credit-auth-can-use').check();
    await page.getByRole('button', { name: 'Salvar autorização' }).click();
    await expect(
      page.getByText(
        'Ana Souza • ~8 • Maria Souza • principal • pode usar crédito',
        { exact: true },
      ),
    ).toBeVisible();

    await goToArea(page, 'Crédito');
    await page.locator('#credit-guardian').selectOption({
      label: 'Maria Souza • mãe • WhatsApp',
    });
    await page.locator('#guardian-credit-amount').fill('2,00');
    await page
      .getByRole('button', { name: 'Entrar crédito do responsável' })
      .click();
    await expect(
      page.locator('#credits-list').getByText('Maria Souza • mãe • R$ 2,00', {
        exact: true,
      }),
    ).toBeVisible();

    await goToArea(page, 'Vendas');
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText(
        'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito resp. R$ 2,00 • Sexta-feira • 14/08/26',
        { exact: true },
      ),
    ).toBeVisible();
    await goToArea(page, 'Crédito');
    await expect(
      page.locator('#credits-list').getByText('Maria Souza • mãe • R$ 0,00', {
        exact: true,
      }),
    ).toBeVisible();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 3,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
  });

  test('lets the owner refund personal credit', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Crédito');
    await expect(
      page.getByRole('button', { name: 'Devolver crédito', exact: true }),
    ).toBeVisible();
    await page.locator('#credit-student').selectOption({
      label: 'Ana Souza • ~8',
    });
    await page.locator('#credit-amount').fill('2,00');
    await page
      .getByRole('button', { name: 'Entrar crédito', exact: true })
      .click();
    await expect(
      page.locator('#credits-list').getByText('Ana Souza • ~8 • R$ 2,00', {
        exact: true,
      }),
    ).toBeVisible();
    await page.locator('#credit-refund-amount').fill('2,00');
    await page.locator('#credit-refund-reason').fill('Devolução pedida');
    await page
      .getByRole('button', { name: 'Devolver crédito', exact: true })
      .click();
    await expect(
      page.locator('#credits-list').getByText('Ana Souza • ~8 • R$ 0,00', {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('records a family payment as debt plus leftover guardian credit', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();

    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Bruno Lima • 11' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 8', { exact: true })).toBeVisible();

    await goToArea(page, 'Pagamentos');
    await page.locator('#family-payment-guardian').selectOption({
      label: 'Maria Souza • mãe • WhatsApp',
    });
    await page.locator('#family-payment-amount').fill('2,00');
    await page.locator('#family-payment-mode').selectOption('credit_remainder');
    await page
      .locator('#family-payment-debts li')
      .filter({ hasText: 'Ana Souza • ~8' })
      .locator('input')
      .fill('0,20');
    await page
      .locator('#family-payment-debts li')
      .filter({ hasText: 'Bruno Lima • 11' })
      .locator('input')
      .fill('0,15');
    await page
      .getByRole('button', { name: 'Registrar pagamento familiar' })
      .click();
    await expect(
      page
        .locator('#payments-list')
        .getByText(
          'Maria Souza • mãe • R$ 2,00 • PIX • Ana Souza • ~8 R$ 0,20 • Bruno Lima • 11 R$ 0,15 • crédito R$ 1,65',
          { exact: true },
        ),
    ).toBeVisible();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,30 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Bruno Lima • 11 • R$ 5,35 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await goToArea(page, 'Crédito');
    await expect(
      page.locator('#credits-list').getByText('Maria Souza • mãe • R$ 1,65', {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('charges a sibling fiado on the authorized account', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-student')
      .selectOption({ label: 'Bruno Lima • 11' });
    await page
      .locator('#sale-account')
      .selectOption({ label: 'Ana Souza • ~8' });
    await page.locator('#sale-payment-kind').selectOption('fiado');
    await page.locator('#sale-due-tomorrow').click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText(
        'Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • Sexta-feira • 14/08/26',
        { exact: true },
      ),
    ).toBeVisible();
    await goToArea(page, 'Agenda');
    await expect(
      page
        .locator('#agenda-upcoming')
        .getByText('Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page.locator('#agenda-upcoming').getByText('Bruno Lima • 11', {
        exact: false,
      }),
    ).toHaveCount(0);
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
  });

  test('opens cash and records R$ 8,00 received as R$ 10,00 with R$ 2,00 change', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Caixa');
    await page.getByRole('button', { name: 'Abrir caixa' }).click();
    await expect(
      page.getByText(
        'Aberto • Quinta-feira • 13/08/26 • troco inicial R$ 0,00 • esperado R$ 0,00',
        { exact: true },
      ),
    ).toBeVisible();
    await goToArea(page, 'Vendas');
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page
      .locator('#sale-product')
      .selectOption({ label: 'Brigadeiro • R$ 2,50' });
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.locator('#sale-payment-kind').selectOption('cash');
    await page.locator('#sale-cash-amount').fill('10,00');
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page.getByText(
        'Anônima • Coxinha, Brigadeiro • R$ 8,00 • Dinheiro • Troco R$ 2,00',
        { exact: true },
      ),
    ).toBeVisible();
    await goToArea(page, 'Caixa');
    await expect(
      page.getByText('entrada R$ 10,00', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('troco R$ 2,00', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Aberto • Quinta-feira • 13/08/26 • troco inicial R$ 0,00 • esperado R$ 8,00',
        { exact: true },
      ),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
  });

  test('reverses a PIX sale with stock return', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#sales-list')
        .getByText('Anônima • Coxinha • R$ 5,50', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
    await goToArea(page, 'Estornos');
    await expect(
      page.getByRole('heading', { name: 'Estornos completos' }),
    ).toBeVisible();
    await page.locator('#reverse-sale-id').selectOption({
      label: 'Anônima • Coxinha • R$ 5,50',
    });
    await page.getByLabel('Sim, devolver ao estoque').check();
    await page
      .getByLabel('Motivo do estorno da venda')
      .fill('Venda lançada em duplicidade');
    await page
      .getByRole('button', { name: 'Confirmar estorno da venda' })
      .click();
    await expect(
      page.getByText('Produto retornado ao estoque: +1', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 10', { exact: true })).toBeVisible();
  });

  test('reverses a PIX sale without returning stock', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await goToArea(page, 'Estornos');
    await page.locator('#reverse-sale-id').selectOption({
      label: 'Anônima • Coxinha • R$ 5,50',
    });
    await page.getByLabel('Não, manter fora do estoque').check();
    await page
      .getByLabel('Motivo do estorno da venda')
      .fill('Produto não voltou');
    await page
      .getByRole('button', { name: 'Confirmar estorno da venda' })
      .click();
    await expect(
      page.getByText(
        'Venda estornada; original e efeitos permanecem auditáveis.',
      ),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
  });

  test('hides reversal actions from staff and keeps the audit', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await goToArea(page, 'Estornos');
    await expect(
      page.getByRole('heading', { name: 'Estornos completos' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Confirmar estorno da venda' }),
    ).toHaveCount(0);
    await expect(
      page.getByText(
        'Funcionários podem consultar a auditoria. Somente a dona pode realizar estornos.',
      ),
    ).toBeVisible();
  });

  test('reserves Coxinha for the afternoon recreio and keeps physical stock', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Reservas');
    await expect(
      page.getByRole('heading', { name: 'Reservas do recreio' }),
    ).toBeVisible();
    await page.locator('#reservation-slot-id').selectOption({
      label: 'Recreio tarde • corte 18:00 • retirada 18:15–18:35',
    });
    await fillInternalReservationStudent(page);
    await page.locator('#reservation-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(
      page.getByText(
        'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText('Coxinha • disponível 9 • reservado 1', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 10', { exact: true })).toBeVisible();
  });

  test('hides recreio creation from staff and keeps reservation actions', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como funcionário' }).click();
    await goToArea(page, 'Reservas');
    await expect(
      page.getByRole('heading', { name: 'Reservas do recreio' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Criar recreio' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Confirmar reserva' }),
    ).toBeVisible();
    await expect(page.getByLabel('Pesquisar aluno')).toBeVisible();
    await expect(page.getByLabel('Aluno da reserva')).toBeVisible();
    await expect(page.getByLabel('Pesquisar reserva')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Produção' })).toBeVisible();
    await expect(page.locator('#reservation-slots-list')).toBeEmpty();
  });

  test('lets the owner edit and deactivate a recreio slot', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Reservas');
    const tarde = page
      .locator('#reservation-slots-list')
      .getByRole('listitem')
      .filter({ hasText: 'Recreio tarde' });
    await expect(tarde).toBeVisible();
    await tarde.getByRole('button', { name: 'Editar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Editar recreio' }),
    ).toBeVisible();
    await expect(page.locator('#reservation-slot-label')).toHaveValue(
      'Recreio tarde',
    );
    await expect(page.locator('#reservation-slot-cutoff')).toHaveValue('18:00');
    await page.locator('#reservation-slot-label').fill('Recreio da tarde');
    await page.getByRole('button', { name: 'Salvar recreio' }).click();
    await expect(
      page.locator('#reservation-slots-list').getByText('Recreio da tarde'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Criar recreio' }),
    ).toBeVisible();
    const updated = page
      .locator('#reservation-slots-list')
      .getByRole('listitem')
      .filter({ hasText: 'Recreio da tarde' });
    await updated.getByRole('button', { name: 'Desativar' }).click();
    await expect(updated).toContainText('Inativo');
    await expect(
      updated.getByRole('button', { name: 'Desativar' }),
    ).toHaveCount(0);
  });

  test('filters the internal reservation student selector by search', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Reservas');
    await page.locator('#reservation-student-search').fill('Ana');
    await expect(page.locator('#reservation-student')).toContainText(
      'Ana Souza',
    );
    await expect(page.locator('#reservation-student')).not.toContainText(
      'Bruno Lima',
    );
    await page.locator('#reservation-student-search').fill('ZZZ');
    await expect(page.locator('#reservation-student')).not.toContainText(
      'Ana Souza',
    );
    await expect(page.locator('#reservation-student')).not.toContainText(
      'Bruno Lima',
    );
  });

  test('creates a public recreio reservation without login or private autocomplete', async ({
    page,
  }) => {
    await openLocalApp(page, '/?portal=reservas');
    await expect(
      page.getByRole('heading', { name: 'Reservar recreio' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Entrar como dona' }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Alunos' })).toHaveCount(0);
    await expect(page.locator('#reservation-student-search')).toBeHidden();
    await expect(page.locator('#reservation-student')).toBeHidden();
    await expect(
      page.getByText('Coxinha • R$ 5,50 • disponível 10', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Suco de uva • R$ 4,00 • ACABOU', { exact: true }),
    ).toBeVisible();
    await page.locator('#public-portal-slot').selectOption({
      label: 'Recreio tarde • corte 18:00 • retirada 18:15–18:35',
    });
    await page.locator('#public-portal-name').fill('Ana Souza');
    await page.locator('#public-portal-classroom').fill('3º A');
    await page.locator('#public-portal-contact').fill('11999990000');
    await page.locator('#public-portal-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.getByRole('button', { name: 'Enviar reserva' }).click();
    await expect(page.locator('#public-portal-code')).toHaveText(
      /^Código [A-HJ-NP-Z2-9]{6}$/,
    );
    await expect(
      page.getByText(
        'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText('Coxinha • R$ 5,50 • disponível 9', { exact: true }),
    ).toBeVisible();
  });

  test('lets the owner search, link, update and deliver a recreio reservation', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Reservas');
    await page.locator('#reservation-slot-id').selectOption({
      label: 'Recreio tarde • corte 18:00 • retirada 18:15–18:35',
    });
    await fillInternalReservationStudent(page);
    await page.locator('#reservation-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.getByText('Coxinha • 1', { exact: true })).toBeVisible();
    await page.locator('#reservation-filter-slot').selectOption({
      label: 'Recreio manhã',
    });
    await expect(
      page.getByText(
        'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
        { exact: true },
      ),
    ).toHaveCount(0);
    await expect(page.getByText('Nenhuma reserva encontrada.')).toBeVisible();
    await page.locator('#reservation-filter-slot').selectOption({
      label: 'Todos os recreios',
    });
    await page.getByLabel('Pesquisar reserva').fill('Ana');
    await expect(
      page.getByText(
        'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
        { exact: true },
      ),
    ).toBeVisible();
    await page.getByLabel('Pesquisar reserva').fill('ZZZZZZ');
    await expect(page.getByText('Nenhuma reserva encontrada.')).toBeVisible();
    await page.getByLabel('Pesquisar reserva').fill('');
    await page.locator('#reservation-link-student').selectOption({
      label: 'Ana Souza • ~8',
    });
    await page.getByRole('button', { name: 'Vincular aluno' }).click();
    await expect(
      page.getByText('vinculada a Ana Souza • ~8', { exact: true }),
    ).toBeVisible();
    await page
      .locator('#reservations-list')
      .getByRole('button', { name: 'Alterar reserva' })
      .click();
    await page.locator('#reservation-edit-classroom').fill('4º B');
    await page
      .locator('#reservation-edit-form')
      .getByRole('button', { name: 'Alterar reserva' })
      .click();
    await expect(
      page.getByText(
        'Ana Souza • 4º B • Coxinha • R$ 5,50 • Recreio tarde • reservada',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('delivers a recreio reservation as a PIX sale without double stock drop', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Reservas');
    await page.locator('#reservation-slot-id').selectOption({
      label: 'Recreio tarde • corte 18:00 • retirada 18:15–18:35',
    });
    await fillInternalReservationStudent(page);
    await page.locator('#reservation-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await page.locator('#reservation-link-student').selectOption({
      label: 'Ana Souza • ~8',
    });
    await page.getByRole('button', { name: 'Vincular aluno' }).click();
    await page.getByRole('button', { name: 'Entregar reserva' }).click();
    await expect(page.getByRole('heading', { name: 'Vendas' })).toBeVisible();
    await expect(
      page.getByText(
        'Entrega da reserva. Escolha o pagamento e confirme a venda.',
      ),
    ).toBeVisible();
    await expect(
      page.locator('#sale-cart-list').getByText('Coxinha • 1', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#sales-list')
        .getByText('Ana Souza • ~8 • Coxinha • R$ 5,50', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Reservas');
    await expect(
      page.getByText(
        'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • retirada',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText('Coxinha • disponível 9 • reservado 0', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
  });

  test('lets the owner sell a reserved unit with an explicit override', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Reservas');
    await page.locator('#reservation-slot-id').selectOption({
      label: 'Recreio tarde • corte 18:00 • retirada 18:15–18:35',
    });
    await fillInternalReservationStudent(page);
    await page.locator('#reservation-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.locator('#reservation-quantity').fill('10');
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(
      page.getByText(
        'Reserva confirmada; o original e a disponibilidade permanecem auditáveis.',
      ),
    ).toBeVisible();
    await expect(
      page
        .locator('#reservations-list')
        .getByText(
          'Ana Souza • 3º A • Coxinha • R$ 55,00 • Recreio tarde • reservada',
          { exact: true },
        ),
    ).toBeVisible();
    await goToArea(page, 'Vendas');
    await page.locator('#sale-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.getByLabel('Usar unidade reservada').check();
    await page.locator('#sale-override-reservation').selectOption({
      label:
        'Ana Souza • 3º A • Coxinha • R$ 55,00 • Recreio tarde • reservada',
    });
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#sales-list')
        .getByText('Anônima • Coxinha • R$ 5,50', { exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Reservas');
    await expect(
      page
        .locator('#reservations-list')
        .getByText(
          'Ana Souza • 3º A • Coxinha • R$ 55,00 • Recreio tarde • cancelada',
          { exact: true },
        ),
    ).toBeVisible();
    await goToArea(page, 'Estoque');
    await expect(page.getByText('Coxinha • 9', { exact: true })).toBeVisible();
  });

  test('does not call the server when changing cart quantity and uses one createSale for PIX', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await page.locator('#sale-quantity').fill('2');
    await page.locator('#sale-product').selectOption({
      label: 'Coxinha • R$ 5,50',
    });
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await page.locator('#sale-payment-kind').selectOption('cash');
    await page.locator('#sale-payment-kind').selectOption('pix');
    const afterUi = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterUi.calls).toBe(0);
    expect(afterUi.methods).toEqual([]);

    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await page.getByRole('button', { name: 'Confirmar venda' }).click();
    await expect(
      page
        .locator('#sales-list')
        .getByText('Anônima • Coxinha • R$ 11,00', { exact: true }),
    ).toBeVisible();
    const afterSale = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterSale.methods).toEqual(['createSale']);
    expect(afterSale.calls).toBe(1);
  });

  test('uses one createProduct call when registering a catalog item', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Cardápio');
    await expect(
      page.getByRole('heading', { name: 'Cardápio', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await page.locator('#product-name').fill('Produto perf cadastro');
    await page.locator('#product-price').fill('2,00');
    await page.getByRole('button', { name: 'Cadastrar produto' }).click();
    await expect(
      page.locator('#products-list').getByText('Produto perf cadastro'),
    ).toBeVisible();
    const afterCreate = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterCreate.methods).toEqual(['createProduct']);
    expect(afterCreate.calls).toBe(1);
  });

  test('uses one deleteProduct call when removing a catalog item', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Cardápio');
    await page.locator('#product-name').fill('Produto perf excluir');
    await page.locator('#product-price').fill('2,00');
    await page.getByRole('button', { name: 'Cadastrar produto' }).click();
    const extraProduct = page
      .locator('#products-list')
      .getByRole('listitem')
      .filter({ hasText: 'Produto perf excluir' });
    await expect(extraProduct).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await extraProduct.getByRole('button', { name: 'Excluir' }).click();
    await expect(extraProduct).toHaveCount(0);
    const afterDelete = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterDelete.methods).toEqual(['deleteProduct']);
    expect(afterDelete.calls).toBe(1);
  });

  test('uses one deleteCategory call when removing a catalog category', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Cardápio');
    await page.locator('#category-name').fill('Categoria perf excluir');
    await page.getByRole('button', { name: 'Cadastrar categoria' }).click();
    const extraCategory = page
      .locator('#categories-list')
      .getByRole('listitem')
      .filter({ hasText: 'Categoria perf excluir' });
    await expect(extraCategory).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await extraCategory.getByRole('button', { name: 'Excluir' }).click();
    await expect(extraCategory).toHaveCount(0);
    const afterDelete = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterDelete.methods).toEqual(['deleteCategory']);
    expect(afterDelete.calls).toBe(1);
  });

  test('uses one adjustInventory call when updating stock', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Estoque');
    await expect(page.locator('#inventory-adjust-form')).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await page.locator('#inventory-adjust-product').selectOption({
      label: 'Coxinha',
    });
    await page.locator('#inventory-adjust-delta').fill('1');
    await page.locator('#inventory-adjust-reason').fill('Ajuste de teste');
    await page.getByRole('button', { name: 'Ajustar estoque' }).click();
    await expect(
      page.locator('#inventory-list').getByText('Coxinha • 11'),
    ).toBeVisible();
    const afterAdjust = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterAdjust.methods).toEqual(['adjustInventory']);
    expect(afterAdjust.calls).toBe(1);
  });

  test('adjusts stock from the item button with stepper and reason suggestions', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Estoque');
    await expect(page.locator('#inventory-adjust-form')).toBeVisible();
    await expect(
      page.locator('#inventory-reason-options option[value="Reposição"]'),
    ).toHaveCount(1);
    const coxinhaRow = page
      .locator('#inventory-list')
      .getByRole('listitem')
      .filter({ hasText: 'Coxinha • 10' });
    await coxinhaRow.getByRole('button', { name: 'Ajustar' }).click();
    await expect(page.locator('#inventory-adjust-product')).toHaveValue(
      /^[0-9a-f-]{36}$/,
    );
    await expect(page.locator('#inventory-status')).toContainText(
      'Ajustando Coxinha',
    );
    await page.locator('#inventory-delta-plus').click();
    await page.locator('#inventory-delta-plus').click();
    await page.locator('#inventory-delta-minus').click();
    await expect(page.locator('#inventory-adjust-delta')).toHaveValue('1');
    await page.locator('#inventory-adjust-reason').fill('Reposição');
    await page.getByRole('button', { name: 'Ajustar estoque' }).click();
    await expect(
      page.locator('#inventory-list').getByText('Coxinha • 11'),
    ).toBeVisible();
  });

  test('uses one createStudent call when registering a student', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Alunos');
    await expect(
      page.getByRole('heading', { name: 'Alunos', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await page.locator('#student-name').fill('Aluno perf cadastro');
    await page.locator('#student-approx-age').fill('9');
    await page.locator('#student-approx-year').fill('2026');
    await page.getByRole('button', { name: 'Cadastrar aluno' }).click();
    await expect(
      page.locator('#students-list').getByText('Aluno perf cadastro'),
    ).toBeVisible();
    const afterCreate = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterCreate.methods).toEqual(['createStudent']);
    expect(afterCreate.calls).toBe(1);
  });

  test('uses one openCashSession call when opening cash', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Caixa');
    await expect(
      page.getByRole('heading', { name: 'Caixa', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await page.getByRole('button', { name: 'Abrir caixa' }).click();
    await expect(page.getByText(/Aberto •/)).toBeVisible();
    const afterOpen = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterOpen.methods).toEqual(['openCashSession']);
    expect(afterOpen.calls).toBe(1);
  });

  test('loads alunos from the login roster without another server call', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await resetCantinaPerf(page);
    await goToArea(page, 'Alunos');
    await expect(page.getByText('Ana Souza • ~8 • 3º A')).toBeVisible();
    const afterStudents = await snapshotCantinaPerf(page);
    expect(afterStudents.methods).toEqual([]);
    expect(afterStudents.calls).toBe(0);
  });

  test('reuses the sale screen for estoque, agenda, reservas and caixa', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: { reset: () => void };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      perf.reset();
    });
    await goToArea(page, 'Estoque');
    await expect(page.locator('#inventory-adjust-form')).toBeVisible();
    await goToArea(page, 'Agenda');
    await expect(page.locator('#agenda-status')).not.toHaveText(
      'Entre para ver os vencimentos.',
    );
    await goToArea(page, 'Reservas');
    await expect(page.locator('#reservations-status')).not.toHaveText(
      'Entre para ver as reservas.',
    );
    await goToArea(page, 'Caixa');
    await expect(
      page.getByRole('heading', { name: 'Caixa', exact: true }),
    ).toBeVisible();
    const afterTabs = await page.evaluate(() => {
      const perf = (
        window as Window & {
          __cantinaPerf?: {
            snapshot: () => { calls: number; methods: string[] };
          };
        }
      ).__cantinaPerf;
      if (!perf) {
        throw new Error('__cantinaPerf ausente');
      }
      return perf.snapshot();
    });
    expect(afterTabs.methods).toEqual([]);
    expect(afterTabs.calls).toBe(0);
  });

  test('logs in with a single loginE2E call that already fills Vendas', async ({
    page,
  }) => {
    await openLocalApp(page);
    await expect(page.getByText('Ambiente local funcionando')).toBeVisible();
    await resetCantinaPerf(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    const afterLogin = await snapshotCantinaPerf(page);
    expect(afterLogin.methods).toEqual(['loginE2E']);
    expect(afterLogin.calls).toBe(1);
  });

  test('reuses the login roster for responsáveis, pagamentos and crédito', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await resetCantinaPerf(page);
    await goToArea(page, 'Responsáveis');
    await expect(
      page.getByRole('heading', { name: 'Responsáveis', exact: true }),
    ).toBeVisible();
    await expect(page.locator('#family-status')).not.toHaveText(
      'Entre para ver os responsáveis.',
    );
    await goToArea(page, 'Pagamentos');
    await expect(
      page.getByRole('heading', { name: 'Pagamentos', exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Crédito');
    await expect(
      page.getByRole('heading', { name: 'Crédito pessoal' }),
    ).toBeVisible();
    const afterTabs = await snapshotCantinaPerf(page);
    expect(afterTabs.methods).toEqual(['listPayments', 'listCreditAccounts']);
    expect(afterTabs.calls).toBe(2);
  });

  test('keeps Atualizar cheap on pagamentos and crédito', async ({ page }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await expect(
      page.getByRole('heading', { name: 'Vendas', exact: true }),
    ).toBeVisible();
    await goToArea(page, 'Pagamentos');
    await expect(
      page.getByRole('heading', { name: 'Pagamentos', exact: true }),
    ).toBeVisible();
    await resetCantinaPerf(page);
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.locator('#payments-status')).not.toHaveText(
      'Entre para registrar pagamentos.',
    );
    const afterPayments = await snapshotCantinaPerf(page);
    expect(afterPayments.methods).toEqual(['listPayments']);
    await goToArea(page, 'Crédito');
    await expect(
      page.getByRole('heading', { name: 'Crédito pessoal' }),
    ).toBeVisible();
    await resetCantinaPerf(page);
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.locator('#credits-status')).not.toHaveText(
      'Entre para registrar crédito.',
    );
    const afterCredits = await snapshotCantinaPerf(page);
    expect(afterCredits.methods).toEqual(['listCreditAccounts']);
  });

  test('uses one updateStudent call when changing classroom', async ({
    page,
  }) => {
    await openLocalApp(page);
    await page.getByRole('button', { name: 'Entrar como dona' }).click();
    await goToArea(page, 'Alunos');
    await expect(page.getByText('Ana Souza • ~8 • 3º A')).toBeVisible();
    const ana = page
      .locator('#students-list')
      .getByRole('listitem')
      .filter({ hasText: 'Ana Souza • ~8 • 3º A' });
    await ana.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#student-name')).toHaveValue('Ana Souza');
    await resetCantinaPerf(page);
    await page.locator('#student-classroom').selectOption({ label: '2º B' });
    await page.getByRole('button', { name: 'Salvar aluno' }).click();
    await expect(
      page
        .locator('#students-list')
        .getByText('Ana Souza • ~8 • 2º B', { exact: false }),
    ).toBeVisible();
    const afterSave = await snapshotCantinaPerf(page);
    expect(afterSave.methods).toEqual(['updateStudent']);
    expect(afterSave.calls).toBe(1);
  });
});
