import { describe, expect, it } from 'vitest';
import {
  PAYMENT_MODE_ALL_CREDIT,
  PAYMENT_MODE_CREDIT_REMAINDER,
  PAYMENT_MODE_MANUAL,
  PAYMENT_MODE_OLDEST_FIRST,
  PAYMENT_MODE_SELECTED,
  familyPaymentSummaryLabel,
  paymentSummaryLabel,
  planFamilyPayment,
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

const BRUNO = {
  id: 'rec-bruno',
  charged_student_id: 'stu-bruno',
  due_date: '2026-08-14',
  created_at: '2026-08-13T16:00:02.000Z',
  remaining_cents: 550,
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

describe('family payment allocations', () => {
  it('splits debt plus leftover credit like 200 = 20 + 15 + 165', () => {
    const planned = planFamilyPayment({
      amountCents: 200,
      mode: PAYMENT_MODE_CREDIT_REMAINDER,
      receivables: [OLDER, BRUNO],
      allocations: [
        { receivableId: 'rec-old', amountCents: 20 },
        { receivableId: 'rec-bruno', amountCents: 15 },
      ],
    });
    expect(planned).toEqual({
      ok: true,
      data: {
        allocations: [
          {
            receivable_id: 'rec-old',
            student_id: 'stu-ana',
            amount_cents: '20',
          },
          {
            receivable_id: 'rec-bruno',
            student_id: 'stu-bruno',
            amount_cents: '15',
          },
        ],
        creditCents: 165,
      },
    });
    expect(
      familyPaymentSummaryLabel({
        guardianLabel: 'Maria Souza • mãe',
        amountLabel: 'R$ 2,00',
        method: 'pix',
        childLines: [
          { studentLabel: 'Ana Souza • ~8', amountLabel: 'R$ 0,20' },
          { studentLabel: 'Bruno Lima • 11', amountLabel: 'R$ 0,15' },
        ],
        creditLabel: 'R$ 1,65',
      }),
    ).toBe(
      'Maria Souza • mãe • R$ 2,00 • PIX • Ana Souza • ~8 R$ 0,20 • Bruno Lima • 11 R$ 0,15 • crédito R$ 1,65',
    );
  });

  it('sends the whole amount to guardian credit', () => {
    const planned = planFamilyPayment({
      amountCents: 200,
      mode: PAYMENT_MODE_ALL_CREDIT,
      receivables: [OLDER, BRUNO],
    });
    expect(planned).toEqual({
      ok: true,
      data: { allocations: [], creditCents: 200 },
    });
  });

  it('requires a child when quitting one', () => {
    expect(
      planFamilyPayment({
        amountCents: 300,
        mode: PAYMENT_MODE_OLDEST_FIRST,
        receivables: [OLDER, BRUNO],
      }).ok,
    ).toBe(false);
    const planned = planFamilyPayment({
      amountCents: 300,
      mode: PAYMENT_MODE_OLDEST_FIRST,
      receivables: [OLDER, BRUNO],
      studentId: 'stu-ana',
    });
    expect(planned).toEqual({
      ok: true,
      data: {
        allocations: [
          {
            receivable_id: 'rec-old',
            student_id: 'stu-ana',
            amount_cents: '300',
          },
        ],
        creditCents: 0,
      },
    });
  });

  it('refuses leftover unless the credit remainder mode is used', () => {
    const leftover = planFamilyPayment({
      amountCents: 400,
      mode: PAYMENT_MODE_OLDEST_FIRST,
      receivables: [OLDER],
      studentId: 'stu-ana',
    });
    expect(leftover.ok).toBe(false);
    if (!leftover.ok) {
      expect(leftover.error.code).toBe('PAYMENT_LEFTOVER_UNEXPLAINED');
    }
  });
});
