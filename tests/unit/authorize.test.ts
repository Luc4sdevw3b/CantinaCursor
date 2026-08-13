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
    expect(authorize('staff', 'receivables.read').ok).toBe(true);
    expect(authorize('staff', 'payments.write').ok).toBe(true);
    expect(authorize('owner', 'receivables.adjust').ok).toBe(true);
    expect(authorize('staff', 'credits.read').ok).toBe(true);
    expect(authorize('staff', 'credits.deposit').ok).toBe(true);
    expect(authorize('owner', 'credits.refund').ok).toBe(true);
    expect(authorize('staff', 'cash.read').ok).toBe(true);
    expect(authorize('owner', 'cash.open').ok).toBe(true);
    expect(authorize('staff', 'cash.add').ok).toBe(true);
    expect(authorize('staff', 'reversals.read').ok).toBe(true);
    expect(authorize('owner', 'reversals.write').ok).toBe(true);
    expect(authorize('staff', 'reservations.read').ok).toBe(true);
    expect(authorize('staff', 'reservations.write').ok).toBe(true);
    expect(authorize('owner', 'reservation_slots.write').ok).toBe(true);
  });

  it('rejects missing role and staff on owner-only actions', () => {
    const anonymous = authorize(null, 'e2e.probe');
    const staffReset = authorize('staff', 'e2e.reset');
    const staffBackup = authorize('staff', 'backup.run');
    const staffSettings = authorize('staff', 'settings.manage');
    const staffAdHoc = authorize('staff', 'ad_hoc.create');
    const staffOpen = authorize('staff', 'inventory.open');
    const staffAdjust = authorize('staff', 'inventory.adjust');
    const staffReceivableAdjust = authorize('staff', 'receivables.adjust');
    const staffCreditRefund = authorize('staff', 'credits.refund');
    const staffCashOpen = authorize('staff', 'cash.open');
    const staffCashRemove = authorize('staff', 'cash.remove');
    const staffCashClose = authorize('staff', 'cash.close');
    const staffReversalWrite = authorize('staff', 'reversals.write');
    const staffSlotWrite = authorize('staff', 'reservation_slots.write');

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
    expect(staffReceivableAdjust.ok).toBe(false);
    if (!staffReceivableAdjust.ok) {
      expect(staffReceivableAdjust.error.code).toBe('FORBIDDEN');
    }
    expect(staffCreditRefund.ok).toBe(false);
    if (!staffCreditRefund.ok) {
      expect(staffCreditRefund.error.code).toBe('FORBIDDEN');
    }
    expect(staffCashOpen.ok).toBe(false);
    if (!staffCashOpen.ok) {
      expect(staffCashOpen.error.code).toBe('FORBIDDEN');
    }
    expect(staffCashRemove.ok).toBe(false);
    if (!staffCashRemove.ok) {
      expect(staffCashRemove.error.code).toBe('FORBIDDEN');
    }
    expect(staffCashClose.ok).toBe(false);
    if (!staffCashClose.ok) {
      expect(staffCashClose.error.code).toBe('FORBIDDEN');
    }
    expect(staffReversalWrite.ok).toBe(false);
    if (!staffReversalWrite.ok) {
      expect(staffReversalWrite.error.code).toBe('FORBIDDEN');
    }
    expect(staffSlotWrite.ok).toBe(false);
    if (!staffSlotWrite.ok) {
      expect(staffSlotWrite.error.code).toBe('FORBIDDEN');
    }
  });
});
