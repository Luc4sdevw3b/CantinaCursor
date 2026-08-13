import { parseCents } from './money';
import { err, ok, type Result } from './result';

export const PAYMENT_STATUS_COMPLETED = 'completed';
export const PAYMENT_METHOD_PIX = 'pix';
export const PAYMENT_METHOD_CASH = 'cash';
export const PAYMENT_MODE_OLDEST_FIRST = 'oldest_first';
export const PAYMENT_MODE_SELECTED = 'selected';
export const PAYMENT_MODE_MANUAL = 'manual';

export const PAYMENT_STUDENT_REQUIRED_ERROR = {
  code: 'PAYMENT_STUDENT_REQUIRED',
  message: 'Escolha o aluno da dívida.',
  retryable: false,
} as const;

export const PAYMENT_METHOD_UNSUPPORTED_ERROR = {
  code: 'PAYMENT_METHOD_UNSUPPORTED',
  message: 'Use PIX ou dinheiro.',
  retryable: false,
} as const;

export const PAYMENT_MODE_UNSUPPORTED_ERROR = {
  code: 'PAYMENT_MODE_UNSUPPORTED',
  message: 'Use a dívida mais antiga, selecionadas ou alocação manual.',
  retryable: false,
} as const;

export const PAYMENT_SELECTION_REQUIRED_ERROR = {
  code: 'PAYMENT_SELECTION_REQUIRED',
  message: 'Selecione as dívidas.',
  retryable: false,
} as const;

export const PAYMENT_ALLOCATION_MISMATCH_ERROR = {
  code: 'PAYMENT_ALLOCATION_MISMATCH',
  message: 'A soma das alocações precisa ser igual ao valor recebido.',
  retryable: false,
} as const;

export const PAYMENT_EXCEEDS_BALANCE_ERROR = {
  code: 'PAYMENT_EXCEEDS_BALANCE',
  message: 'O valor é maior que a dívida escolhida.',
  retryable: false,
} as const;

export const NO_OPEN_RECEIVABLES_ERROR = {
  code: 'NO_OPEN_RECEIVABLES',
  message: 'Este aluno não tem dívida em aberto.',
  retryable: false,
} as const;

export const RECEIVABLE_NOT_FOUND_ERROR = {
  code: 'RECEIVABLE_NOT_FOUND',
  message: 'Dívida não encontrada para este aluno.',
  retryable: false,
} as const;

export type PaymentMethod =
  typeof PAYMENT_METHOD_PIX | typeof PAYMENT_METHOD_CASH;

export type PaymentMode =
  | typeof PAYMENT_MODE_OLDEST_FIRST
  | typeof PAYMENT_MODE_SELECTED
  | typeof PAYMENT_MODE_MANUAL;

export interface AllocatableReceivable {
  id: string;
  charged_student_id: string;
  due_date: string;
  created_at: string;
  remaining_cents: number;
}

export interface PlannedPaymentAllocation {
  receivable_id: string;
  student_id: string;
  amount_cents: string;
}

export function parsePaymentMethod(value: unknown): Result<PaymentMethod> {
  if (value === PAYMENT_METHOD_PIX || value === PAYMENT_METHOD_CASH) {
    return ok(value);
  }
  return err(PAYMENT_METHOD_UNSUPPORTED_ERROR);
}

export function parsePaymentMode(value: unknown): Result<PaymentMode> {
  if (
    value === PAYMENT_MODE_OLDEST_FIRST ||
    value === PAYMENT_MODE_SELECTED ||
    value === PAYMENT_MODE_MANUAL
  ) {
    return ok(value);
  }
  return err(PAYMENT_MODE_UNSUPPORTED_ERROR);
}

export function sortOldestFirst(
  receivables: readonly AllocatableReceivable[],
): AllocatableReceivable[] {
  return receivables.slice().sort((left, right) => {
    if (left.due_date !== right.due_date) {
      return left.due_date < right.due_date ? -1 : 1;
    }
    if (left.created_at !== right.created_at) {
      return left.created_at < right.created_at ? -1 : 1;
    }
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
}

function allocateOldestFirst(
  amountCents: number,
  receivables: readonly AllocatableReceivable[],
): Result<PlannedPaymentAllocation[]> {
  const open = sortOldestFirst(
    receivables.filter((item) => item.remaining_cents > 0),
  );
  const total = open.reduce((sum, item) => sum + item.remaining_cents, 0);
  if (!open.length || total <= 0) {
    return err(NO_OPEN_RECEIVABLES_ERROR);
  }
  if (amountCents > total) {
    return err(PAYMENT_EXCEEDS_BALANCE_ERROR);
  }
  let leftover = amountCents;
  const rows: PlannedPaymentAllocation[] = [];
  for (const item of open) {
    if (leftover <= 0) {
      break;
    }
    const applied = Math.min(item.remaining_cents, leftover);
    rows.push({
      receivable_id: item.id,
      student_id: item.charged_student_id,
      amount_cents: String(applied),
    });
    leftover -= applied;
  }
  if (leftover !== 0) {
    return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
  }
  return ok(rows);
}

export function planPaymentAllocations(input: {
  amountCents: unknown;
  mode: unknown;
  receivables: readonly AllocatableReceivable[];
  selectedReceivableIds?: readonly string[];
  allocations?: readonly { receivableId?: unknown; amountCents?: unknown }[];
}): Result<PlannedPaymentAllocation[]> {
  const mode = parsePaymentMode(input.mode);
  if (!mode.ok) {
    return err(mode.error);
  }
  const amount = parseCents(input.amountCents);
  if (!amount.ok || amount.data <= 0) {
    return err({
      code: 'INVALID_CENTS',
      message:
        'O valor do pagamento precisa ser um valor em centavos, número inteiro.',
      retryable: false,
    });
  }
  const byId = new Map(input.receivables.map((item) => [item.id, item]));
  if (mode.data === PAYMENT_MODE_MANUAL) {
    const lines = input.allocations ?? [];
    if (!lines.length) {
      return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
    }
    const rows: PlannedPaymentAllocation[] = [];
    let total = 0;
    for (const line of lines) {
      const receivableId =
        typeof line.receivableId === 'string' ? line.receivableId : '';
      const receivable = byId.get(receivableId);
      if (!receivable || receivable.remaining_cents <= 0) {
        return err(RECEIVABLE_NOT_FOUND_ERROR);
      }
      const lineAmount = parseCents(line.amountCents);
      if (!lineAmount.ok || lineAmount.data <= 0) {
        return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
      }
      if (lineAmount.data > receivable.remaining_cents) {
        return err(PAYMENT_EXCEEDS_BALANCE_ERROR);
      }
      if (rows.some((row) => row.receivable_id === receivable.id)) {
        return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
      }
      total += lineAmount.data;
      rows.push({
        receivable_id: receivable.id,
        student_id: receivable.charged_student_id,
        amount_cents: String(lineAmount.data),
      });
    }
    if (total !== amount.data) {
      return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
    }
    return ok(rows);
  }
  let pool = input.receivables;
  if (mode.data === PAYMENT_MODE_SELECTED) {
    const selected = input.selectedReceivableIds ?? [];
    if (!selected.length) {
      return err(PAYMENT_SELECTION_REQUIRED_ERROR);
    }
    const picked: AllocatableReceivable[] = [];
    for (const id of selected) {
      const receivable = byId.get(id);
      if (!receivable || receivable.remaining_cents <= 0) {
        return err(RECEIVABLE_NOT_FOUND_ERROR);
      }
      if (picked.some((item) => item.id === receivable.id)) {
        continue;
      }
      picked.push(receivable);
    }
    pool = picked;
  }
  return allocateOldestFirst(amount.data, pool);
}

export function paymentSummaryLabel(input: {
  studentLabel: string;
  amountLabel: string;
  method: PaymentMethod;
}): string {
  const methodLabel = input.method === PAYMENT_METHOD_CASH ? 'Dinheiro' : 'PIX';
  return `${input.studentLabel} • ${input.amountLabel} • ${methodLabel}`;
}
