import { parseCivilDate } from './civil-date';
import { isImmutableId, isSheetRowNumber } from './ids';
import { parseOpeningQuantity, parseQuantityDelta } from './quantity';
import { err, ok, type Result } from './result';

export const SOLD_OUT_LABEL = 'ACABOU';
export const INVENTORY_DAY_OPEN = 'open';
export const INVENTORY_ADJUSTMENT_KIND = 'adjustment';
export const INVENTORY_SALE_KIND = 'sale';

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

export const INVENTORY_ITEMS_REQUIRED_ERROR = {
  code: 'INVENTORY_ITEMS_REQUIRED',
  message: 'Informe a quantidade inicial de cada produto que controla estoque.',
  retryable: false,
} as const;

export const INVENTORY_PRODUCT_NOT_TRACKED_ERROR = {
  code: 'PRODUCT_STOCK_NOT_TRACKED',
  message: 'Só produtos que controlam estoque entram no estoque do dia.',
  retryable: false,
} as const;

export const INVENTORY_REASON_REQUIRED_ERROR = {
  code: 'INVENTORY_REASON_REQUIRED',
  message: 'Informe o motivo do ajuste de estoque.',
  retryable: false,
} as const;

export const INSUFFICIENT_STOCK_ERROR = {
  code: 'INSUFFICIENT_STOCK',
  message: 'O estoque não pode ficar negativo.',
  retryable: false,
} as const;

export interface OpeningItemInput {
  productId: string;
  openingQuantity: unknown;
}

export interface ValidatedOpeningItem {
  product_id: string;
  opening_quantity: string;
}

export interface ValidatedAdjustment {
  product_id: string;
  quantity_delta: string;
  reason: string;
  kind: typeof INVENTORY_ADJUSTMENT_KIND;
}

function validId(id: string): boolean {
  return !isSheetRowNumber(id) && isImmutableId(id);
}

export function physicalQuantity(
  opening: number,
  deltas: readonly number[],
): number {
  return deltas.reduce((total, delta) => total + delta, opening);
}

export function quantityLabel(physical: number): string {
  return physical === 0 ? SOLD_OUT_LABEL : String(physical);
}

export function validateOpeningItems(input: {
  businessDate: unknown;
  items: readonly OpeningItemInput[] | null | undefined;
  trackedProductIds: readonly string[];
}): Result<{
  business_date: string;
  items: ValidatedOpeningItem[];
}> {
  const businessDate = parseCivilDate(input.businessDate);
  if (!businessDate.ok) {
    return err(businessDate.error);
  }
  const items = input.items ?? [];
  const tracked = new Set(input.trackedProductIds);
  if (tracked.size === 0) {
    return err(INVENTORY_ITEMS_REQUIRED_ERROR);
  }
  const seen = new Set<string>();
  const validated: ValidatedOpeningItem[] = [];
  for (const item of items) {
    const productId = String(item.productId ?? '');
    if (!validId(productId) || !tracked.has(productId) || seen.has(productId)) {
      return err(INVENTORY_PRODUCT_NOT_TRACKED_ERROR);
    }
    const quantity = parseOpeningQuantity(item.openingQuantity);
    if (!quantity.ok) {
      return err(quantity.error);
    }
    seen.add(productId);
    validated.push({
      product_id: productId,
      opening_quantity: String(quantity.data),
    });
  }
  if (seen.size !== tracked.size) {
    return err(INVENTORY_ITEMS_REQUIRED_ERROR);
  }
  return ok({
    business_date: businessDate.data,
    items: validated,
  });
}

export function validateAdjustment(input: {
  productId: unknown;
  quantityDelta: unknown;
  reason: unknown;
  stockTracked: boolean;
  currentPhysical: number;
}): Result<ValidatedAdjustment> {
  const productId = String(input.productId ?? '');
  if (!validId(productId)) {
    return err(INVALID_ID_ERROR);
  }
  if (!input.stockTracked) {
    return err(INVENTORY_PRODUCT_NOT_TRACKED_ERROR);
  }
  const delta = parseQuantityDelta(input.quantityDelta);
  if (!delta.ok) {
    return err(delta.error);
  }
  const reason = String(input.reason ?? '').trim();
  if (reason.length < 2) {
    return err(INVENTORY_REASON_REQUIRED_ERROR);
  }
  if (input.currentPhysical + delta.data < 0) {
    return err(INSUFFICIENT_STOCK_ERROR);
  }
  return ok({
    product_id: productId,
    quantity_delta: String(delta.data),
    reason,
    kind: INVENTORY_ADJUSTMENT_KIND,
  });
}
