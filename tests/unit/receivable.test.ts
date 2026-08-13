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
  planFiadoInstallments,
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
