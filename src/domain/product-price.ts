import { isImmutableId, isSheetRowNumber } from './ids';
import { parseCents } from './money';
import { err, ok, type Result } from './result';

export interface ProductPriceHistoryRecord {
  id: string;
  product_id: string;
  price_cents: string;
  started_at: string;
  ended_at: string;
  created_by: string;
}

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

function validId(id: string): boolean {
  return !isSheetRowNumber(id) && isImmutableId(id);
}

export function currentPriceHistory(
  records: readonly ProductPriceHistoryRecord[],
  productId: string,
): ProductPriceHistoryRecord | null {
  const open = records.filter(
    (record) => record.product_id === productId && record.ended_at === '',
  );
  return open.at(-1) ?? null;
}

export function planPriceChange(input: {
  productId: string;
  priceCents: number;
  createdBy: string;
  changedAt: string;
  createId: () => string;
  existing: readonly ProductPriceHistoryRecord[];
}): Result<{
  close: ProductPriceHistoryRecord | null;
  open: ProductPriceHistoryRecord;
}> {
  if (!validId(input.productId) || !validId(input.createdBy)) {
    return err(INVALID_ID_ERROR);
  }
  const price = parseCents(input.priceCents);
  if (!price.ok) {
    return err(price.error);
  }

  const current = currentPriceHistory(input.existing, input.productId);
  if (current && current.price_cents === String(price.data)) {
    return ok({ close: null, open: current });
  }

  return ok({
    close: current ? { ...current, ended_at: input.changedAt } : null,
    open: {
      id: input.createId(),
      product_id: input.productId,
      price_cents: String(price.data),
      started_at: input.changedAt,
      ended_at: '',
      created_by: input.createdBy,
    },
  });
}
