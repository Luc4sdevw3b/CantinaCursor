import { parseCents } from './money';
import { err, ok, type Result } from './result';

export const PAYMENT_STATUS_COMPLETED = 'completed';
export const PAYMENT_METHOD_PIX = 'pix';
export const PAYMENT_METHOD_CASH = 'cash';
export const PAYMENT_MODE_OLDEST_FIRST = 'oldest_first';
export const PAYMENT_MODE_SELECTED = 'selected';
export const PAYMENT_MODE_MANUAL = 'manual';
export const PAYMENT_MODE_CREDIT_REMAINDER = 'credit_remainder';
export const PAYMENT_MODE_ALL_CREDIT = 'all_credit';

export const PAYMENT_STUDENT_REQUIRED_ERROR = {
  code: 'PAYMENT_STUDENT_REQUIRED',
  message: 'Escolha o aluno da dívida.',
  retryable: false,
} as const;

export const PAYMENT_GUARDIAN_REQUIRED_ERROR = {
  code: 'PAYMENT_GUARDIAN_REQUIRED',
  message: 'Escolha o responsável do pagamento.',
  retryable: false,
} as const;

export const PAYMENT_FAMILY_CHILD_REQUIRED_ERROR = {
  code: 'PAYMENT_FAMILY_CHILD_REQUIRED',
  message: 'Escolha o filho para quitar.',
  retryable: false,
} as const;

export const PAYMENT_LEFTOVER_UNEXPLAINED_ERROR = {
  code: 'PAYMENT_LEFTOVER_UNEXPLAINED',
  message: 'A sobra precisa ir para o crédito do responsável.',
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

export type FamilyPaymentMode =
  | PaymentMode
  | typeof PAYMENT_MODE_CREDIT_REMAINDER
  | typeof PAYMENT_MODE_ALL_CREDIT;

export const FAMILY_PAYMENT_MODE_UNSUPPORTED_ERROR = {
  code: 'PAYMENT_MODE_UNSUPPORTED',
  message:
    'Use quitar um filho, selecionadas, alocação manual, dívida + crédito ou tudo crédito.',
  retryable: false,
} as const;

export const PAYMENT_CHILD_NOT_LINKED_ERROR = {
  code: 'PAYMENT_CHILD_NOT_LINKED',
  message: 'Este responsável não está vinculado a esse aluno.',
  retryable: false,
} as const;

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

export interface PlannedFamilyPayment {
  allocations: PlannedPaymentAllocation[];
  creditCents: number;
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

export function parseFamilyPaymentMode(
  value: unknown,
): Result<FamilyPaymentMode> {
  const studentMode = parsePaymentMode(value);
  if (studentMode.ok) {
    return studentMode;
  }
  if (
    value === PAYMENT_MODE_CREDIT_REMAINDER ||
    value === PAYMENT_MODE_ALL_CREDIT
  ) {
    return ok(value);
  }
  return err(FAMILY_PAYMENT_MODE_UNSUPPORTED_ERROR);
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

function parsePaymentAmount(value: unknown): Result<number> {
  const amount = parseCents(value);
  if (!amount.ok || amount.data <= 0) {
    return err({
      code: 'INVALID_CENTS',
      message:
        'O valor do pagamento precisa ser um valor em centavos, número inteiro.',
      retryable: false,
    });
  }
  return ok(amount.data);
}

function planManualAllocations(
  amountCents: number,
  receivables: readonly AllocatableReceivable[],
  allocations: readonly { receivableId?: unknown; amountCents?: unknown }[],
  leftoverAllowed: boolean,
): Result<PlannedFamilyPayment> {
  if (!allocations.length) {
    return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
  }
  const byId = new Map(receivables.map((item) => [item.id, item]));
  const rows: PlannedPaymentAllocation[] = [];
  let total = 0;
  for (const line of allocations) {
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
  if (leftoverAllowed) {
    if (total <= 0 || total >= amountCents) {
      return err(PAYMENT_LEFTOVER_UNEXPLAINED_ERROR);
    }
    return ok({ allocations: rows, creditCents: amountCents - total });
  }
  if (total < amountCents) {
    return err(PAYMENT_LEFTOVER_UNEXPLAINED_ERROR);
  }
  if (total !== amountCents) {
    return err(PAYMENT_ALLOCATION_MISMATCH_ERROR);
  }
  return ok({ allocations: rows, creditCents: 0 });
}

export function planFamilyPayment(input: {
  amountCents: unknown;
  mode: unknown;
  receivables: readonly AllocatableReceivable[];
  studentId?: string | null;
  selectedReceivableIds?: readonly string[];
  allocations?: readonly { receivableId?: unknown; amountCents?: unknown }[];
}): Result<PlannedFamilyPayment> {
  const mode = parseFamilyPaymentMode(input.mode);
  if (!mode.ok) {
    return err(mode.error);
  }
  const amount = parsePaymentAmount(input.amountCents);
  if (!amount.ok) {
    return err(amount.error);
  }
  if (mode.data === PAYMENT_MODE_ALL_CREDIT) {
    return ok({ allocations: [], creditCents: amount.data });
  }
  if (mode.data === PAYMENT_MODE_CREDIT_REMAINDER) {
    if (input.allocations?.length) {
      return planManualAllocations(
        amount.data,
        input.receivables,
        input.allocations,
        true,
      );
    }
    const open = input.receivables.filter((item) => item.remaining_cents > 0);
    const total = open.reduce((sum, item) => sum + item.remaining_cents, 0);
    if (!open.length || amount.data <= total) {
      return err(PAYMENT_LEFTOVER_UNEXPLAINED_ERROR);
    }
    const rows = allocateOldestFirst(total, open);
    if (!rows.ok) {
      return err(rows.error);
    }
    return ok({
      allocations: rows.data,
      creditCents: amount.data - total,
    });
  }
  if (mode.data === PAYMENT_MODE_OLDEST_FIRST && !input.studentId) {
    return err(PAYMENT_FAMILY_CHILD_REQUIRED_ERROR);
  }
  const pool =
    mode.data === PAYMENT_MODE_OLDEST_FIRST
      ? input.receivables.filter(
          (item) => item.charged_student_id === input.studentId,
        )
      : input.receivables;
  if (mode.data === PAYMENT_MODE_MANUAL) {
    return planManualAllocations(
      amount.data,
      pool,
      input.allocations ?? [],
      false,
    );
  }
  const planned = planPaymentAllocations({
    amountCents: amount.data,
    mode: mode.data,
    receivables: pool,
    selectedReceivableIds: input.selectedReceivableIds,
  });
  if (!planned.ok) {
    if (planned.error.code === PAYMENT_EXCEEDS_BALANCE_ERROR.code) {
      return err(PAYMENT_LEFTOVER_UNEXPLAINED_ERROR);
    }
    return err(planned.error);
  }
  return ok({ allocations: planned.data, creditCents: 0 });
}

export function paymentSummaryLabel(input: {
  studentLabel: string;
  amountLabel: string;
  method: PaymentMethod;
}): string {
  const methodLabel = input.method === PAYMENT_METHOD_CASH ? 'Dinheiro' : 'PIX';
  return `${input.studentLabel} • ${input.amountLabel} • ${methodLabel}`;
}

export function familyPaymentSummaryLabel(input: {
  guardianLabel: string;
  amountLabel: string;
  method: PaymentMethod;
  childLines: readonly { studentLabel: string; amountLabel: string }[];
  creditLabel?: string | null;
}): string {
  const methodLabel = input.method === PAYMENT_METHOD_CASH ? 'Dinheiro' : 'PIX';
  const parts = [input.guardianLabel, input.amountLabel, methodLabel];
  for (const line of input.childLines) {
    parts.push(`${line.studentLabel} ${line.amountLabel}`);
  }
  if (input.creditLabel) {
    parts.push(`crédito ${input.creditLabel}`);
  }
  return parts.join(' • ');
}
