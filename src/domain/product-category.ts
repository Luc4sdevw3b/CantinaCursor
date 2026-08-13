import { normalizePersonName } from './person-name';
import { err, ok, type Result } from './result';

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Salgados',
  'Bebidas',
  'Doces',
  'Outros',
] as const;

export const CATEGORY_NAME_REQUIRED_ERROR = {
  code: 'CATEGORY_NAME_REQUIRED',
  message: 'Informe o nome da categoria.',
  retryable: false,
} as const;

export function validateCategoryName(value: unknown): Result<string> {
  const name = typeof value === 'string' ? normalizePersonName(value) : '';
  if (name.length < 2) {
    return err(CATEGORY_NAME_REQUIRED_ERROR);
  }
  return ok(name);
}
