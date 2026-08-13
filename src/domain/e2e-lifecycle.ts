import { err, ok, type Result } from './result';

export const E2E_ONLY_ERROR = {
  code: 'E2E_ONLY',
  message: 'Reset e seed só podem rodar no ambiente E2E isolado.',
  retryable: false,
} as const;

export const RESET_PROD_FORBIDDEN_ERROR = {
  code: 'RESET_PROD_FORBIDDEN',
  message: 'Reset e seed nunca podem rodar em PROD.',
  retryable: false,
} as const;

export const E2E_SEED_MARKER = 'cantina-e2e-fictitious';

export function assertE2EEnvironment(
  environment: string | null | undefined,
): Result<void> {
  if (environment === 'PROD') {
    return err(RESET_PROD_FORBIDDEN_ERROR);
  }

  if (environment !== 'E2E') {
    return err(E2E_ONLY_ERROR);
  }

  return ok(undefined);
}

export function resetE2EState(
  environment: string | null | undefined,
): Result<{ reset: true }> {
  const gate = assertE2EEnvironment(environment);
  if (!gate.ok) {
    return err(gate.error);
  }

  return ok({ reset: true });
}

export function seedE2EState(
  environment: string | null | undefined,
): Result<{ marker: string; seeded: true }> {
  const gate = assertE2EEnvironment(environment);
  if (!gate.ok) {
    return err(gate.error);
  }

  return ok({ marker: E2E_SEED_MARKER, seeded: true });
}
