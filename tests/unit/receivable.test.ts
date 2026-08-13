import { describe, expect, it } from 'vitest';
import {
  addCivilDays,
  agendaBucket,
  dueDateShortcuts,
  formatCivilDisplay,
  nextFriday,
  todayCivilSaoPaulo,
} from '../../src/domain/civil-date';
import {
  agendaBucketLabel,
  dueDateHistoryLabel,
  planDueDateChange,
  planFiadoInstallments,
  planInterestCharge,
} from '../../src/domain/receivable';

describe('civil date display and shortcuts', () => {
  it('formats Thursday 13/08/26 and jumps to next Friday', () => {
    expect(formatCivilDisplay('2026-08-13')).toBe('Quinta-feira • 13/08/26');
    expect(addCivilDays('2026-08-13', 1)).toBe('2026-08-14');
    expect(nextFriday('2026-08-13')).toBe('2026-08-14');
    expect(nextFriday('2026-08-14')).toBe('2026-08-21');
    expect(dueDateShortcuts('2026-08-13')).toEqual({
      today: '2026-08-13',
      tomorrow: '2026-08-14',
      nextFriday: '2026-08-14',
      plus7: '2026-08-20',
    });
    expect(agendaBucket('2026-08-12', '2026-08-13')).toBe('overdue');
    expect(agendaBucket('2026-08-13', '2026-08-13')).toBe('today');
    expect(agendaBucket('2026-08-14', '2026-08-13')).toBe('upcoming');
    expect(agendaBucketLabel('overdue')).toBe('Atrasado');
    expect(todayCivilSaoPaulo('2026-08-13T16:00:00.000Z')).toBe('2026-08-13');
  });
});

describe('fiado installments', () => {
  it('uses the full net when a single due date has no amount', () => {
    const planned = planFiadoInstallments({
      netTotalCents: 550,
      installments: [{ dueDate: '2026-08-14' }],
    });
    expect(planned).toEqual({
      ok: true,
      data: [{ due_date: '2026-08-14', amount_cents: '550' }],
    });
  });

  it('requires installments to sum to the fiado total', () => {
    expect(
      planFiadoInstallments({
        netTotalCents: 550,
        installments: [],
      }).ok,
    ).toBe(false);
    expect(
      planFiadoInstallments({
        netTotalCents: 550,
        installments: [
          { dueDate: '2026-08-14', amountCents: 300 },
          { dueDate: '2026-08-21', amountCents: 250 },
        ],
      }).ok,
    ).toBe(true);
    expect(
      planFiadoInstallments({
        netTotalCents: 550,
        installments: [
          { dueDate: '2026-08-14', amountCents: 300 },
          { dueDate: '2026-08-21', amountCents: 200 },
        ],
      }).ok,
    ).toBe(false);
  });
});

describe('interest and renegotiation', () => {
  it('adds a fixed charge and a percent of the remaining balance', () => {
    expect(
      planInterestCharge({
        remainingCents: 550,
        kind: 'amount',
        amountCents: 100,
        reason: 'Combinado na cantina',
      }),
    ).toEqual({
      ok: true,
      data: {
        kind: 'interest',
        amount_cents: '100',
        reason_code: 'amount',
        note: 'Combinado na cantina',
      },
    });
    expect(
      planInterestCharge({
        remainingCents: 550,
        kind: 'percent',
        percent: 10,
        reason: 'Atraso combinado',
      }),
    ).toEqual({
      ok: true,
      data: {
        kind: 'interest',
        amount_cents: '55',
        reason_code: 'percent',
        note: 'Atraso combinado',
      },
    });
  });

  it('refuses interest without reason, on a settled debt, or with a bad amount', () => {
    expect(
      planInterestCharge({
        remainingCents: 550,
        kind: 'amount',
        amountCents: 100,
        reason: ' ',
      }).ok,
    ).toBe(false);
    expect(
      planInterestCharge({
        remainingCents: 0,
        kind: 'amount',
        amountCents: 100,
        reason: 'Combinado na cantina',
      }).ok,
    ).toBe(false);
    expect(
      planInterestCharge({
        remainingCents: 550,
        kind: 'percent',
        percent: 0,
        reason: 'Combinado na cantina',
      }).ok,
    ).toBe(false);
  });

  it('records a due date change with reason and refuses the same date', () => {
    expect(
      planDueDateChange({
        oldDueDate: '2026-08-14',
        newDueDate: '2026-08-20',
        reason: 'Pedido da responsável',
      }),
    ).toEqual({
      ok: true,
      data: {
        old_due_date: '2026-08-14',
        new_due_date: '2026-08-20',
        reason: 'Pedido da responsável',
      },
    });
    expect(
      planDueDateChange({
        oldDueDate: '2026-08-14',
        newDueDate: '2026-08-14',
        reason: 'Pedido da responsável',
      }).ok,
    ).toBe(false);
    expect(
      dueDateHistoryLabel({
        studentLabel: 'Ana Souza • ~8',
        oldDueDateLabel: 'Sexta-feira • 14/08/26',
        newDueDateLabel: 'Quinta-feira • 20/08/26',
        reason: 'Pedido da responsável',
      }),
    ).toBe(
      'Ana Souza • ~8 • Sexta-feira • 14/08/26 → Quinta-feira • 20/08/26 • Pedido da responsável',
    );
  });
});
