import { err, ok, type Result } from './result';

const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const INVALID_CIVIL_DATE_ERROR = {
  code: 'INVALID_CIVIL_DATE',
  message: 'Use uma data civil no formato AAAA-MM-DD.',
  retryable: false,
} as const;

export function isCivilDate(value: string): boolean {
  const match = CIVIL_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function parseCivilDate(value: unknown): Result<string> {
  if (typeof value !== 'string' || !isCivilDate(value)) {
    return err(INVALID_CIVIL_DATE_ERROR);
  }
  return ok(value);
}

export function civilDateFromTimestamp(isoOrCivil: string): string {
  return isoOrCivil.slice(0, 10);
}

export function civilYear(civilDate: string): number {
  return Number(civilDate.slice(0, 4));
}
