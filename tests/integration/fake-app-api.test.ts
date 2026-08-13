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
  });
});
