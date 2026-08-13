import { err, ok, type Result } from './result';

export const INVALID_CENTS_ERROR = {
  code: 'INVALID_CENTS',
  message: 'O preço precisa ser um valor em centavos, número inteiro.',
  retryable: false,
} as const;

export function parseCents(value: unknown): Result<number> {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return ok(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return ok(Number(value.trim()));
  }
  return err(INVALID_CENTS_ERROR);
}

export function parseReaisToCents(value: unknown): Result<number> {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return ok(value * 100);
  }
  if (typeof value !== 'string') {
    return err(INVALID_CENTS_ERROR);
  }
  const trimmed = value.trim().replace(/\s/g, '');
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(trimmed);
  if (!match) {
    return err(INVALID_CENTS_ERROR);
  }
  const reais = Number(match[1]);
  const fraction = (match[2] ?? '').padEnd(2, '0');
  return ok(reais * 100 + Number(fraction));
}

export function percentAmount(cents: number, percent: number): number {
  if (!Number.isInteger(cents) || cents < 0 || !Number.isInteger(percent)) {
    return 0;
  }
  return Math.trunc((cents * percent + 50) / 100);
}

export function formatBrl(cents: number): string {
  const safe = Number.isInteger(cents) && cents >= 0 ? cents : 0;
  const reais = Math.floor(safe / 100);
  const fraction = String(safe % 100).padStart(2, '0');
  return `R$ ${reais},${fraction}`;
}
