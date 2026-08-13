import { parseCents } from './money';
import {
  sortOldestFirst,
  type AllocatableReceivable,
  type PlannedPaymentAllocation,
} from './payment';
import { err, ok, type Result } from './result';

export const CREDIT_OWNER_STUDENT = 'student';
export const CREDIT_OWNER_GUARDIAN = 'guardian';
export const CREDIT_KIND_DEPOSIT = 'deposit';
export const CREDIT_KIND_SALE = 'sale';
export const CREDIT_KIND_REFUND = 'refund';
export const CREDIT_KIND_REVERSAL = 'reversal';
export const CREDIT_SOURCE_PAYMENT = 'payment';
export const CREDIT_SOURCE_SALE = 'sale';
export const CREDIT_SOURCE_REFUND = 'refund';
export const CREDIT_SOURCE_OPERATION_REVERSAL = 'operation_reversal';

export const CREDIT_STUDENT_REQUIRED_ERROR = {
  code: 'CREDIT_STUDENT_REQUIRED',
  message: 'Escolha o aluno do crédito.',
  retryable: false,
} as const;

export const CREDIT_GUARDIAN_REQUIRED_ERROR = {
  code: 'CREDIT_GUARDIAN_REQUIRED',
  message: 'Escolha o responsável do crédito.',
  retryable: false,
} as const;

export const CREDIT_INSUFFICIENT_ERROR = {
  code: 'CREDIT_INSUFFICIENT',
  message: 'Não há crédito suficiente para devolver.',
  retryable: false,
} as const;

export const CREDIT_REASON_REQUIRED_ERROR = {
  code: 'CREDIT_REASON_REQUIRED',
  message: 'Informe o motivo da devolução.',
  retryable: false,
} as const;

export interface PlannedCreditDeposit {
  allocations: PlannedPaymentAllocation[];
  creditCents: number;
}

export interface PlannedCreditRefund {
  amount_cents: string;
  note: string;
}

export function applyPersonalCreditToFiado(input: {
  netTotalCents: number;
  creditBalanceCents: number;
}): { creditUsedCents: number; fiadoCents: number } {
  const balance = Number.isInteger(input.creditBalanceCents)
    ? Math.max(0, input.creditBalanceCents)
    : 0;
  const used = Math.min(balance, input.netTotalCents);
  return {
    creditUsedCents: used,
    fiadoCents: input.netTotalCents - used,
  };
}

export function applyCreditLayersToFiado(input: {
  netTotalCents: number;
  personalCreditCents: number;
  guardianCreditCents: number;
}): {
  personalUsedCents: number;
  guardianUsedCents: number;
  fiadoCents: number;
} {
  const personal = applyPersonalCreditToFiado({
    netTotalCents: input.netTotalCents,
    creditBalanceCents: input.personalCreditCents,
  });
  const guardian = applyPersonalCreditToFiado({
    netTotalCents: personal.fiadoCents,
    creditBalanceCents: input.guardianCreditCents,
  });
  return {
    personalUsedCents: personal.creditUsedCents,
    guardianUsedCents: guardian.creditUsedCents,
    fiadoCents: guardian.fiadoCents,
  };
}

export function planCreditDeposit(input: {
  amountCents: unknown;
  receivables: readonly AllocatableReceivable[];
}): Result<PlannedCreditDeposit> {
  const amount = parseCents(input.amountCents);
  if (!amount.ok || amount.data <= 0) {
    return err({
      code: 'INVALID_CENTS',
      message:
        'O valor do crédito precisa ser um valor em centavos, número inteiro.',
      retryable: false,
    });
  }
  const open = sortOldestFirst(
    input.receivables.filter((item) => item.remaining_cents > 0),
  );
  let leftover = amount.data;
  const allocations: PlannedPaymentAllocation[] = [];
  for (const item of open) {
    if (leftover <= 0) {
      break;
    }
    const applied = Math.min(item.remaining_cents, leftover);
    allocations.push({
      receivable_id: item.id,
      student_id: item.charged_student_id,
      amount_cents: String(applied),
    });
    leftover -= applied;
  }
  return ok({ allocations, creditCents: leftover });
}

function parseRequiredReason(
  value: unknown,
  error: { code: string; message: string; retryable: boolean },
): Result<string> {
  if (typeof value !== 'string') {
    return err(error);
  }
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2) {
    return err(error);
  }
  return ok(trimmed);
}

export function planCreditRefund(input: {
  amountCents: unknown;
  balanceCents: number;
  reason: unknown;
}): Result<PlannedCreditRefund> {
  const amount = parseCents(input.amountCents);
  if (!amount.ok || amount.data <= 0) {
    return err({
      code: 'INVALID_CENTS',
      message:
        'O valor do crédito precisa ser um valor em centavos, número inteiro.',
      retryable: false,
    });
  }
  const balance = Number.isInteger(input.balanceCents) ? input.balanceCents : 0;
  if (amount.data > balance) {
    return err(CREDIT_INSUFFICIENT_ERROR);
  }
  const reason = parseRequiredReason(
    input.reason,
    CREDIT_REASON_REQUIRED_ERROR,
  );
  if (!reason.ok) {
    return err(reason.error);
  }
  return ok({
    amount_cents: String(amount.data),
    note: reason.data,
  });
}

export function creditSummaryLabel(input: {
  studentLabel: string;
  balanceLabel: string;
}): string {
  return `${input.studentLabel} • ${input.balanceLabel}`;
}
