import { formatBrl } from './money';
import { PAYMENT_METHOD_CASH, PAYMENT_METHOD_PIX } from './payment';
import { err, ok, type Result } from './result';

export const REVERSAL_OPERATION_SALE = 'sale';
export const REVERSAL_OPERATION_PAYMENT = 'payment';
export const REVERSAL_OPERATION_CREDIT_REFUND = 'credit_refund';
export const REVERSAL_EFFECT_CASH_REFUND = 'cash_refund';
export const REVERSAL_EFFECT_PIX_REFUND = 'pix_refund';
export const REVERSAL_EFFECT_CASH_RECOVERY = 'cash_recovery';
export const REVERSAL_EFFECT_PIX_RECOVERY = 'pix_recovery';
export const REVERSAL_EFFECT_CREDIT_RESTORE = 'credit_restore';
export const REVERSAL_EFFECT_CREDIT_REMOVE = 'credit_remove';
export const REVERSAL_EFFECT_DEBT_CANCELLED = 'debt_cancelled';
export const REVERSAL_EFFECT_DEBT_REOPENED = 'debt_reopened';
export const REVERSAL_EFFECT_STOCK_RETURN = 'stock_return';
export const SALE_STATUS_REVERSED = 'reversed';
export const PAYMENT_STATUS_REVERSED = 'reversed';
export const RECEIVABLE_STATUS_REVERSED = 'reversed';
export const CREDIT_KIND_REVERSAL = 'reversal';
export const CREDIT_SOURCE_OPERATION_REVERSAL = 'operation_reversal';
export const CASH_KIND_REVERSAL = 'reversal';
export const CASH_SOURCE_REVERSAL = 'operation_reversal';
export const INVENTORY_SALE_RETURN_KIND = 'sale_return';

export type ReversalOperationType =
  | typeof REVERSAL_OPERATION_SALE
  | typeof REVERSAL_OPERATION_PAYMENT
  | typeof REVERSAL_OPERATION_CREDIT_REFUND;

export type ReversalEffectType =
  | typeof REVERSAL_EFFECT_CASH_REFUND
  | typeof REVERSAL_EFFECT_PIX_REFUND
  | typeof REVERSAL_EFFECT_CASH_RECOVERY
  | typeof REVERSAL_EFFECT_PIX_RECOVERY
  | typeof REVERSAL_EFFECT_CREDIT_RESTORE
  | typeof REVERSAL_EFFECT_CREDIT_REMOVE
  | typeof REVERSAL_EFFECT_DEBT_CANCELLED
  | typeof REVERSAL_EFFECT_DEBT_REOPENED
  | typeof REVERSAL_EFFECT_STOCK_RETURN;

export type ReversalRefundMethod =
  typeof PAYMENT_METHOD_PIX | typeof PAYMENT_METHOD_CASH;

export const REVERSAL_OWNER_REQUIRED_ERROR = {
  code: 'FORBIDDEN',
  message: 'Somente a dona pode estornar operações.',
  retryable: false,
} as const;

export const REVERSAL_REASON_REQUIRED_ERROR = {
  code: 'REVERSAL_REASON_REQUIRED',
  message: 'Informe um motivo entre 2 e 500 caracteres.',
  retryable: false,
} as const;

export const REVERSAL_STOCK_CHOICE_REQUIRED_ERROR = {
  code: 'REVERSAL_STOCK_CHOICE_REQUIRED',
  message: 'Informe se os produtos voltaram ao estoque.',
  retryable: false,
} as const;

export const REVERSAL_REFUND_METHOD_REQUIRED_ERROR = {
  code: 'REVERSAL_REFUND_METHOD_REQUIRED',
  message: 'Escolha como o valor pago será devolvido.',
  retryable: false,
} as const;

export const REVERSAL_NO_EXTERNAL_REFUND_ERROR = {
  code: 'REVERSAL_NO_EXTERNAL_REFUND',
  message: 'Esta venda não possui PIX ou dinheiro para devolver.',
  retryable: false,
} as const;

export const REVERSAL_DIFFERENT_METHOD_ERROR = {
  code: 'REVERSAL_DIFFERENT_METHOD_UNCONFIRMED',
  message:
    'Confirme explicitamente a devolução por forma diferente da original.',
  retryable: false,
} as const;

export const REVERSAL_CONFIRMATION_INVALID_ERROR = {
  code: 'REVERSAL_CONFIRMATION_INVALID',
  message: 'Confirmação inválida.',
  retryable: false,
} as const;

export const REVERSAL_METHOD_UNSUPPORTED_ERROR = {
  code: 'REVERSAL_METHOD_UNSUPPORTED',
  message: 'Forma inválida.',
  retryable: false,
} as const;

export const SALE_ALREADY_REVERSED_ERROR = {
  code: 'SALE_ALREADY_REVERSED',
  message: 'Esta venda já foi estornada.',
  retryable: false,
} as const;

export const PAYMENT_ALREADY_REVERSED_ERROR = {
  code: 'PAYMENT_ALREADY_REVERSED',
  message: 'Este pagamento já foi estornado.',
  retryable: false,
} as const;

export const CREDIT_REFUND_ALREADY_REVERSED_ERROR = {
  code: 'CREDIT_REFUND_ALREADY_REVERSED',
  message: 'Esta devolução de crédito já foi estornada.',
  retryable: false,
} as const;

export const SALE_NOT_FOUND_ERROR = {
  code: 'SALE_NOT_FOUND',
  message: 'Venda não encontrada.',
  retryable: false,
} as const;

export const PAYMENT_NOT_FOUND_ERROR = {
  code: 'PAYMENT_NOT_FOUND',
  message: 'Pagamento não encontrado.',
  retryable: false,
} as const;

export const CREDIT_REFUND_NOT_FOUND_ERROR = {
  code: 'CREDIT_REFUND_NOT_FOUND',
  message: 'Devolução de crédito não encontrada.',
  retryable: false,
} as const;

export const REVERSAL_PAYMENTS_FIRST_ERROR = {
  code: 'REVERSAL_PAYMENTS_FIRST',
  message:
    'Esta venda possui cobrança já paga. Estorne primeiro os pagamentos vinculados.',
  retryable: false,
} as const;

export const REVERSAL_CREDIT_USED_ERROR = {
  code: 'REVERSAL_CREDIT_ALREADY_USED',
  message:
    'O crédito originado neste pagamento já foi usado. Reverta os usos posteriores antes de estornar o pagamento.',
  retryable: false,
} as const;

export const REVERSAL_CREDIT_WITH_DEBT_ERROR = {
  code: 'REVERSAL_CREDIT_WITH_DEBT',
  message:
    'O estorno restauraria crédito pessoal enquanto existe dívida. Regularize a dívida antes de continuar.',
  retryable: false,
} as const;

export const REVERSAL_NEGATIVE_CREDIT_ERROR = {
  code: 'REVERSAL_NEGATIVE_CREDIT',
  message: 'O estorno não pode deixar crédito negativo.',
  retryable: false,
} as const;

export const REVERSAL_STOCK_DAY_REQUIRED_ERROR = {
  code: 'INVENTORY_DAY_NOT_OPEN',
  message: 'Abra o estoque de hoje antes de registrar o retorno dos produtos.',
  retryable: false,
} as const;

const EFFECT_LABELS: Record<ReversalEffectType, string> = {
  cash_refund: 'Devolução em dinheiro',
  pix_refund: 'Devolução por PIX',
  cash_recovery: 'Dinheiro recuperado',
  pix_recovery: 'PIX recuperado',
  credit_restore: 'Crédito restaurado',
  credit_remove: 'Crédito removido',
  debt_cancelled: 'Dívida cancelada',
  debt_reopened: 'Dívida reaberta',
  stock_return: 'Produto retornado ao estoque',
};

export function parseReversalReason(value: unknown): Result<string> {
  if (typeof value !== 'string') {
    return err(REVERSAL_REASON_REQUIRED_ERROR);
  }
  const reason = value.trim().replace(/\s+/g, ' ');
  if (reason.length < 2 || reason.length > 500) {
    return err(REVERSAL_REASON_REQUIRED_ERROR);
  }
  return ok(reason);
}

export function parseReversalRefundMethod(
  value: unknown,
): Result<ReversalRefundMethod> {
  if (value === PAYMENT_METHOD_PIX || value === PAYMENT_METHOD_CASH) {
    return ok(value);
  }
  return err(REVERSAL_METHOD_UNSUPPORTED_ERROR);
}

export function parseNullableReversalRefundMethod(
  value: unknown,
): Result<ReversalRefundMethod | null> {
  if (value === null || value === undefined || value === '') {
    return ok(null);
  }
  return parseReversalRefundMethod(value);
}

export function parseReturnItemsToStock(value: unknown): Result<boolean> {
  if (typeof value !== 'boolean') {
    return err(REVERSAL_STOCK_CHOICE_REQUIRED_ERROR);
  }
  return ok(value);
}

export function parseDifferentMethodConfirmed(value: unknown): Result<boolean> {
  if (typeof value !== 'boolean') {
    return err(REVERSAL_CONFIRMATION_INVALID_ERROR);
  }
  return ok(value);
}

export function originalMethodsFromSettlements(
  settlements: readonly { kind: string }[],
): ReversalRefundMethod[] {
  const methods: ReversalRefundMethod[] = [];
  for (const settlement of settlements) {
    if (
      (settlement.kind === PAYMENT_METHOD_PIX ||
        settlement.kind === PAYMENT_METHOD_CASH) &&
      !methods.includes(settlement.kind)
    ) {
      methods.push(settlement.kind);
    }
  }
  return methods;
}

export function externalAmountFromSettlements(
  settlements: readonly { kind: string; amountCents: number }[],
): number {
  return settlements
    .filter(
      (item) =>
        item.kind === PAYMENT_METHOD_PIX ||
        item.kind === PAYMENT_METHOD_CASH ||
        item.kind === 'change',
    )
    .reduce((total, item) => total + item.amountCents, 0);
}

export function requiresDifferentMethodConfirmation(input: {
  originalMethods: readonly ReversalRefundMethod[];
  refundMethod: ReversalRefundMethod | null;
  externalAmountCents: number;
}): boolean {
  if (input.externalAmountCents <= 0 || input.refundMethod === null) {
    return false;
  }
  return (
    input.originalMethods.length !== 1 ||
    input.originalMethods[0] !== input.refundMethod
  );
}

export function reversalEffectSummary(input: {
  type: ReversalEffectType;
  amountDeltaCents: number | null;
  quantityDelta: number | null;
}): string {
  const name = EFFECT_LABELS[input.type];
  if (input.amountDeltaCents !== null) {
    const sign = input.amountDeltaCents > 0 ? '+' : '−';
    return `${name}: ${sign}${formatBrl(Math.abs(input.amountDeltaCents))}`;
  }
  if (input.quantityDelta !== null) {
    return `${name}: +${input.quantityDelta}`;
  }
  return name;
}

export function reversalOperationLabel(type: ReversalOperationType): string {
  if (type === REVERSAL_OPERATION_SALE) {
    return 'Venda';
  }
  if (type === REVERSAL_OPERATION_PAYMENT) {
    return 'Pagamento';
  }
  return 'Devolução de crédito';
}

export function paymentDestinationLabel(input: {
  debtCents: number;
  creditCents: number;
}): string {
  if (input.debtCents > 0 && input.creditCents > 0) {
    return 'Dívidas e crédito';
  }
  if (input.creditCents > 0) {
    return 'Crédito';
  }
  return 'Dívidas';
}
