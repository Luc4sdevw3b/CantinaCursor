import { formatCivilDisplay, parseCivilDate } from './civil-date';
import { parseCents, percentAmount } from './money';
import { err, ok, type Result } from './result';

export const RECEIVABLE_STATUS_OPEN = 'open';
export const RECEIVABLE_STATUS_REVERSED = 'reversed';
export const RECEIVABLE_CHARGE_PRINCIPAL = 'principal';
export const RECEIVABLE_REASON_SALE = 'sale';

export const FIADO_STUDENT_REQUIRED_ERROR = {
  code: 'FIADO_STUDENT_REQUIRED',
  message: 'Fiado precisa de um aluno na conta.',
  retryable: false,
} as const;

export const FIADO_INSTALLMENTS_REQUIRED_ERROR = {
  code: 'FIADO_INSTALLMENTS_REQUIRED',
  message: 'Informe o vencimento do fiado.',
  retryable: false,
} as const;

export const FIADO_AMOUNT_MISMATCH_ERROR = {
  code: 'FIADO_AMOUNT_MISMATCH',
  message: 'A soma dos vencimentos precisa ser igual ao fiado.',
  retryable: false,
} as const;

export interface FiadoInstallmentInput {
  dueDate?: unknown;
  amountCents?: unknown;
}

export interface PlannedFiadoInstallment {
  due_date: string;
  amount_cents: string;
}

export function planFiadoInstallments(input: {
  netTotalCents: number;
  installments: readonly FiadoInstallmentInput[];
}): Result<PlannedFiadoInstallment[]> {
  if (!input.installments.length) {
    return err(FIADO_INSTALLMENTS_REQUIRED_ERROR);
  }
  const planned: PlannedFiadoInstallment[] = [];
  for (const installment of input.installments) {
    const dueDate = parseCivilDate(installment.dueDate);
    if (!dueDate.ok) {
      return err(dueDate.error);
    }
    if (input.installments.length === 1 && installment.amountCents == null) {
      planned.push({
        due_date: dueDate.data,
        amount_cents: String(input.netTotalCents),
      });
      continue;
    }
    const amount = parseCents(installment.amountCents);
    if (!amount.ok || amount.data <= 0) {
      return err(FIADO_AMOUNT_MISMATCH_ERROR);
    }
    planned.push({
      due_date: dueDate.data,
      amount_cents: String(amount.data),
    });
  }
  const total = planned.reduce(
    (sum, item) => sum + Number(item.amount_cents),
    0,
  );
  if (total !== input.netTotalCents) {
    return err(FIADO_AMOUNT_MISMATCH_ERROR);
  }
  return ok(planned);
}

export function agendaBucketLabel(
  bucket: 'overdue' | 'today' | 'upcoming',
): string {
  if (bucket === 'overdue') {
    return 'Atrasado';
  }
  if (bucket === 'today') {
    return 'Hoje';
  }
  return 'Próximo';
}

export function dueDateLabelForDates(
  dueDates: readonly string[],
): string | null {
  if (!dueDates.length) {
    return null;
  }
  if (dueDates.length === 1) {
    return formatCivilDisplay(dueDates[0] ?? '');
  }
  return `${dueDates.length} vencimentos`;
}

export function receivableSummaryLabel(input: {
  studentLabel: string;
  amountLabel: string;
  dueDateLabel: string;
}): string {
  return `${input.studentLabel} • ${input.amountLabel} • ${input.dueDateLabel}`;
}

export const RECEIVABLE_CHARGE_INTEREST = 'interest';
export const INTEREST_KIND_AMOUNT = 'amount';
export const INTEREST_KIND_PERCENT = 'percent';

export const INTEREST_REASON_REQUIRED_ERROR = {
  code: 'INTEREST_REASON_REQUIRED',
  message: 'Informe o motivo do juros.',
  retryable: false,
} as const;

export const INTEREST_KIND_UNSUPPORTED_ERROR = {
  code: 'INTEREST_KIND_UNSUPPORTED',
  message: 'Use valor fixo ou porcento.',
  retryable: false,
} as const;

export const INTEREST_AMOUNT_INVALID_ERROR = {
  code: 'INTEREST_AMOUNT_INVALID',
  message: 'O juros precisa ser um valor maior que zero.',
  retryable: false,
} as const;

export const RENEGOTIATE_REASON_REQUIRED_ERROR = {
  code: 'RENEGOTIATE_REASON_REQUIRED',
  message: 'Informe o motivo da renegociação.',
  retryable: false,
} as const;

export const RENEGOTIATE_SAME_DATE_ERROR = {
  code: 'RENEGOTIATE_SAME_DATE',
  message: 'Escolha um vencimento diferente do atual.',
  retryable: false,
} as const;

export const RECEIVABLE_NOT_FOUND_ERROR = {
  code: 'RECEIVABLE_NOT_FOUND',
  message: 'Dívida não encontrada para este aluno.',
  retryable: false,
} as const;

export const RECEIVABLE_SETTLED_ERROR = {
  code: 'RECEIVABLE_SETTLED',
  message: 'Esta dívida já foi quitada.',
  retryable: false,
} as const;

export type InterestKind =
  typeof INTEREST_KIND_AMOUNT | typeof INTEREST_KIND_PERCENT;

export interface PlannedInterestCharge {
  kind: typeof RECEIVABLE_CHARGE_INTEREST;
  amount_cents: string;
  reason_code: InterestKind;
  note: string;
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

export function parseInterestKind(value: unknown): Result<InterestKind> {
  if (value === INTEREST_KIND_AMOUNT || value === INTEREST_KIND_PERCENT) {
    return ok(value);
  }
  return err(INTEREST_KIND_UNSUPPORTED_ERROR);
}

export function planInterestCharge(input: {
  remainingCents: number;
  kind: unknown;
  amountCents?: unknown;
  percent?: unknown;
  reason: unknown;
}): Result<PlannedInterestCharge> {
  if (!Number.isInteger(input.remainingCents) || input.remainingCents <= 0) {
    return err(RECEIVABLE_SETTLED_ERROR);
  }
  const kind = parseInterestKind(input.kind);
  if (!kind.ok) {
    return err(kind.error);
  }
  const reason = parseRequiredReason(
    input.reason,
    INTEREST_REASON_REQUIRED_ERROR,
  );
  if (!reason.ok) {
    return err(reason.error);
  }
  let amountCents: number;
  if (kind.data === INTEREST_KIND_AMOUNT) {
    const amount = parseCents(input.amountCents);
    if (!amount.ok || amount.data <= 0) {
      return err(INTEREST_AMOUNT_INVALID_ERROR);
    }
    amountCents = amount.data;
  } else {
    const percent = parseCents(input.percent);
    if (!percent.ok || percent.data <= 0 || percent.data > 100) {
      return err(INTEREST_AMOUNT_INVALID_ERROR);
    }
    amountCents = percentAmount(input.remainingCents, percent.data);
    if (amountCents <= 0) {
      return err(INTEREST_AMOUNT_INVALID_ERROR);
    }
  }
  return ok({
    kind: RECEIVABLE_CHARGE_INTEREST,
    amount_cents: String(amountCents),
    reason_code: kind.data,
    note: reason.data,
  });
}

export function planDueDateChange(input: {
  oldDueDate: string;
  newDueDate: unknown;
  reason: unknown;
}): Result<{ old_due_date: string; new_due_date: string; reason: string }> {
  const reason = parseRequiredReason(
    input.reason,
    RENEGOTIATE_REASON_REQUIRED_ERROR,
  );
  if (!reason.ok) {
    return err(reason.error);
  }
  const next = parseCivilDate(input.newDueDate);
  if (!next.ok) {
    return err(next.error);
  }
  if (next.data === input.oldDueDate) {
    return err(RENEGOTIATE_SAME_DATE_ERROR);
  }
  return ok({
    old_due_date: input.oldDueDate,
    new_due_date: next.data,
    reason: reason.data,
  });
}

export function dueDateHistoryLabel(input: {
  studentLabel: string;
  oldDueDateLabel: string;
  newDueDateLabel: string;
  reason: string;
}): string {
  return `${input.studentLabel} • ${input.oldDueDateLabel} → ${input.newDueDateLabel} • ${input.reason}`;
}
