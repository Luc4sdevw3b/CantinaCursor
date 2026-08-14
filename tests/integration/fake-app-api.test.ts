import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/app-version';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';

describe('FakeAppApi', () => {
  it('returns a safe local health response', async () => {
    const health = await new FakeAppApi().getHealth();

    expect(health).toEqual({
      appName: APP_NAME,
      version: APP_VERSION,
      environment: 'LOCAL',
      status: 'ready',
      adapter: 'fake',
      spreadsheetConfigured: false,
      schemaVersion: 0,
      backupConfigured: false,
      lastBackupAt: null,
    });
  });

  it('does not share mutable health state between calls', async () => {
    const api = new FakeAppApi();
    const first = await api.getHealth();
    first.environment = 'PROD';

    expect((await api.getHealth()).environment).toBe('LOCAL');
  });

  it('keeps a local E2E-style session without a password', async () => {
    const api = new FakeAppApi();

    expect(await api.getSession()).toBeNull();
    expect(await api.loginE2E('owner')).toEqual({ role: 'owner' });
    expect(await api.getSession()).toEqual({ role: 'owner' });
    expect(await api.loginE2E('staff')).toEqual({ role: 'staff' });
    await api.logout();
    expect(await api.getSession()).toBeNull();
  });

  it('lists homonyms separately and requires review to reactivate', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const students = await api.listStudents();
    const anas = students.filter((student) => student.fullName === 'Ana Souza');

    expect(anas).toHaveLength(2);
    expect(anas.map((student) => student.ageLabel).sort()).toEqual([
      '10',
      '~8',
    ]);
    expect(new Set(anas.map((student) => student.id)).size).toBe(2);

    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    if (!bruno) {
      throw new Error('Bruno Lima não estava no cadastro local');
    }
    await api.deactivateStudent(bruno.id);
    await expect(
      api.reactivateStudent(bruno.id, {
        reviewed: false,
        fullName: 'Bruno Lima',
      }),
    ).rejects.toThrow('REACTIVATION_REVIEW_REQUIRED');
    expect(
      (
        await api.reactivateStudent(bruno.id, {
          reviewed: true,
          fullName: 'Bruno Lima',
        })
      ).active,
    ).toBe(true);

    const updated = await api.updateStudent(bruno.id, {
      fullName: 'Bruno Lima',
      birthDate: '2015-06-01',
    });
    expect(updated.fullName).toBe('Bruno Lima');
    expect(updated.birthDate).toBe('2015-06-01');
  });

  it('links siblings through a shared guardian and refuses non-siblings', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const students = await api.listStudents();
    const anaApprox = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const anaBirth = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '10',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    const guardians = await api.listGuardians();
    const maria = guardians.find((item) => item.fullName === 'Maria Souza');
    const paulo = guardians.find((item) => item.fullName === 'Paulo Nunes');

    if (!anaApprox || !anaBirth || !bruno || !maria || !paulo) {
      throw new Error('cadastro local da família incompleto');
    }

    expect(anaApprox.primaryGuardianName).toBe('Maria Souza');
    expect(anaBirth.primaryGuardianName).toBe('Paulo Nunes');
    expect(bruno.primaryGuardianName).toBe('Maria Souza');
    expect(maria.whatsappEnabled).toBe(true);
    expect(paulo.whatsappEnabled).toBe(false);
    expect(
      (await api.listSiblings(anaApprox.id)).map((item) => item.id),
    ).toEqual([bruno.id]);

    const authorizations = await api.listSiblingAuthorizations(bruno.id);
    expect(
      authorizations.some(
        (item) =>
          item.consumerStudentId === bruno.id &&
          item.accountStudentId === anaApprox.id &&
          item.canChargeAccount &&
          !item.canUseAccountCredit,
      ),
    ).toBe(true);

    await expect(
      api.authorizeSibling({
        consumerStudentId: anaBirth.id,
        accountStudentId: anaApprox.id,
        canChargeAccount: true,
      }),
    ).rejects.toThrow('NOT_SIBLINGS');
  });

  it('lets staff link a guardian and keeps the age setting to the owner', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('staff');
    const created = await api.createGuardian({
      fullName: 'Carla Mendes',
      phone: '11999990003',
      whatsappEnabled: false,
      relationLabel: 'tia',
    });
    expect(created.fullName).toBe('Carla Mendes');
    await api.updateGuardian(created.id, {
      fullName: 'Carla Mendes',
      phone: '11999990003',
      relationLabel: 'madrinha',
      whatsappEnabled: false,
    });
    expect(
      (await api.listGuardians()).find((item) => item.id === created.id)
        ?.relationLabel,
    ).toBe('madrinha');
    await expect(api.setRequireGuardianBelowAge(16)).rejects.toThrow(
      'FORBIDDEN',
    );

    await api.loginE2E('owner');
    expect(await api.setRequireGuardianBelowAge(16)).toEqual({
      requireGuardianBelowAge: 16,
    });
  });

  it('lists demo products, records price history and keeps ad-hoc out of the catalog', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const products = await api.listProducts();
    const coxinha = products.find((item) => item.name === 'Coxinha');
    const suco = products.find((item) => item.name === 'Suco de uva');
    const brigadeiro = products.find((item) => item.name === 'Brigadeiro');

    if (!coxinha || !suco || !brigadeiro) {
      throw new Error('cardápio local incompleto');
    }
    expect(coxinha.categoryName).toBe('Salgados');
    expect(coxinha.priceCents).toBe(550);
    expect(coxinha.priceLabel).toBe('R$ 5,50');
    expect(coxinha.discountAllowed).toBe(true);
    expect(suco.reservable).toBe(true);
    expect(brigadeiro.stockTracked).toBe(false);

    const historyBefore = await api.listProductPriceHistory(coxinha.id);
    expect(
      historyBefore.some((item) => item.priceCents === 550 && !item.endedAt),
    ).toBe(true);
    await api.updateProduct(coxinha.id, {
      name: coxinha.name,
      categoryId: coxinha.categoryId,
      priceCents: 600,
      discountAllowed: coxinha.discountAllowed,
      stockTracked: coxinha.stockTracked,
      reservable: coxinha.reservable,
    });
    const history = await api.listProductPriceHistory(coxinha.id);
    expect(
      history.some((item) => item.priceCents === 550 && item.endedAt),
    ).toBe(true);
    expect(
      history.some((item) => item.priceCents === 550 && !item.endedAt),
    ).toBe(false);
    expect(
      history.some((item) => item.priceCents === 600 && !item.endedAt),
    ).toBe(true);

    await api.loginE2E('staff');
    const categories = await api.listProductCategories();
    const salgados = categories.find((item) => item.name === 'Salgados');
    if (!salgados) {
      throw new Error('categoria Salgados ausente');
    }
    expect(
      (
        await api.createProduct({
          name: 'Pão de queijo',
          categoryId: salgados.id,
          priceCents: 450,
        })
      ).name,
    ).toBe('Pão de queijo');
    await expect(
      api.createAdHocItem({ name: 'Pastel da hora', priceCents: 600 }),
    ).rejects.toThrow('FORBIDDEN');

    await api.loginE2E('owner');
    const adHoc = await api.createAdHocItem({
      name: 'Pastel da hora',
      priceCents: 600,
    });
    expect(adHoc.priceLabel).toBe('R$ 6,00');
    expect((await api.listAdHocItems()).map((item) => item.name)).toContain(
      'Pastel da hora',
    );
    expect(
      (await api.listProducts()).some((item) => item.name === 'Pastel da hora'),
    ).toBe(false);

    const lanches = await api.createCategory('Lanches');
    expect(lanches.name).toBe('Lanches');
    expect((await api.updateCategory(lanches.id, 'Lanche da tarde')).name).toBe(
      'Lanche da tarde',
    );
    expect(
      (await api.listProductCategories()).some(
        (item) => item.name === 'Lanche da tarde',
      ),
    ).toBe(true);
  });

  it('opens demo stock, labels zero as ACABOU and keeps adjustments to the owner', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const balances = await api.listInventoryBalances();
    const coxinha = balances.items.find(
      (item) => item.productName === 'Coxinha',
    );
    const suco = balances.items.find(
      (item) => item.productName === 'Suco de uva',
    );

    if (!coxinha || !suco) {
      throw new Error('estoque local incompleto');
    }
    expect(coxinha.physicalQuantity).toBe(10);
    expect(coxinha.quantityLabel).toBe('10');
    expect(suco.soldOut).toBe(true);
    expect(suco.quantityLabel).toBe('ACABOU');
    expect(
      balances.items.some((item) => item.productName === 'Brigadeiro'),
    ).toBe(false);

    await api.loginE2E('staff');
    expect((await api.listInventoryBalances()).items).toHaveLength(2);
    await expect(
      api.adjustInventory({
        productId: coxinha.productId,
        quantityDelta: -1,
        reason: 'quebra',
      }),
    ).rejects.toThrow('FORBIDDEN');

    await api.loginE2E('owner');
    const adjusted = await api.adjustInventory({
      productId: coxinha.productId,
      quantityDelta: -3,
      reason: 'quebra',
    });
    expect(
      adjusted.items.find((item) => item.productName === 'Coxinha')
        ?.physicalQuantity,
    ).toBe(7);
    expect(
      (await api.listInventoryMovements()).some(
        (item) =>
          item.quantityDelta === -3 &&
          item.reason === 'quebra' &&
          item.kind === 'adjustment',
      ),
    ).toBe(true);
  });

  it('records an anonymous PIX sale, lowers stock and refuses staff discount', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const products = await api.listProducts();
    const coxinha = products.find((item) => item.name === 'Coxinha');
    const suco = products.find((item) => item.name === 'Suco de uva');
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );

    if (!coxinha || !suco || !ana) {
      throw new Error('venda local incompleta');
    }

    expect((await api.getPixCopyText()).text).toBe(
      'Chave PIX de teste: cantina-e2e@example.test',
    );
    const sale = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(sale.summaryLabel).toBe('Anônima • Coxinha • R$ 5,50');
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);

    await expect(
      api.createSale({
        items: [{ productId: suco.id, quantity: 1 }],
        paymentKind: 'pix',
      }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');

    const named = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(named.summaryLabel).toBe('Ana Souza • ~8 • Coxinha • R$ 5,50');

    await api.loginE2E('staff');
    await expect(
      api.createSale({
        items: [
          {
            productId: coxinha.id,
            quantity: 1,
            discountKind: 'amount',
            discountInput: 50,
          },
        ],
        paymentKind: 'pix',
      }),
    ).rejects.toThrow('FORBIDDEN');
  });

  it('records cash with change and mixed PIX plus cash', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    if (!coxinha) {
      throw new Error('venda local incompleta');
    }

    await expect(
      api.createSale({
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'cash',
        cashTenderedCents: 400,
      }),
    ).rejects.toThrow('INSUFFICIENT_CASH');

    await expect(
      api.createSale({
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'cash',
        cashTenderedCents: 1000,
      }),
    ).rejects.toThrow('CASH_SESSION_REQUIRED');

    await api.openCashSession({ openingFloatCents: 0 });

    const cash = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'cash',
      cashTenderedCents: 1000,
    });
    expect(cash.summaryLabel).toBe(
      'Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50',
    );
    expect(cash.changeCents).toBe(450);
    expect(
      cash.settlements.some(
        (item) => item.kind === 'change' && item.amountCents === -450,
      ),
    ).toBe(true);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);

    const mixed = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'mixed',
      pixAmountCents: 300,
      cashTenderedCents: 300,
    });
    expect(mixed.summaryLabel).toBe(
      'Anônima • Coxinha • R$ 5,50 • PIX + dinheiro • Troco R$ 0,50',
    );
    expect(mixed.paymentKind).toBe('mixed');
    const setup = await api.getCashSetup();
    expect(setup.openSession?.expectedCents).toBe(800);
    expect(
      setup.openSession?.movements.map((item) => item.summaryLabel),
    ).toEqual([
      'troco R$ 0,50',
      'entrada R$ 3,00',
      'troco R$ 4,50',
      'entrada R$ 10,00',
    ]);
  });

  it('records student fiado with due date and refuses anonymous fiado', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!coxinha || !ana) {
      throw new Error('venda local incompleta');
    }

    await expect(
      api.createSale({
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'fiado',
        installments: [{ dueDate: '2026-08-14' }],
      }),
    ).rejects.toThrow('FIADO_STUDENT_REQUIRED');

    const sale = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    expect(sale.summaryLabel).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • Sexta-feira • 14/08/26',
    );
    expect(sale.paymentKind).toBe('fiado');
    expect(sale.dueDateLabel).toBe('Sexta-feira • 14/08/26');
    expect((await api.getDueDateShortcuts()).tomorrow).toBe('2026-08-14');
    expect((await api.listReceivables()).upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26',
    );
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);

    const split = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [
        { dueDate: '2026-08-14', amountCents: 300 },
        { dueDate: '2026-08-20', amountCents: 250 },
      ],
    });
    expect(split.summaryLabel).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • 2 vencimentos',
    );
    expect((await api.listReceivables()).upcoming).toHaveLength(3);
  });

  it('pays oldest fiado first and keeps the remaining receivable', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!coxinha || !ana) {
      throw new Error('pagamento local incompleto');
    }

    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-12' }],
    });
    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });

    const payment = await api.createPayment({
      studentId: ana.id,
      amountCents: 550,
      method: 'pix',
      mode: 'oldest_first',
    });
    expect(payment.summaryLabel).toBe('Ana Souza • ~8 • R$ 5,50 • PIX');
    expect((await api.listReceivables()).overdue).toHaveLength(0);
    expect((await api.listReceivables()).upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26',
    );
    expect((await api.listPayments())[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 5,50 • PIX',
    );
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(8);
  });

  it('allocates a manual partial onto the selected due date', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!coxinha || !ana) {
      throw new Error('pagamento local incompleto');
    }

    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-12' }],
    });
    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    const upcoming = (await api.listReceivables()).upcoming[0];
    if (!upcoming) {
      throw new Error('recebível futuro ausente');
    }

    const payment = await api.createPayment({
      studentId: ana.id,
      amountCents: 250,
      method: 'pix',
      mode: 'manual',
      allocations: [{ receivableId: upcoming.id, amountCents: 250 }],
    });
    expect(payment.summaryLabel).toBe('Ana Souza • ~8 • R$ 2,50 • PIX');
    expect((await api.listReceivables()).overdue[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 5,50 • Quarta-feira • 12/08/26',
    );
    expect((await api.listReceivables()).upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 3,00 • Sexta-feira • 14/08/26',
    );
  });

  it('adds owner-only interest and renegotiates the due date', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!coxinha || !ana) {
      throw new Error('juros local incompleto');
    }

    const sale = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    const receivable = (await api.listReceivables()).upcoming[0];
    if (!receivable) {
      throw new Error('recebível futuro ausente');
    }

    await api.logout();
    await api.loginE2E('staff');
    await expect(
      api.addReceivableInterest({
        receivableId: receivable.id,
        kind: 'amount',
        amountCents: 100,
        reason: 'Combinado na cantina',
      }),
    ).rejects.toThrow('FORBIDDEN');

    await api.logout();
    await api.loginE2E('owner');
    await api.addReceivableInterest({
      receivableId: receivable.id,
      kind: 'amount',
      amountCents: 100,
      reason: 'Combinado na cantina',
    });
    expect((await api.listReceivables()).upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 6,50 • Sexta-feira • 14/08/26',
    );

    await api.renegotiateReceivable({
      receivableId: receivable.id,
      dueDate: '2026-08-20',
      reason: 'Pedido da responsável',
    });
    const agenda = await api.listReceivables();
    expect(agenda.upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 6,50 • Quinta-feira • 20/08/26',
    );
    expect(agenda.dueDateHistory[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • Sexta-feira • 14/08/26 → Quinta-feira • 20/08/26 • Pedido da responsável',
    );
    expect(sale.paymentKind).toBe('fiado');
  });

  it('uses personal credit on fiado and pays debt before leftover credit', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!coxinha || !ana) {
      throw new Error('crédito local incompleto');
    }

    const deposited = await api.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    expect(deposited.summaryLabel).toBe('Ana Souza • ~8 • R$ 2,00');
    expect((await api.listCreditAccounts())[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 2,00',
    );

    const sale = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    expect(sale.summaryLabel).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito R$ 2,00 • Sexta-feira • 14/08/26',
    );
    expect((await api.listCreditAccounts())[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 0,00',
    );
    expect((await api.listReceivables()).upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 3,50 • Sexta-feira • 14/08/26',
    );
  });

  it('pays personal debt first when depositing leftover credit', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!coxinha || !ana) {
      throw new Error('crédito local incompleto');
    }

    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    const leftover = await api.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 800,
      method: 'pix',
    });
    expect(leftover.summaryLabel).toBe('Ana Souza • ~8 • R$ 2,50');
    expect((await api.listReceivables()).upcoming).toHaveLength(0);
    expect((await api.listReceivables()).overdue).toHaveLength(0);
  });

  it('lets the owner refund personal credit and blocks staff', async () => {
    const owner = new FakeAppApi();
    await owner.loginE2E('owner');
    const ana = (await owner.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!ana) {
      throw new Error('crédito local incompleto');
    }
    await owner.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    const refunded = await owner.refundPersonalCredit({
      studentId: ana.id,
      amountCents: 200,
      reason: 'Devolução pedida',
    });
    expect(refunded.summaryLabel).toBe('Ana Souza • ~8 • R$ 0,00');

    const staff = new FakeAppApi();
    await staff.loginE2E('staff');
    await expect(
      staff.refundPersonalCredit({
        studentId: ana.id,
        amountCents: 100,
        reason: 'Devolução pedida',
      }),
    ).rejects.toThrow('FORBIDDEN');
  });

  it('uses authorized guardian credit on fiado and keeps the other parent separate', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const students = await api.listStudents();
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    const maria = (await api.listGuardians()).find(
      (item) => item.fullName === 'Maria Souza',
    );
    const paulo = (await api.listGuardians()).find(
      (item) => item.fullName === 'Paulo Nunes',
    );
    if (!coxinha || !ana || !bruno || !maria || !paulo) {
      throw new Error('crédito de responsável local incompleto');
    }

    await api.linkGuardian(ana.id, maria.id, {
      isPrimary: true,
      canUseGuardianCredit: true,
    });
    expect(
      (
        await api.depositGuardianCredit({
          guardianId: maria.id,
          amountCents: 200,
          method: 'pix',
        })
      ).summaryLabel,
    ).toBe('Maria Souza • mãe • R$ 2,00');
    await api.depositGuardianCredit({
      guardianId: paulo.id,
      amountCents: 200,
      method: 'pix',
    });

    const sale = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    expect(sale.summaryLabel).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito resp. R$ 2,00 • Sexta-feira • 14/08/26',
    );
    const labels = (await api.listCreditAccounts()).map(
      (item) => item.summaryLabel,
    );
    expect(labels).toContain('Maria Souza • mãe • R$ 0,00');
    expect(labels).toContain('Paulo Nunes • pai • R$ 2,00');

    await api.createSale({
      consumerStudentId: bruno.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    expect(
      (await api.listCreditAccounts()).map((item) => item.summaryLabel),
    ).toContain('Maria Souza • mãe • R$ 0,00');
    expect(
      (await api.listReceivables()).upcoming.map((item) => item.summaryLabel),
    ).toEqual(
      expect.arrayContaining([
        'Ana Souza • ~8 • R$ 3,50 • Sexta-feira • 14/08/26',
        'Bruno Lima • 11 • R$ 5,50 • Sexta-feira • 14/08/26',
      ]),
    );
  });

  it('auto-settles authorized child debt when depositing guardian credit', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const maria = (await api.listGuardians()).find(
      (item) => item.fullName === 'Maria Souza',
    );
    if (!coxinha || !ana || !maria) {
      throw new Error('crédito de responsável local incompleto');
    }

    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    await api.linkGuardian(ana.id, maria.id, {
      isPrimary: true,
      autoSettle: true,
    });
    expect(
      (
        await api.depositGuardianCredit({
          guardianId: maria.id,
          amountCents: 800,
          method: 'pix',
        })
      ).summaryLabel,
    ).toBe('Maria Souza • mãe • R$ 2,50');
    expect((await api.listReceivables()).upcoming).toHaveLength(0);
  });

  it('records a family payment as debt plus leftover guardian credit', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const students = await api.listStudents();
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    const maria = (await api.listGuardians()).find(
      (item) => item.fullName === 'Maria Souza',
    );
    const paulo = (await api.listGuardians()).find(
      (item) => item.fullName === 'Paulo Nunes',
    );
    if (!coxinha || !ana || !bruno || !maria || !paulo) {
      throw new Error('pagamento familiar local incompleto');
    }

    await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    await api.createSale({
      consumerStudentId: bruno.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    const upcoming = await api.listReceivables();
    const anaDebt = upcoming.upcoming.find((item) =>
      item.summaryLabel.startsWith('Ana Souza • ~8'),
    );
    const brunoDebt = upcoming.upcoming.find((item) =>
      item.summaryLabel.startsWith('Bruno Lima • 11'),
    );
    if (!anaDebt || !brunoDebt) {
      throw new Error('dívidas familiares ausentes');
    }

    await expect(
      api.createFamilyPayment({
        guardianId: paulo.id,
        studentId: ana.id,
        amountCents: 550,
        method: 'pix',
        mode: 'oldest_first',
      }),
    ).rejects.toThrow('PAYMENT_CHILD_NOT_LINKED');
    await expect(
      api.createFamilyPayment({
        guardianId: maria.id,
        studentId: ana.id,
        amountCents: 600,
        method: 'pix',
        mode: 'oldest_first',
      }),
    ).rejects.toThrow('PAYMENT_LEFTOVER_UNEXPLAINED');

    const payment = await api.createFamilyPayment({
      guardianId: maria.id,
      amountCents: 200,
      method: 'pix',
      mode: 'credit_remainder',
      allocations: [
        { receivableId: anaDebt.id, amountCents: 20 },
        { receivableId: brunoDebt.id, amountCents: 15 },
      ],
    });
    expect(payment.summaryLabel).toBe(
      'Maria Souza • mãe • R$ 2,00 • PIX • Ana Souza • ~8 R$ 0,20 • Bruno Lima • 11 R$ 0,15 • crédito R$ 1,65',
    );
    expect((await api.listPayments())[0]?.summaryLabel).toBe(
      payment.summaryLabel,
    );
    expect(
      (await api.listReceivables()).upcoming.map((item) => item.summaryLabel),
    ).toEqual(
      expect.arrayContaining([
        'Ana Souza • ~8 • R$ 5,30 • Sexta-feira • 14/08/26',
        'Bruno Lima • 11 • R$ 5,35 • Sexta-feira • 14/08/26',
      ]),
    );
    expect(
      (await api.listCreditAccounts()).map((item) => item.summaryLabel),
    ).toContain('Maria Souza • mãe • R$ 1,65');
  });

  it('lets staff send a family payment entirely to guardian credit', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('staff');
    const maria = (await api.listGuardians()).find(
      (item) => item.fullName === 'Maria Souza',
    );
    if (!maria) {
      throw new Error('pagamento familiar local incompleto');
    }
    expect(
      (
        await api.createFamilyPayment({
          guardianId: maria.id,
          amountCents: 200,
          method: 'pix',
          mode: 'all_credit',
        })
      ).summaryLabel,
    ).toBe('Maria Souza • mãe • R$ 2,00 • PIX • crédito R$ 2,00');
    expect(
      (await api.listCreditAccounts()).map((item) => item.summaryLabel),
    ).toContain('Maria Souza • mãe • R$ 2,00');
  });

  it('charges a sibling account without using the sibling personal credit', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const students = await api.listStudents();
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    if (!coxinha || !ana || !bruno) {
      throw new Error('conta de irmão local incompleta');
    }

    await api.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    const sale = await api.createSale({
      consumerStudentId: bruno.id,
      chargedStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-08-14' }],
    });
    expect(sale.summaryLabel).toBe(
      'Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • Sexta-feira • 14/08/26',
    );
    expect(
      (await api.listReceivables()).upcoming.map((item) => item.summaryLabel),
    ).toEqual(['Ana Souza • ~8 • R$ 5,50 • Sexta-feira • 14/08/26']);
    expect(
      (await api.listCreditAccounts()).map((item) => item.summaryLabel),
    ).toContain('Ana Souza • ~8 • R$ 2,00');
    await expect(
      api.createSale({
        consumerStudentId: ana.id,
        chargedStudentId: bruno.id,
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'fiado',
        installments: [{ dueDate: '2026-08-14' }],
      }),
    ).rejects.toThrow('SALE_ACCOUNT_UNAUTHORIZED');
  });

  it('uses sibling personal credit only when that permission is on', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const students = await api.listStudents();
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    if (!coxinha || !ana || !bruno) {
      throw new Error('crédito de irmão local incompleto');
    }
    const seeded = (await api.listSiblingAuthorizations()).find(
      (item) =>
        item.consumerStudentId === bruno.id &&
        item.accountStudentId === ana.id &&
        item.active,
    );
    if (!seeded) {
      throw new Error('autorização Bruno→Ana ausente');
    }
    await api.revokeSiblingAuthorization(seeded.id);
    await api.authorizeSibling({
      consumerStudentId: bruno.id,
      accountStudentId: ana.id,
      canChargeAccount: true,
      canUseAccountCredit: true,
    });
    await api.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    expect(
      (
        await api.createSale({
          consumerStudentId: bruno.id,
          chargedStudentId: ana.id,
          items: [{ productId: coxinha.id, quantity: 1 }],
          paymentKind: 'fiado',
          installments: [{ dueDate: '2026-08-14' }],
        })
      ).summaryLabel,
    ).toBe(
      'Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • crédito R$ 2,00 • Sexta-feira • 14/08/26',
    );
    expect((await api.listReceivables()).upcoming[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 3,50 • Sexta-feira • 14/08/26',
    );
    expect(
      (await api.listCreditAccounts()).map((item) => item.summaryLabel),
    ).toContain('Ana Souza • ~8 • R$ 0,00');
  });

  it('records R$ 8,00 cash with R$ 10,00 tendered as +10/-2 and keeps PIX without a drawer', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    const brigadeiro = (await api.listProducts()).find(
      (item) => item.name === 'Brigadeiro',
    );
    if (!coxinha || !brigadeiro) {
      throw new Error('caixa local incompleto');
    }

    const pix = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(pix.summaryLabel).toBe('Anônima • Coxinha • R$ 5,50');
    expect((await api.getCashSetup()).openSession).toBeNull();

    await api.openCashSession({ openingFloatCents: 0 });
    const sale = await api.createSale({
      items: [
        { productId: coxinha.id, quantity: 1 },
        { productId: brigadeiro.id, quantity: 1 },
      ],
      paymentKind: 'cash',
      cashTenderedCents: 1000,
    });
    expect(sale.summaryLabel).toBe(
      'Anônima • Coxinha, Brigadeiro • R$ 8,00 • Dinheiro • Troco R$ 2,00',
    );
    const setup = await api.getCashSetup();
    expect(setup.openSession?.expectedCents).toBe(800);
    expect(
      setup.openSession?.movements.map((item) => item.summaryLabel),
    ).toEqual(['troco R$ 2,00', 'entrada R$ 10,00']);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(8);

    const staff = new FakeAppApi();
    await staff.loginE2E('staff');
    await expect(
      staff.openCashSession({ openingFloatCents: 0 }),
    ).rejects.toThrow('FORBIDDEN');
    await expect(staff.closeCashSession({ countedCents: 800 })).rejects.toThrow(
      'FORBIDDEN',
    );
  });

  it('reverses a PIX Coxinha with stock return back to 10', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    if (!coxinha) {
      throw new Error('coxinha local incompleta');
    }
    const sale = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    const setup = await api.reverseSale({
      saleId: sale.id,
      refundMethod: 'pix',
      confirmDifferentMethod: false,
      returnItemsToStock: true,
      reason: 'Venda lançada em duplicidade',
    });
    expect(
      setup.recentReversals[0]?.effects.map((item) => item.summaryLabel),
    ).toContain('Produto retornado ao estoque: +1');
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(10);
  });

  it('holds reserved stock on a recreio reservation without changing physical quantity', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    if (!slot || !coxinha) {
      throw new Error('reserva local incompleta');
    }
    const created = await api.createReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee23',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(created.reservations[0]?.summaryLabel).toBe(
      'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
    );
    const ana = (await api.listStudents()).find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    if (!ana) {
      throw new Error('Ana Souza ~8 ausente');
    }
    const linked = await api.createReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee24',
      slotId: slot.id,
      studentNameText: ana.fullName,
      classroomText: ana.classroomName || '3º A',
      linkedStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(linked.reservations.some((item) => item.linkedStudentLabel)).toBe(
      true,
    );
    expect(
      created.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(1);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(10);
  });

  it('creates a public reservation without a session', async () => {
    const api = new FakeAppApi();
    const portal = await api.getPublicReservationPortal();
    const slot = portal.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = portal.products.find((item) => item.name === 'Coxinha');
    if (!slot || !coxinha) {
      throw new Error('portal público local incompleto');
    }
    const created = await api.createPublicReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee26',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(created.publicCodeLabel).toMatch(/^Código [A-HJ-NP-Z2-9]{6}$/);
    expect(created.summaryLabel).toContain('Recreio tarde • reservada');
  });

  it('lets the owner update, link and fulfill a recreio reservation without changing physical stock', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (item) => item.fullName === 'Ana Souza' && item.ageLabel === '~8',
    );
    if (!slot || !coxinha || !ana) {
      throw new Error('fila da dona local incompleta');
    }
    const created = await api.createReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee27',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const reservationId = created.reservations[0]?.id ?? '';
    expect(created.production[0]?.summaryLabel).toBe('Coxinha • 1');
    const updated = await api.updateReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee28',
      reservationId,
      studentNameText: 'Ana Souza',
      classroomText: '4º B',
    });
    expect(updated.reservations[0]?.summaryLabel).toContain('4º B');
    const linked = await api.linkReservationStudent({
      reservationId,
      studentId: ana.id,
    });
    expect(linked.reservations[0]?.linkedStudentLabel).toBe(
      'vinculada a Ana Souza • ~8',
    );
    const fulfilled = await api.fulfillReservation({ reservationId });
    expect(fulfilled.reservations[0]?.status).toBe('fulfilled');
    expect(fulfilled.production).toEqual([]);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(10);
  });

  it('converts a recreio reservation into a PIX sale and lowers physical stock once', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (item) => item.fullName === 'Ana Souza' && item.ageLabel === '~8',
    );
    if (!slot || !coxinha || !ana) {
      throw new Error('reserva→venda local incompleta');
    }
    const created = await api.createReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee33',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const reservationId = created.reservations[0]?.id ?? '';
    await api.linkReservationStudent({
      reservationId,
      studentId: ana.id,
    });
    const sale = await api.createSale({
      sourceReservationId: reservationId,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(sale.summaryLabel).toBe('Ana Souza • ~8 • Coxinha • R$ 5,50');
    expect(sale.sourceReservationId).toBe(reservationId);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);
  });
});
