import { describe, expect, it } from 'vitest';
import { ok } from '../../src/domain/result';
import { createMemoryLock } from '../../src/server/locks/memory-lock';
import { withScriptLock } from '../../src/server/locks/script-lock';

describe('withScriptLock', () => {
  it('runs the work while holding the lock and releases afterwards', () => {
    const lock = createMemoryLock();
    let heldDuringRun = false;

    const result = withScriptLock(lock, () => {
      heldDuringRun = lock.held;
      return ok('done');
    });

    expect(heldDuringRun).toBe(true);
    expect(lock.held).toBe(false);
    expect(result).toEqual({ ok: true, data: 'done' });
  });

  it('releases the lock when the work throws', () => {
    const lock = createMemoryLock();

    expect(() =>
      withScriptLock(lock, () => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(lock.held).toBe(false);
  });

  it('returns a retryable lock timeout', () => {
    const lock = createMemoryLock({ acquire: false });
    const result = withScriptLock(lock, () => ok('done'));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('LOCK_TIMEOUT');
      expect(result.error.retryable).toBe(true);
    }
    expect(lock.acquireCount).toBe(0);
  });
});
