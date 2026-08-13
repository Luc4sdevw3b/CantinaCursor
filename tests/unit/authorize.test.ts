import { describe, expect, it } from 'vitest';
import { authorize } from '../../src/domain/authorize';

describe('authorize', () => {
  it('allows owner on privileged actions and staff only on probe', () => {
    expect(authorize('owner', 'e2e.reset').ok).toBe(true);
    expect(authorize('owner', 'backup.restore').ok).toBe(true);
    expect(authorize('staff', 'e2e.probe').ok).toBe(true);
  });

  it('rejects missing role and staff on owner-only actions', () => {
    const anonymous = authorize(null, 'e2e.probe');
    const staffReset = authorize('staff', 'e2e.reset');
    const staffBackup = authorize('staff', 'backup.run');

    expect(anonymous.ok).toBe(false);
    if (!anonymous.ok) {
      expect(anonymous.error.code).toBe('UNAUTHENTICATED');
    }
    expect(staffReset.ok).toBe(false);
    if (!staffReset.ok) {
      expect(staffReset.error.code).toBe('FORBIDDEN');
    }
    expect(staffBackup.ok).toBe(false);
    if (!staffBackup.ok) {
      expect(staffBackup.error.code).toBe('FORBIDDEN');
    }
  });
});
