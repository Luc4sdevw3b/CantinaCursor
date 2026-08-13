import { formatCivilDisplay, parseCivilDate } from './civil-date';
import { formatBrl, parseCents } from './money';
import { err, ok, type Result } from './result';

export const CASH_STATUS_OPEN = 'open';
export const CASH_STATUS_CLOSED = 'closed';
export const CASH_KIND_RECEIVED = 'cash_received';
export const CASH_KIND_CHANGE = 'change_given';
export const CASH_KIND_ADDED = 'cash_added_for_change';
export const CASH_KIND_REMOVED = 'cash_removed';
export const CASH_KIND_PAYMENT = 'debt_payment_received';
export const CASH_KIND_CREDIT_DEPOSIT = 'credit_deposit_received';
export const CASH_KIND_REVERSAL = 'reversal';
export const CASH_SOURCE_SALE = 'sale';
export const CASH_SOURCE_PAYMENT = 'payment';
export const CASH_SOURCE_ADDITION = 'cash_manual_addition';
export const CASH_SOURCE_REMOVAL = 'cash_manual_removal';
export const CASH_SOURCE_REVERSAL = 'operation_reversal';

export const CASH_SESSION_REQUIRED_ERROR = {
  code: 'CASH_SESSION_REQUIRED',
  message:
    'Abra o caixa de hoje antes de movimentar dinheiro. PIX continua disponível sem caixa.',
  retryable: false,
} as const;

export const CASH_ALREADY_OPEN_ERROR = {
  code: 'CASH_ALREADY_OPEN',
  message: 'O caixa de hoje já está aberto.',
  retryable: false,
} as const;

export const CASH_ALREADY_CLOSED_ERROR = {
  code: 'CASH_ALREADY_CLOSED',
  message: 'O caixa de hoje já foi fechado e não pode ser reaberto.',
  retryable: false,
} as const;

export const CASH_NOT_OPEN_ERROR = {
  code: 'CASH_NOT_OPEN',
  message: 'Não existe caixa aberto para fechar.',
  retryable: false,
} as const;

export const CASH_INSUFFICIENT_ERROR = {
  code: 'CASH_INSUFFICIENT_FLOAT',
  message: 'Não há dinheiro físico suficiente no caixa para esta saída.',
  retryable: false,
} as const;

export const CASH_CLOSE_NOTE_REQUIRED_ERROR = {
  code: 'CASH_CLOSE_NOTE_REQUIRED',
  message: 'Informe o motivo da diferença no fechamento.',
  retryable: false,
} as const;

export const CASH_ADD_NOTE_REQUIRED_ERROR = {
  code: 'CASH_NOTE_REQUIRED',
  message: 'Informe a origem do dinheiro adicionado.',
  retryable: false,
} as const;

export const CASH_REMOVE_NOTE_REQUIRED_ERROR = {
  code: 'CASH_NOTE_REQUIRED',
  message: 'Informe o motivo da retirada.',
  retryable: false,
} as const;

export const CASH_AMOUNT_REQUIRED_ERROR = {
  code: 'INVALID_CENTS',
  message: 'Informe um valor em dinheiro maior que zero.',
  retryable: false,
} as const;

export function staleCashSessionError(businessDate: string) {
  return {
    code: 'STALE_CASH_SESSION',
    message: `O caixa de ${businessDate} precisa ser fechado antes de novas movimentações em dinheiro.`,
    retryable: false,
  } as const;
}

export function staleCashMustCloseError(businessDate: string) {
  return {
    code: 'STALE_CASH_SESSION',
    message: `O caixa de ${businessDate} precisa ser fechado antes de abrir outro.`,
    retryable: false,
  } as const;
}

export function expectedCashCents(
  openingFloatCents: number,
  deltas: readonly number[],
): number {
  return deltas.reduce((total, delta) => total + delta, openingFloatCents);
}

export function parseOpeningFloatCents(value: unknown): Result<number> {
  if (value === null || value === undefined || value === '') {
    return ok(0);
  }
  return parseCents(value);
}

export function parsePositiveCashCents(value: unknown): Result<number> {
  const parsed = parseCents(value);
  if (!parsed.ok) {
    return err(parsed.error);
  }
  if (parsed.data < 1) {
    return err(CASH_AMOUNT_REQUIRED_ERROR);
  }
  return parsed;
}

export function parseCashNote(
  value: unknown,
  required: { code: string; message: string; retryable: boolean },
): Result<string> {
  const note = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (note.length < 2) {
    return err(required);
  }
  return ok(note);
}

export function parseOptionalCashNote(value: unknown): Result<string> {
  const note = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (note.length === 0) {
    return ok('');
  }
  if (note.length < 2) {
    return err(CASH_CLOSE_NOTE_REQUIRED_ERROR);
  }
  return ok(note);
}

export function cashMovementSummary(
  kind: string,
  amountDeltaCents: number,
): string {
  if (kind === CASH_KIND_RECEIVED) {
    return `entrada ${formatBrl(amountDeltaCents)}`;
  }
  if (kind === CASH_KIND_CHANGE) {
    return `troco ${formatBrl(-amountDeltaCents)}`;
  }
  if (kind === CASH_KIND_ADDED) {
    return `troco extra ${formatBrl(amountDeltaCents)}`;
  }
  if (kind === CASH_KIND_REMOVED) {
    return `retirada ${formatBrl(-amountDeltaCents)}`;
  }
  if (kind === CASH_KIND_PAYMENT) {
    return `pagamento ${formatBrl(amountDeltaCents)}`;
  }
  if (kind === CASH_KIND_CREDIT_DEPOSIT) {
    return `crédito ${formatBrl(amountDeltaCents)}`;
  }
  if (kind === CASH_KIND_REVERSAL) {
    if (amountDeltaCents < 0) {
      return `devolução ${formatBrl(-amountDeltaCents)}`;
    }
    return `recuperação ${formatBrl(amountDeltaCents)}`;
  }
  return formatBrl(Math.abs(amountDeltaCents));
}

export function cashSessionSummary(input: {
  status: string;
  businessDate: string;
  openingFloatCents: number;
  expectedCents: number;
  countedCents: number | null;
  differenceCents: number | null;
  todayCivil: string;
}): string {
  const dateLabel = formatCivilDisplay(input.businessDate);
  if (
    input.status === CASH_STATUS_OPEN &&
    input.businessDate < input.todayCivil
  ) {
    return `Caixa antigo • ${dateLabel} • precisa ser fechado`;
  }
  if (input.status === CASH_STATUS_OPEN) {
    return `Aberto • ${dateLabel} • troco inicial ${formatBrl(input.openingFloatCents)} • esperado ${formatBrl(input.expectedCents)}`;
  }
  const counted = input.countedCents ?? 0;
  const difference = input.differenceCents ?? 0;
  const differenceLabel =
    difference === 0
      ? formatBrl(0)
      : `${difference > 0 ? '+' : '-'}${formatBrl(Math.abs(difference))}`;
  return `Fechado • ${dateLabel} • esperado ${formatBrl(input.expectedCents)} • contado ${formatBrl(counted)} • diferença ${differenceLabel}`;
}

export function validateCashOpen(input: {
  todayCivil: string;
  openingFloatCents: unknown;
  openSession: { businessDate: string } | null;
  todaySession: { status: string } | null;
}): Result<{ business_date: string; opening_float_cents: number }> {
  const today = parseCivilDate(input.todayCivil);
  if (!today.ok) {
    return err(today.error);
  }
  if (input.openSession) {
    if (input.openSession.businessDate === today.data) {
      return err(CASH_ALREADY_OPEN_ERROR);
    }
    return err(staleCashMustCloseError(input.openSession.businessDate));
  }
  if (input.todaySession?.status === CASH_STATUS_CLOSED) {
    return err(CASH_ALREADY_CLOSED_ERROR);
  }
  const opening = parseOpeningFloatCents(input.openingFloatCents);
  if (!opening.ok) {
    return err(opening.error);
  }
  return ok({
    business_date: today.data,
    opening_float_cents: opening.data,
  });
}

export function validateCashMovement(input: {
  todayCivil: string;
  openSession: { businessDate: string; expectedCents: number } | null;
  amountDeltaCents: number;
}): Result<{ sessionBusinessDate: string }> {
  if (!input.openSession) {
    return err(CASH_SESSION_REQUIRED_ERROR);
  }
  if (input.openSession.businessDate !== input.todayCivil) {
    return err(staleCashSessionError(input.openSession.businessDate));
  }
  if (input.openSession.expectedCents + input.amountDeltaCents < 0) {
    return err(CASH_INSUFFICIENT_ERROR);
  }
  return ok({ sessionBusinessDate: input.openSession.businessDate });
}

export function validateCashClose(input: {
  openSession: { expectedCents: number } | null;
  countedCents: unknown;
  note: unknown;
}): Result<{
  counted_cents: number;
  expected_cents: number;
  difference_cents: number;
  close_note: string;
}> {
  if (!input.openSession) {
    return err(CASH_NOT_OPEN_ERROR);
  }
  const counted = parseCents(input.countedCents);
  if (!counted.ok) {
    return err(counted.error);
  }
  const difference = counted.data - input.openSession.expectedCents;
  const note = parseOptionalCashNote(input.note);
  if (!note.ok) {
    return err(note.error);
  }
  if (difference !== 0 && note.data.length === 0) {
    return err(CASH_CLOSE_NOTE_REQUIRED_ERROR);
  }
  return ok({
    counted_cents: counted.data,
    expected_cents: input.openSession.expectedCents,
    difference_cents: difference,
    close_note: note.data,
  });
}
