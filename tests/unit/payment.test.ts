import { describe, expect, it } from 'vitest';
import {
  PAYMENT_MODE_MANUAL,
  PAYMENT_MODE_OLDEST_FIRST,
  PAYMENT_MODE_SELECTED,
  paymentSummaryLabel,
  planPaymentAllocations,
} from '../../src/domain/payment';

const OLDER = {
  id: 'rec-old',
  charged_student_id: 'stu-ana',
  due_date: '2026-08-12',
  created_at: '2026-08-13T16:00:00.000Z',
  remaining_cents: 300,
};

const NEWER = {
  id: 'rec-new',
  charged_student_id: 'stu-ana',
  due_date: '2026-08-14',
  created_at: '2026-08-13T16:00:01.000Z',
  remaining_cents: 250,
};

describe('partial payment allocations', () => {
  it('pays the oldest receivable first', () => {
    const planned = planPaymentAllocations({
      amountCents: 300,
      mode: PAYMENT_MODE_OLDEST_FIRST,
      receivables: [NEWER, OLDER],
    });
    expect(planned).toEqual({
      ok: true,
      data: [
        {
          receivable_id: 'rec-old',
          student_id: 'stu-ana',
          amount_cents: '300',
        },
      ],
    });
  });

  it('spills the remainder onto the next due date', () => {
    const planned = planPaymentAllocations({
      amountCents: 400,
      mode: PAYMENT_MODE_OLDEST_FIRST,
      receivables: [NEWER, OLDER],
    });
    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.data).toEqual([
        {
          receivable_id: 'rec-old',
          student_id: 'stu-ana',
          amount_cents: '300',
        },
        {
          receivable_id: 'rec-new',
          student_id: 'stu-ana',
          amount_cents: '100',
        },
      ]);
    }
  });

  it('refuses an amount bigger than the open balance', () => {
    expect(
      planPaymentAllocations({
        amountCents: 600,
        mode: PAYMENT_MODE_OLDEST_FIRST,
        receivables: [OLDER, NEWER],
      }).ok,
    ).toBe(false);
  });

  it('allocates only among selected receivables', () => {
    const planned = planPaymentAllocations({
      amountCents: 250,
      mode: PAYMENT_MODE_SELECTED,
      receivables: [OLDER, NEWER],
      selectedReceivableIds: ['rec-new'],
    });
    expect(planned).toEqual({
      ok: true,
      data: [
        {
          receivable_id: 'rec-new',
          student_id: 'stu-ana',
          amount_cents: '250',
        },
      ],
    });
  });

  it('requires manual lines to sum to the received amount', () => {
    expect(
      planPaymentAllocations({
        amountCents: 250,
        mode: PAYMENT_MODE_MANUAL,
        receivables: [OLDER, NEWER],
        allocations: [{ receivableId: 'rec-new', amountCents: 200 }],
      }).ok,
    ).toBe(false);
    const planned = planPaymentAllocations({
      amountCents: 250,
      mode: PAYMENT_MODE_MANUAL,
      receivables: [OLDER, NEWER],
      allocations: [{ receivableId: 'rec-new', amountCents: 250 }],
    });
    expect(planned.ok).toBe(true);
    expect(
      paymentSummaryLabel({
        studentLabel: 'Ana Souza • ~8',
        amountLabel: 'R$ 2,50',
        method: 'pix',
      }),
    ).toBe('Ana Souza • ~8 • R$ 2,50 • PIX');
  });
});
