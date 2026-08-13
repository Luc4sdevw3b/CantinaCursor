import type { ScriptLockPort } from './script-lock';

export function createMemoryLock(
  options: { acquire?: boolean } = {},
): ScriptLockPort & { held: boolean; acquireCount: number } {
  const lock = {
    held: false,
    acquireCount: 0,
    tryLock(timeoutMs: number): boolean {
      void timeoutMs;
      if (options.acquire === false) {
        return false;
      }
      if (lock.held) {
        return false;
      }
      lock.held = true;
      lock.acquireCount += 1;
      return true;
    },
    releaseLock(): void {
      lock.held = false;
    },
  };

  return lock;
}
