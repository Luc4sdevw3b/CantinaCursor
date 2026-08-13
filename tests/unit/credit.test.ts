import { describe, expect, it } from 'vitest';
import {
  applyPersonalCreditToFiado,
  CREDIT_INSUFFICIENT_ERROR,
  CREDIT_REASON_REQUIRED_ERROR,
  creditSummaryLabel,
  planCreditDeposit,
  planCreditRefund,
} from '../../src/domain/credit';

describe('personal credit', () => {
  it('consumes personal credit first and leaves the fiado remainder', () => {
    expect(
      applyPersonalCreditToFiado({
        netTotalCents: 550,
        creditBalanceCents: 200,
      }),
    ).toEqual({ creditUsedCents: 200, fiadoCents: 350 });
    expect(
      applyPersonalCreditToFiado({
        netTotalCents: 550,
        creditBalanceCents: 550,
      }),
    ).toEqual({ creditUsedCents: 550, fiadoCents: 0 });
    expect(
      applyPersonalCreditToFiado({
        netTotalCents: 550,
        creditBalanceCents: 0,
      }),
    ).toEqual({ creditUsedCents: 0, fiadoCents: 550 });
  });

  it('pays personal debt oldest-first and keeps leftover as credit', () => {
    const planned = planCreditDeposit({
      amountCents: 800,
      receivables: [
        {
          id: 'old',
          charged_student_id: 'ana',
          due_date: '2026-08-12',
          created_at: '2026-08-12T16:00:00.000Z',
          remaining_cents: 550,
        },
        {
          id: 'next',
          charged_student_id: 'ana',
          due_date: '2026-08-14',
          created_at: '2026-08-13T16:00:00.000Z',
          remaining_cents: 0,
        },
      ],
    });
    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.data.creditCents).toBe(250);
      expect(planned.data.allocations).toEqual([
        { receivable_id: 'old', student_id: 'ana', amount_cents: '550' },
      ]);
    }
  });

  it('keeps the whole deposit as credit when there is no open debt', () => {
    const planned = planCreditDeposit({
      amountCents: 200,
      receivables: [],
    });
    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.data).toEqual({ allocations: [], creditCents: 200 });
    }
  });

  it('refuses a refund above the personal credit balance', () => {
    const planned = planCreditRefund({
      amountCents: 200,
      balanceCents: 100,
      reason: 'Devolução pedida',
    });
    expect(planned.ok).toBe(false);
    if (!planned.ok) {
      expect(planned.error).toEqual(CREDIT_INSUFFICIENT_ERROR);
    }
  });

  it('requires a refund reason and formats the credit list label', () => {
    const missing = planCreditRefund({
      amountCents: 200,
      balanceCents: 200,
      reason: ' ',
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error).toEqual(CREDIT_REASON_REQUIRED_ERROR);
    }
    expect(
      creditSummaryLabel({
        studentLabel: 'Ana Souza • ~8',
        balanceLabel: 'R$ 2,00',
      }),
    ).toBe('Ana Souza • ~8 • R$ 2,00');
  });
});
