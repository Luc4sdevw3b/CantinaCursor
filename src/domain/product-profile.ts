import { isImmutableId, isSheetRowNumber } from './ids';
import { parseCents } from './money';
import { normalizePersonName } from './person-name';
import { err, ok, type Result } from './result';

export interface ProductProfileInput {
  name: unknown;
  categoryId: unknown;
  priceCents: unknown;
  discountAllowed?: unknown;
  stockTracked?: unknown;
  reservable?: unknown;
}

export interface ProductProfile {
  name: string;
  category_id: string;
  price_cents: string;
  discount_allowed: string;
  stock_tracked: string;
  reservable: string;
}

export const PRODUCT_NAME_REQUIRED_ERROR = {
  code: 'PRODUCT_NAME_REQUIRED',
  message: 'Informe o nome do produto.',
  retryable: false,
} as const;

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

export function validateProductProfile(
  input: ProductProfileInput,
): Result<ProductProfile> {
  const name =
    typeof input.name === 'string' ? normalizePersonName(input.name) : '';
  if (name.length < 2) {
    return err(PRODUCT_NAME_REQUIRED_ERROR);
  }

  const categoryId =
    typeof input.categoryId === 'string' ? input.categoryId : '';
  if (isSheetRowNumber(categoryId) || !isImmutableId(categoryId)) {
    return err(INVALID_ID_ERROR);
  }

  const price = parseCents(input.priceCents);
  if (!price.ok) {
    return err(price.error);
  }

  return ok({
    name,
    category_id: categoryId,
    price_cents: String(price.data),
    discount_allowed: input.discountAllowed === true ? 'true' : 'false',
    stock_tracked: input.stockTracked === false ? 'false' : 'true',
    reservable: input.reservable === true ? 'true' : 'false',
  });
}
