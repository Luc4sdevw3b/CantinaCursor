import { err, ok, type Result } from './result';

export const INVALID_QUANTITY_ERROR = {
  code: 'INVALID_QUANTITY',
  message: 'A quantidade precisa ser um número inteiro.',
  retryable: false,
} as const;

export const INVALID_OPENING_QUANTITY_ERROR = {
  code: 'INVALID_OPENING_QUANTITY',
  message: 'A quantidade inicial precisa ser um número inteiro, zero ou maior.',
  retryable: false,
} as const;

export const INVALID_QUANTITY_DELTA_ERROR = {
  code: 'INVALID_QUANTITY_DELTA',
  message: 'O ajuste precisa ser um número inteiro diferente de zero.',
  retryable: false,
} as const;

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

export function parseOpeningQuantity(value: unknown): Result<number> {
  const parsed = parseInteger(value);
  if (parsed === null || parsed < 0) {
    return err(INVALID_OPENING_QUANTITY_ERROR);
  }
  return ok(parsed);
}

export function parseQuantityDelta(value: unknown): Result<number> {
  const parsed = parseInteger(value);
  if (parsed === null || parsed === 0) {
    return err(INVALID_QUANTITY_DELTA_ERROR);
  }
  return ok(parsed);
}

export function parseQuantity(value: unknown): Result<number> {
  const parsed = parseInteger(value);
  if (parsed === null) {
    return err(INVALID_QUANTITY_ERROR);
  }
  return ok(parsed);
}
