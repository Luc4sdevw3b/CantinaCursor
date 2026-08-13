import { describe, expect, it } from 'vitest';
import { authorize } from '../../src/domain/authorize';

describe('authorize', () => {
  it('allows owner on privileged actions and staff only on probe', () => {
    expect(authorize('owner', 'e2e.reset').ok).toBe(true);
    expect(authorize('owner', 'backup.restore').ok).toBe(true);
    expect(authorize('staff', 'students.write').ok).toBe(true);
    expect(authorize('staff', 'guardians.write').ok).toBe(true);
    expect(authorize('staff', 'products.write').ok).toBe(true);
    expect(authorize('staff', 'e2e.probe').ok).toBe(true);
    expect(authorize('owner', 'settings.manage').ok).toBe(true);
    expect(authorize('owner', 'ad_hoc.create').ok).toBe(true);
    expect(authorize('staff', 'inventory.read').ok).toBe(true);
    expect(authorize('owner', 'inventory.open').ok).toBe(true);
    expect(authorize('staff', 'sales.write').ok).toBe(true);
  });

  it('rejects missing role and staff on owner-only actions', () => {
    const anonymous = authorize(null, 'e2e.probe');
    const staffReset = authorize('staff', 'e2e.reset');
    const staffBackup = authorize('staff', 'backup.run');
    const staffSettings = authorize('staff', 'settings.manage');
    const staffAdHoc = authorize('staff', 'ad_hoc.create');
    const staffOpen = authorize('staff', 'inventory.open');
    const staffAdjust = authorize('staff', 'inventory.adjust');

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
    expect(staffSettings.ok).toBe(false);
    if (!staffSettings.ok) {
      expect(staffSettings.error.code).toBe('FORBIDDEN');
    }
    expect(staffAdHoc.ok).toBe(false);
    if (!staffAdHoc.ok) {
      expect(staffAdHoc.error.code).toBe('FORBIDDEN');
    }
    expect(staffOpen.ok).toBe(false);
    if (!staffOpen.ok) {
      expect(staffOpen.error.code).toBe('FORBIDDEN');
    }
    expect(staffAdjust.ok).toBe(false);
    if (!staffAdjust.ok) {
      expect(staffAdjust.error.code).toBe('FORBIDDEN');
    }
  });
});
