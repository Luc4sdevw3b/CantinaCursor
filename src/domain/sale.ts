import { applyCreditLayersToFiado } from './credit';
import { isImmutableId, isSheetRowNumber } from './ids';
import { parseCents, percentAmount } from './money';
import { parseSaleQuantity } from './quantity';
import { err, ok, type Result } from './result';

export const SALE_STATUS_PAID = 'paid';
export const SALE_ITEM_PRODUCT = 'product';
export const SALE_ITEM_AD_HOC = 'ad_hoc';
export const SETTLEMENT_PIX = 'pix';
export const SETTLEMENT_CASH = 'cash';
export const SETTLEMENT_CHANGE = 'change';
export const SETTLEMENT_FIADO = 'fiado';
export const SETTLEMENT_CREDIT = 'credit';
export const SETTLEMENT_GUARDIAN_CREDIT = 'guardian_credit';
export const PAYMENT_PIX = 'pix';
export const PAYMENT_CASH = 'cash';
export const PAYMENT_MIXED = 'mixed';
export const PAYMENT_FIADO = 'fiado';
export const DISCOUNT_NONE = 'none';
export const DISCOUNT_AMOUNT = 'amount';
export const DISCOUNT_PERCENT = 'percent';
export const PIX_COPY_TEXT_KEY = 'pix_copy_text';
export const DEFAULT_PIX_COPY_TEXT =
  'Chave PIX de teste: cantina-e2e@example.test';
export const ANONYMOUS_SALE_LABEL = 'Anônima';

export const SALE_ITEMS_REQUIRED_ERROR = {
  code: 'SALE_ITEMS_REQUIRED',
  message: 'Inclua pelo menos um item no carrinho.',
  retryable: false,
} as const;

export const PAYMENT_KIND_UNSUPPORTED_ERROR = {
  code: 'PAYMENT_KIND_UNSUPPORTED',
  message: 'Use PIX, dinheiro, PIX + dinheiro ou fiado.',
  retryable: false,
} as const;

export const INSUFFICIENT_CASH_ERROR = {
  code: 'INSUFFICIENT_CASH',
  message: 'O dinheiro recebido não cobre o restante da venda.',
  retryable: false,
} as const;

export const INVALID_PIX_AMOUNT_ERROR = {
  code: 'INVALID_PIX_AMOUNT',
  message: 'No misto, o PIX precisa ser parte do total, não o total inteiro.',
  retryable: false,
} as const;

export const CASH_TENDERED_REQUIRED_ERROR = {
  code: 'CASH_TENDERED_REQUIRED',
  message: 'Informe o dinheiro recebido.',
  retryable: false,
} as const;

export const DISCOUNT_NOT_ALLOWED_ERROR = {
  code: 'DISCOUNT_NOT_ALLOWED',
  message: 'Este produto não permite desconto.',
  retryable: false,
} as const;

export const DISCOUNT_FORBIDDEN_ERROR = {
  code: 'FORBIDDEN',
  message: 'Só a dona aplica desconto.',
  retryable: false,
} as const;

export const AD_HOC_SALE_FORBIDDEN_ERROR = {
  code: 'FORBIDDEN',
  message: 'Só a dona vende item avulso.',
  retryable: false,
} as const;

export const INVALID_DISCOUNT_ERROR = {
  code: 'INVALID_DISCOUNT',
  message: 'O desconto precisa ser um valor válido e menor que o item.',
  retryable: false,
} as const;

export const PRODUCT_INACTIVE_ERROR = {
  code: 'PRODUCT_INACTIVE',
  message: 'Produto inativo não entra em venda nova.',
  retryable: false,
} as const;

export type DiscountKind =
  typeof DISCOUNT_NONE | typeof DISCOUNT_AMOUNT | typeof DISCOUNT_PERCENT;

export type PaymentKind =
  | typeof PAYMENT_PIX
  | typeof PAYMENT_CASH
  | typeof PAYMENT_MIXED
  | typeof PAYMENT_FIADO;

export type SettlementKind =
  | typeof SETTLEMENT_PIX
  | typeof SETTLEMENT_CASH
  | typeof SETTLEMENT_CHANGE
  | typeof SETTLEMENT_FIADO
  | typeof SETTLEMENT_CREDIT
  | typeof SETTLEMENT_GUARDIAN_CREDIT;

export interface PlannedSettlement {
  kind: SettlementKind;
  amount_cents: string;
}

export interface PlannedSettlements {
  paymentKind: PaymentKind;
  rows: PlannedSettlement[];
  cashTenderedCents: number;
  changeCents: number;
}

export interface SaleLineInput {
  productId?: string | null;
  adHocName?: string | null;
  adHocPriceCents?: number | null;
  quantity: unknown;
  discountKind?: string | null;
  discountInput?: unknown;
}

export interface ResolvedProduct {
  id: string;
  name: string;
  priceCents: number;
  discountAllowed: boolean;
  stockTracked: boolean;
  active: boolean;
}

export interface PlannedSaleLine {
  product_id: string;
  item_kind: typeof SALE_ITEM_PRODUCT | typeof SALE_ITEM_AD_HOC;
  description_snapshot: string;
  quantity: string;
  unit_price_cents: string;
  discount_kind: DiscountKind;
  discount_input: string;
  discount_amount_cents: string;
  line_gross_cents: number;
  line_net_total_cents: string;
  stock_tracked: boolean;
}

function validId(id: string): boolean {
  return !isSheetRowNumber(id) && isImmutableId(id);
}

export function parseDiscountKind(value: unknown): DiscountKind {
  if (value === DISCOUNT_AMOUNT || value === DISCOUNT_PERCENT) {
    return value;
  }
  return DISCOUNT_NONE;
}

export function computeLineDiscount(input: {
  lineGrossCents: number;
  kind: DiscountKind;
  discountInput: unknown;
  discountAllowed: boolean;
  actorIsOwner: boolean;
}): Result<{ kind: DiscountKind; input: number; amountCents: number }> {
  const kind = input.kind;
  if (kind === DISCOUNT_NONE) {
    return ok({ kind, input: 0, amountCents: 0 });
  }
  if (!input.actorIsOwner) {
    return err(DISCOUNT_FORBIDDEN_ERROR);
  }
  if (!input.discountAllowed) {
    return err(DISCOUNT_NOT_ALLOWED_ERROR);
  }
  if (kind === DISCOUNT_PERCENT) {
    const percent = parseCents(input.discountInput);
    if (!percent.ok || percent.data < 1 || percent.data > 100) {
      return err(INVALID_DISCOUNT_ERROR);
    }
    const amountCents = percentAmount(input.lineGrossCents, percent.data);
    if (amountCents <= 0 || amountCents >= input.lineGrossCents) {
      return err(INVALID_DISCOUNT_ERROR);
    }
    return ok({ kind, input: percent.data, amountCents });
  }
  const amount = parseCents(input.discountInput);
  if (!amount.ok || amount.data <= 0 || amount.data >= input.lineGrossCents) {
    return err(INVALID_DISCOUNT_ERROR);
  }
  return ok({ kind, input: amount.data, amountCents: amount.data });
}

export function planSaleLine(input: {
  item: SaleLineInput;
  product: ResolvedProduct | null;
  actorIsOwner: boolean;
}): Result<PlannedSaleLine> {
  const quantity = parseSaleQuantity(input.item.quantity);
  if (!quantity.ok) {
    return err(quantity.error);
  }
  const adHocName = String(input.item.adHocName ?? '').trim();
  if (adHocName) {
    if (!input.actorIsOwner) {
      return err(AD_HOC_SALE_FORBIDDEN_ERROR);
    }
    const price = parseCents(input.item.adHocPriceCents);
    if (!price.ok) {
      return err(price.error);
    }
    const lineGross = quantity.data * price.data;
    const discount = computeLineDiscount({
      lineGrossCents: lineGross,
      kind: parseDiscountKind(input.item.discountKind),
      discountInput: input.item.discountInput,
      discountAllowed: true,
      actorIsOwner: input.actorIsOwner,
    });
    if (!discount.ok) {
      return err(discount.error);
    }
    return ok({
      product_id: '',
      item_kind: SALE_ITEM_AD_HOC,
      description_snapshot: adHocName,
      quantity: String(quantity.data),
      unit_price_cents: String(price.data),
      discount_kind: discount.data.kind,
      discount_input: String(discount.data.input),
      discount_amount_cents: String(discount.data.amountCents),
      line_gross_cents: lineGross,
      line_net_total_cents: String(lineGross - discount.data.amountCents),
      stock_tracked: false,
    });
  }
  const product = input.product;
  if (!product || !validId(product.id)) {
    return err({
      code: 'PRODUCT_NOT_FOUND',
      message: 'Produto não encontrado.',
      retryable: false,
    });
  }
  if (!product.active) {
    return err(PRODUCT_INACTIVE_ERROR);
  }
  const lineGross = quantity.data * product.priceCents;
  const discount = computeLineDiscount({
    lineGrossCents: lineGross,
    kind: parseDiscountKind(input.item.discountKind),
    discountInput: input.item.discountInput,
    discountAllowed: product.discountAllowed,
    actorIsOwner: input.actorIsOwner,
  });
  if (!discount.ok) {
    return err(discount.error);
  }
  return ok({
    product_id: product.id,
    item_kind: SALE_ITEM_PRODUCT,
    description_snapshot: product.name,
    quantity: String(quantity.data),
    unit_price_cents: String(product.priceCents),
    discount_kind: discount.data.kind,
    discount_input: String(discount.data.input),
    discount_amount_cents: String(discount.data.amountCents),
    line_gross_cents: lineGross,
    line_net_total_cents: String(lineGross - discount.data.amountCents),
    stock_tracked: product.stockTracked,
  });
}

export function planSaleTotals(lines: readonly PlannedSaleLine[]): {
  gross_total_cents: string;
  discount_total_cents: string;
  net_total_cents: string;
} {
  const gross = lines.reduce((total, line) => total + line.line_gross_cents, 0);
  const net = lines.reduce(
    (total, line) => total + Number(line.line_net_total_cents),
    0,
  );
  return {
    gross_total_cents: String(gross),
    discount_total_cents: String(gross - net),
    net_total_cents: String(net),
  };
}

export function parsePaymentKind(value: unknown): Result<PaymentKind> {
  if (
    value === PAYMENT_PIX ||
    value === PAYMENT_CASH ||
    value === PAYMENT_MIXED ||
    value === PAYMENT_FIADO
  ) {
    return ok(value);
  }
  return err(PAYMENT_KIND_UNSUPPORTED_ERROR);
}

export function validatePixPayment(
  kind: unknown,
): Result<typeof SETTLEMENT_PIX> {
  const parsed = parsePaymentKind(kind);
  if (!parsed.ok || parsed.data !== PAYMENT_PIX) {
    return err(PAYMENT_KIND_UNSUPPORTED_ERROR);
  }
  return ok(SETTLEMENT_PIX);
}

export function planSettlements(input: {
  paymentKind: unknown;
  netTotalCents: number;
  pixAmountCents?: unknown;
  cashTenderedCents?: unknown;
  creditBalanceCents?: number;
  guardianCreditCents?: number;
}): Result<PlannedSettlements> {
  const kind = parsePaymentKind(input.paymentKind);
  if (!kind.ok) {
    return err(kind.error);
  }
  const net = input.netTotalCents;
  if (!Number.isInteger(net) || net <= 0) {
    return err({
      code: 'INVALID_CENTS',
      message:
        'O total da venda precisa ser um valor em centavos, número inteiro.',
      retryable: false,
    });
  }
  if (kind.data === PAYMENT_PIX) {
    return ok({
      paymentKind: PAYMENT_PIX,
      rows: [{ kind: SETTLEMENT_PIX, amount_cents: String(net) }],
      cashTenderedCents: 0,
      changeCents: 0,
    });
  }
  if (kind.data === PAYMENT_FIADO) {
    const applied = applyCreditLayersToFiado({
      netTotalCents: net,
      personalCreditCents: input.creditBalanceCents ?? 0,
      guardianCreditCents: input.guardianCreditCents ?? 0,
    });
    const rows: PlannedSettlement[] = [];
    if (applied.personalUsedCents > 0) {
      rows.push({
        kind: SETTLEMENT_CREDIT,
        amount_cents: String(applied.personalUsedCents),
      });
    }
    if (applied.guardianUsedCents > 0) {
      rows.push({
        kind: SETTLEMENT_GUARDIAN_CREDIT,
        amount_cents: String(applied.guardianUsedCents),
      });
    }
    if (applied.fiadoCents > 0) {
      rows.push({
        kind: SETTLEMENT_FIADO,
        amount_cents: String(applied.fiadoCents),
      });
    }
    return ok({
      paymentKind: PAYMENT_FIADO,
      rows,
      cashTenderedCents: 0,
      changeCents: 0,
    });
  }
  const tendered = parseCents(input.cashTenderedCents);
  if (!tendered.ok || tendered.data <= 0) {
    return err(CASH_TENDERED_REQUIRED_ERROR);
  }
  if (kind.data === PAYMENT_CASH) {
    if (tendered.data < net) {
      return err(INSUFFICIENT_CASH_ERROR);
    }
    const changeCents = tendered.data - net;
    const rows: PlannedSettlement[] = [
      { kind: SETTLEMENT_CASH, amount_cents: String(tendered.data) },
    ];
    if (changeCents > 0) {
      rows.push({
        kind: SETTLEMENT_CHANGE,
        amount_cents: String(-changeCents),
      });
    }
    return ok({
      paymentKind: PAYMENT_CASH,
      rows,
      cashTenderedCents: tendered.data,
      changeCents,
    });
  }
  const pix = parseCents(input.pixAmountCents);
  if (!pix.ok || pix.data <= 0 || pix.data >= net) {
    return err(INVALID_PIX_AMOUNT_ERROR);
  }
  const remaining = net - pix.data;
  if (tendered.data < remaining) {
    return err(INSUFFICIENT_CASH_ERROR);
  }
  const changeCents = tendered.data - remaining;
  const rows: PlannedSettlement[] = [
    { kind: SETTLEMENT_PIX, amount_cents: String(pix.data) },
    { kind: SETTLEMENT_CASH, amount_cents: String(tendered.data) },
  ];
  if (changeCents > 0) {
    rows.push({
      kind: SETTLEMENT_CHANGE,
      amount_cents: String(-changeCents),
    });
  }
  return ok({
    paymentKind: PAYMENT_MIXED,
    rows,
    cashTenderedCents: tendered.data,
    changeCents,
  });
}

export function paymentKindFromSettlements(
  rows: readonly { kind: string }[],
): PaymentKind {
  const hasPix = rows.some((row) => row.kind === SETTLEMENT_PIX);
  const hasCash = rows.some((row) => row.kind === SETTLEMENT_CASH);
  const hasFiado = rows.some((row) => row.kind === SETTLEMENT_FIADO);
  const hasCredit = rows.some(
    (row) =>
      row.kind === SETTLEMENT_CREDIT || row.kind === SETTLEMENT_GUARDIAN_CREDIT,
  );
  if (hasFiado || hasCredit) {
    return PAYMENT_FIADO;
  }
  if (hasPix && hasCash) {
    return PAYMENT_MIXED;
  }
  if (hasCash) {
    return PAYMENT_CASH;
  }
  return PAYMENT_PIX;
}

export function saleSummaryLabel(input: {
  consumerLabel: string;
  descriptions: readonly string[];
  netLabel: string;
  paymentKind?: PaymentKind;
  changeLabel?: string | null;
  dueDateLabel?: string | null;
  creditLabel?: string | null;
  guardianCreditLabel?: string | null;
}): string {
  const base = `${input.consumerLabel} • ${input.descriptions.join(', ')} • ${input.netLabel}`;
  const extras: string[] = [];
  if (input.paymentKind === PAYMENT_CASH) {
    extras.push('Dinheiro');
  }
  if (input.paymentKind === PAYMENT_MIXED) {
    extras.push('PIX + dinheiro');
  }
  if (input.paymentKind === PAYMENT_FIADO) {
    extras.push('Fiado');
  }
  if (input.creditLabel) {
    extras.push(`crédito ${input.creditLabel}`);
  }
  if (input.guardianCreditLabel) {
    extras.push(`crédito resp. ${input.guardianCreditLabel}`);
  }
  if (input.changeLabel) {
    extras.push(`Troco ${input.changeLabel}`);
  }
  if (input.dueDateLabel) {
    extras.push(input.dueDateLabel);
  }
  return extras.length ? `${base} • ${extras.join(' • ')}` : base;
}
