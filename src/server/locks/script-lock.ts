import { err, type Result } from '../../domain/result';

export const SCRIPT_LOCK_TIMEOUT_MS = 30_000;

export const LOCK_TIMEOUT_ERROR = {
  code: 'LOCK_TIMEOUT',
  message: 'Não foi possível obter o lock. Tente de novo.',
  retryable: true,
} as const;

export interface ScriptLockPort {
  tryLock(timeoutMs: number): boolean;
  releaseLock(): void;
}

export function withScriptLock<T>(
  lock: ScriptLockPort,
  run: () => Result<T>,
  timeoutMs = SCRIPT_LOCK_TIMEOUT_MS,
): Result<T> {
  if (!lock.tryLock(timeoutMs)) {
    return err(LOCK_TIMEOUT_ERROR);
  }

  try {
    return run();
  } finally {
    lock.releaseLock();
  }
}
