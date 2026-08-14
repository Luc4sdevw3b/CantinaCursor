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

export const CATEGORY_HAS_ACTIVE_PRODUCTS_ERROR = {
  code: 'CATEGORY_HAS_ACTIVE_PRODUCTS',
  message:
    'Não é possível inativar a categoria enquanto houver produtos ativos nela.',
  retryable: false,
} as const;

export const CATEGORY_HAS_PRODUCTS_ERROR = {
  code: 'CATEGORY_HAS_PRODUCTS',
  message: 'Não é possível excluir a categoria enquanto houver produtos nela.',
  retryable: false,
} as const;

export const PRODUCT_IN_USE_ERROR = {
  code: 'PRODUCT_IN_USE',
  message:
    'Não é possível excluir o produto porque ele já entrou em venda, estoque ou reserva. Inative-o.',
  retryable: false,
} as const;

export function validateCategoryName(value: unknown): Result<string> {
  const name = typeof value === 'string' ? normalizePersonName(value) : '';
  if (name.length < 2) {
    return err(CATEGORY_NAME_REQUIRED_ERROR);
  }
  return ok(name);
}
