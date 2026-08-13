import { parseCents } from './money';
import { normalizePersonName } from './person-name';
import { err, ok, type Result } from './result';

export interface AdHocItemInput {
  name: unknown;
  priceCents: unknown;
}

export interface AdHocItemRecord {
  name: string;
  price_cents: string;
}

export const AD_HOC_NAME_REQUIRED_ERROR = {
  code: 'AD_HOC_NAME_REQUIRED',
  message: 'Informe o nome do item avulso.',
  retryable: false,
} as const;

export function validateAdHocItem(
  input: AdHocItemInput,
): Result<AdHocItemRecord> {
  const name =
    typeof input.name === 'string' ? normalizePersonName(input.name) : '';
  if (name.length < 2) {
    return err(AD_HOC_NAME_REQUIRED_ERROR);
  }
  const price = parseCents(input.priceCents);
  if (!price.ok) {
    return err(price.error);
  }
  return ok({
    name,
    price_cents: String(price.data),
  });
}
