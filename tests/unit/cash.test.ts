import { describe, expect, it } from 'vitest';
import {
  CASH_KIND_ADDED,
  CASH_KIND_CHANGE,
  CASH_KIND_RECEIVED,
  CASH_KIND_REMOVED,
  cashMovementSummary,
  expectedCashCents,
  validateCashClose,
  validateCashMovement,
  validateCashOpen,
} from '../../src/domain/cash';
import { MemoryCash } from '../../src/server/cash/memory-cash';

describe('cash domain', () => {
  it('keeps opening float out of revenue and sums physical movements', () => {
    expect(expectedCashCents(2000, [1000, -200])).toBe(2800);
    expect(cashMovementSummary(CASH_KIND_RECEIVED, 1000)).toBe(
      'entrada R$ 10,00',
    );
    expect(cashMovementSummary(CASH_KIND_CHANGE, -200)).toBe('troco R$ 2,00');
  });

  it('refuses cash movement without today session and stale drawer', () => {
    expect(
      validateCashMovement({
        todayCivil: '2026-08-13',
        openSession: null,
        amountDeltaCents: 1000,
      }).ok,
    ).toBe(false);
    const stale = validateCashMovement({
      todayCivil: '2026-08-13',
      openSession: { businessDate: '2026-08-12', expectedCents: 500 },
      amountDeltaCents: 1000,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.error.code).toBe('STALE_CASH_SESSION');
      expect(stale.error.message).toContain('2026-08-12');
    }
  });

  it('requires a close note only when counted differs from expected', () => {
    expect(
      validateCashClose({
        openSession: { expectedCents: 1200 },
        countedCents: 1200,
        note: '',
      }).ok,
    ).toBe(true);
    const missing = validateCashClose({
      openSession: { expectedCents: 1200 },
      countedCents: 1100,
      note: '',
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe('CASH_CLOSE_NOTE_REQUIRED');
    }
  });

  it('blocks a second open while another drawer is open', () => {
    const today = validateCashOpen({
      todayCivil: '2026-08-13',
      openingFloatCents: 0,
      openSession: { businessDate: '2026-08-13' },
      todaySession: { status: 'open' },
    });
    expect(today.ok).toBe(false);
    const stale = validateCashOpen({
      todayCivil: '2026-08-13',
      openingFloatCents: 0,
      openSession: { businessDate: '2026-08-12' },
      todaySession: null,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.error.message).toContain('2026-08-12');
    }
  });
});

describe('MemoryCash', () => {
  it('records R$ 8,00 sold as +R$ 10,00 in and R$ 2,00 change out', () => {
    const cash = new MemoryCash(() => '2026-08-13T16:00:00.000Z');
    expect(cash.open({ openingFloatCents: 2000 }).ok).toBe(true);
    expect(
      cash.recordSaleCash({
        saleId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',
        tenderedCents: 1000,
        changeCents: 200,
      }).ok,
    ).toBe(true);
    const setup = cash.getSetup();
    expect(setup.ok).toBe(true);
    if (!setup.ok || !setup.data.openSession) {
      throw new Error('caixa aberto ausente');
    }
    expect(setup.data.openSession.expectedCents).toBe(2800);
    expect(
      setup.data.openSession.movements.map((item) => item.summaryLabel),
    ).toEqual(['troco R$ 2,00', 'entrada R$ 10,00']);
    expect(setup.data.openSession.movements.map((item) => item.kind)).toEqual([
      CASH_KIND_CHANGE,
      CASH_KIND_RECEIVED,
    ]);
  });

  it('distinguishes added float from withdrawal and refuses overdraft', () => {
    const cash = new MemoryCash(() => '2026-08-13T16:00:00.000Z');
    cash.open({ openingFloatCents: 1000 });
    expect(
      cash.addForChange({ amountCents: 500, note: 'Troco trazido pela dona' })
        .ok,
    ).toBe(true);
    const removed = cash.remove({
      amountCents: 300,
      note: 'Recolhimento parcial',
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok || !removed.data.openSession) {
      throw new Error('caixa aberto ausente');
    }
    expect(removed.data.openSession.expectedCents).toBe(1200);
    expect(removed.data.openSession.movements.map((item) => item.kind)).toEqual(
      [CASH_KIND_REMOVED, CASH_KIND_ADDED],
    );
    const overdraft = cash.remove({
      amountCents: 1201,
      note: 'Excesso',
    });
    expect(overdraft.ok).toBe(false);
    if (!overdraft.ok) {
      expect(overdraft.error.code).toBe('CASH_INSUFFICIENT_FLOAT');
    }
  });

  it('closes with expected, counted and difference and refuses reopen', () => {
    const cash = new MemoryCash(() => '2026-08-13T16:00:00.000Z');
    cash.open({ openingFloatCents: 1000 });
    cash.addForChange({ amountCents: 200, note: 'Complemento' });
    expect(cash.close({ countedCents: 1100, note: null }).ok).toBe(false);
    const closed = cash.close({
      countedCents: 1100,
      note: 'Faltaram moedas',
    });
    expect(closed.ok).toBe(true);
    if (!closed.ok) {
      throw new Error('fechamento ausente');
    }
    expect(closed.data.openSession).toBeNull();
    expect(closed.data.recentSessions[0]).toMatchObject({
      status: 'closed',
      expectedCents: 1200,
      countedCents: 1100,
      differenceCents: -100,
      closeNote: 'Faltaram moedas',
    });
    const reopen = cash.open({ openingFloatCents: 0 });
    expect(reopen.ok).toBe(false);
    if (!reopen.ok) {
      expect(reopen.error.code).toBe('CASH_ALREADY_CLOSED');
    }
  });

  it('blocks new cash on a stale open session', () => {
    let now = '2026-08-12T16:00:00.000Z';
    const cash = new MemoryCash(() => now);
    cash.open({ openingFloatCents: 500 });
    now = '2026-08-13T16:00:00.000Z';
    const blocked = cash.assertCanMove(800);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe('STALE_CASH_SESSION');
    }
    const openToday = cash.open({ openingFloatCents: 0 });
    expect(openToday.ok).toBe(false);
    const closed = cash.close({ countedCents: 500 });
    expect(closed.ok).toBe(true);
    expect(cash.open({ openingFloatCents: 0 }).ok).toBe(true);
    const setup = cash.getSetup();
    expect(setup.ok).toBe(true);
    if (setup.ok) {
      expect(setup.data.openSession?.businessDate).toBe('2026-08-13');
    }
  });
});
