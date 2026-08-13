import { describe, expect, it } from 'vitest';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';

describe('estornos', () => {
  it('keeps the original sale, refunds PIX, and returns stock only when confirmed', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    if (!coxinha) {
      throw new Error('coxinha ausente');
    }
    const sale = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);

    const setup = await api.reverseSale({
      saleId: sale.id,
      refundMethod: 'pix',
      confirmDifferentMethod: false,
      returnItemsToStock: true,
      reason: 'Venda lançada em duplicidade',
    });
    expect(setup.sales.find((item) => item.id === sale.id)?.status).toBe(
      'reversed',
    );
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(10);
    expect(setup.recentReversals[0]?.effects.map((item) => item.type)).toEqual([
      'pix_refund',
      'stock_return',
    ]);
    expect(setup.recentReversals[0]?.effects[1]?.summaryLabel).toBe(
      'Produto retornado ao estoque: +1',
    );
    await expect(
      api.reverseSale({
        saleId: sale.id,
        refundMethod: 'pix',
        confirmDifferentMethod: false,
        returnItemsToStock: false,
        reason: 'Repetição',
      }),
    ).rejects.toThrow('já foi estornada');
  });

  it('requires confirmation for a different refund method and does not change stock', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    await api.openCashSession({ openingFloatCents: 5000 });
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    if (!coxinha) {
      throw new Error('coxinha ausente');
    }
    const sale = await api.createSale({
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    await expect(
      api.reverseSale({
        saleId: sale.id,
        refundMethod: 'cash',
        confirmDifferentMethod: false,
        returnItemsToStock: false,
        reason: 'Cliente desistiu',
      }),
    ).rejects.toThrow('Confirme explicitamente');
    expect((await api.getReversalsSetup()).recentReversals).toEqual([]);

    await api.reverseSale({
      saleId: sale.id,
      refundMethod: 'cash',
      confirmDifferentMethod: true,
      returnItemsToStock: false,
      reason: 'Cliente desistiu',
    });
    expect((await api.getCashSetup()).openSession?.expectedCents).toBe(4450);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);
  });

  it('reverses the payment first, reopens the debt, then allows reversing the fiado sale', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    await api.openCashSession({ openingFloatCents: 5000 });
    const students = await api.listStudents();
    const ana = students.find((item) => item.fullName === 'Ana Souza');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    if (!ana || !coxinha) {
      throw new Error('seed incompleto');
    }
    const shortcuts = await api.getDueDateShortcuts();
    const sale = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    const payment = await api.createPayment({
      studentId: ana.id,
      amountCents: 550,
      method: 'cash',
      mode: 'oldest_first',
    });
    await expect(
      api.reverseSale({
        saleId: sale.id,
        refundMethod: null,
        confirmDifferentMethod: false,
        returnItemsToStock: false,
        reason: 'Venda incorreta',
      }),
    ).rejects.toThrow('Estorne primeiro os pagamentos');

    await api.reversePayment({
      paymentId: payment.id,
      refundMethod: 'pix',
      confirmDifferentMethod: true,
      reason: 'Pagamento vinculado à venda incorreta',
    });
    expect((await api.listReceivables()).upcoming[0]?.remainingCents).toBe(550);
    expect((await api.getCashSetup()).openSession?.expectedCents).toBe(5550);

    await api.reverseSale({
      saleId: sale.id,
      refundMethod: null,
      confirmDifferentMethod: false,
      returnItemsToStock: false,
      reason: 'Venda incorreta',
    });
    expect((await api.listReceivables()).upcoming).toEqual([]);
  });

  it('blocks reversing a deposit while that credit was consumed', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const students = await api.listStudents();
    const ana = students.find((item) => item.fullName === 'Ana Souza');
    const coxinha = (await api.listProducts()).find(
      (item) => item.name === 'Coxinha',
    );
    if (!ana || !coxinha) {
      throw new Error('seed incompleto');
    }
    const deposit = await api.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 550,
      method: 'pix',
    });
    const payment = (await api.listPayments())[0];
    if (!payment) {
      throw new Error('pagamento de depósito ausente');
    }
    const shortcuts = await api.getDueDateShortcuts();
    const creditSale = await api.createSale({
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(deposit.balanceCents).toBe(550);
    expect(creditSale.summaryLabel).toContain('crédito');
    await expect(
      api.reversePayment({
        paymentId: payment.id,
        refundMethod: 'pix',
        confirmDifferentMethod: false,
        reason: 'Depósito incorreto',
      }),
    ).rejects.toThrow('já foi usado');

    await api.reverseSale({
      saleId: creditSale.id,
      refundMethod: null,
      confirmDifferentMethod: false,
      returnItemsToStock: false,
      reason: 'Venda incorreta',
    });
    await api.reversePayment({
      paymentId: payment.id,
      refundMethod: 'pix',
      confirmDifferentMethod: false,
      reason: 'Depósito incorreto',
    });
    expect(
      (await api.listCreditAccounts()).find((item) => item.studentId === ana.id)
        ?.balanceCents,
    ).toBe(0);
  });

  it('restores credit when reversing a refund and forbids staff', async () => {
    const owner = new FakeAppApi();
    await owner.loginE2E('owner');
    const students = await owner.listStudents();
    const ana = students.find((item) => item.fullName === 'Ana Souza');
    if (!ana) {
      throw new Error('ana ausente');
    }
    await owner.depositPersonalCredit({
      studentId: ana.id,
      amountCents: 1000,
      method: 'pix',
    });
    await owner.refundPersonalCredit({
      studentId: ana.id,
      amountCents: 300,
      reason: 'Solicitação original',
    });
    const refund = (await owner.getReversalsSetup()).creditRefunds[0];
    if (!refund) {
      throw new Error('devolução ausente');
    }
    const staff = new FakeAppApi();
    await staff.loginE2E('staff');
    await expect(
      staff.reverseCreditRefund({
        creditMovementId: refund.id,
        recoveryMethod: 'pix',
        confirmDifferentMethod: false,
        reason: 'Devolução cancelada',
      }),
    ).rejects.toThrow('FORBIDDEN');

    await owner.openCashSession({ openingFloatCents: 5000 });
    const setup = await owner.reverseCreditRefund({
      creditMovementId: refund.id,
      recoveryMethod: 'cash',
      confirmDifferentMethod: true,
      reason: 'Devolução cancelada',
    });
    expect(
      (await owner.listCreditAccounts()).find(
        (item) => item.studentId === ana.id,
      )?.balanceCents,
    ).toBe(1000);
    expect((await owner.getCashSetup()).openSession?.expectedCents).toBe(5300);
    expect(setup.creditRefunds[0]?.reversed).toBe(true);
    expect(setup.recentReversals[0]?.effects.map((item) => item.type)).toEqual([
      'credit_restore',
      'cash_recovery',
    ]);
  });
});
