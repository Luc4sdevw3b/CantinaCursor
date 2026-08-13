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

const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

function utcFromCivil(civilDate: string): Date {
  const year = Number(civilDate.slice(0, 4));
  const month = Number(civilDate.slice(5, 7));
  const day = Number(civilDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day));
}

export function addCivilDays(civilDate: string, days: number): string {
  const utc = utcFromCivil(civilDate);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function nextFriday(civilDate: string): string {
  const utc = utcFromCivil(civilDate);
  const weekday = utc.getUTCDay();
  const delta = weekday === 5 ? 7 : (5 - weekday + 7) % 7;
  return addCivilDays(civilDate, delta);
}

export function formatCivilDisplay(civilDate: string): string {
  if (!isCivilDate(civilDate)) {
    return civilDate;
  }
  const utc = utcFromCivil(civilDate);
  const weekday = WEEKDAY_LABELS[utc.getUTCDay()];
  const day = civilDate.slice(8, 10);
  const month = civilDate.slice(5, 7);
  const year = civilDate.slice(2, 4);
  return `${weekday} • ${day}/${month}/${year}`;
}

export type AgendaBucket = 'overdue' | 'today' | 'upcoming';

export function agendaBucket(
  dueDate: string,
  todayCivil: string,
): AgendaBucket {
  if (dueDate < todayCivil) {
    return 'overdue';
  }
  if (dueDate === todayCivil) {
    return 'today';
  }
  return 'upcoming';
}

export function dueDateShortcuts(todayCivil: string): {
  today: string;
  tomorrow: string;
  nextFriday: string;
  plus7: string;
} {
  return {
    today: todayCivil,
    tomorrow: addCivilDays(todayCivil, 1),
    nextFriday: nextFriday(todayCivil),
    plus7: addCivilDays(todayCivil, 7),
  };
}

export function todayCivilSaoPaulo(now: Date | string = new Date()): string {
  const date = typeof now === 'string' ? new Date(now) : now;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}
