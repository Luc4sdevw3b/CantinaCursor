import { describe, expect, it } from 'vitest';
import {
  canDeactivate,
  canReactivate,
} from '../../src/domain/reactivate-student';

describe('student reactivation', () => {
  it('requires an explicit review before reactivating', () => {
    expect(canReactivate(false, false)).toEqual({
      ok: false,
      error: {
        code: 'REACTIVATION_REVIEW_REQUIRED',
        message: 'Revise o cadastro antes de reativar.',
        retryable: false,
      },
    });
    expect(canReactivate(false, true).ok).toBe(true);
    expect(canReactivate(true, true).ok).toBe(false);
    expect(canDeactivate(true).ok).toBe(true);
    expect(canDeactivate(false).ok).toBe(false);
  });
});
