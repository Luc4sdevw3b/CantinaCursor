import { err, ok, type Result } from './result';
import { DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE } from './age';

export const REQUIRE_GUARDIAN_BELOW_AGE_KEY = 'require_guardian_below_age';

export const INVALID_GUARDIAN_AGE_SETTING_ERROR = {
  code: 'INVALID_GUARDIAN_AGE_SETTING',
  message: 'A idade para pedir responsável deve ser um número entre 1 e 21.',
  retryable: false,
} as const;

export function parseRequireGuardianBelowAge(value: unknown): Result<number> {
  const age = Number(value);
  if (!Number.isInteger(age) || age < 1 || age > 21) {
    return err(INVALID_GUARDIAN_AGE_SETTING_ERROR);
  }
  return ok(age);
}

export function requireGuardianBelowAgeOrDefault(value: unknown): number {
  const parsed = parseRequireGuardianBelowAge(value);
  return parsed.ok ? parsed.data : DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE;
}
