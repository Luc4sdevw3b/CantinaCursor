import { err, ok, type Result } from './result';

export const INVALID_PHONE_ERROR = {
  code: 'INVALID_PHONE',
  message: 'Informe um telefone com DDD, só números.',
  retryable: false,
} as const;

export function normalizePhone(value: unknown): Result<string> {
  if (value === null || value === undefined || String(value).trim() === '') {
    return ok('');
  }

  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) {
    return err(INVALID_PHONE_ERROR);
  }
  return ok(digits);
}
