import { formatCivilDisplay, parseCivilDate } from './civil-date';
import { parseCents } from './money';
import { err, ok, type Result } from './result';

export const RECEIVABLE_STATUS_OPEN = 'open';
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
