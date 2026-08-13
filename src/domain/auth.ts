export const USER_ROLES = ['owner', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_ACTIONS = [
  'e2e.probe',
  'e2e.reset',
  'e2e.seed',
  'backup.run',
  'backup.restore',
  'users.manage',
  'students.read',
  'students.write',
  'school_years.manage',
  'classrooms.manage',
  'guardians.read',
  'guardians.write',
  'settings.manage',
  'products.read',
  'products.write',
  'ad_hoc.create',
  'inventory.read',
  'inventory.open',
  'inventory.adjust',
  'sales.read',
  'sales.write',
  'receivables.read',
  'payments.write',
  'receivables.adjust',
  'credits.read',
  'credits.deposit',
  'credits.refund',
  'cash.read',
  'cash.open',
  'cash.add',
  'cash.remove',
  'cash.close',
  'reversals.read',
  'reversals.write',
] as const;
export type AuthAction = (typeof AUTH_ACTIONS)[number];

export const ACTION_ROLES: Record<AuthAction, readonly UserRole[]> = {
  'e2e.probe': ['owner', 'staff'],
  'e2e.reset': ['owner'],
  'e2e.seed': ['owner'],
  'backup.run': ['owner'],
  'backup.restore': ['owner'],
  'users.manage': ['owner'],
  'students.read': ['owner', 'staff'],
  'students.write': ['owner', 'staff'],
  'school_years.manage': ['owner', 'staff'],
  'classrooms.manage': ['owner', 'staff'],
  'guardians.read': ['owner', 'staff'],
  'guardians.write': ['owner', 'staff'],
  'settings.manage': ['owner'],
  'products.read': ['owner', 'staff'],
  'products.write': ['owner', 'staff'],
  'ad_hoc.create': ['owner'],
  'inventory.read': ['owner', 'staff'],
  'inventory.open': ['owner'],
  'inventory.adjust': ['owner'],
  'sales.read': ['owner', 'staff'],
  'sales.write': ['owner', 'staff'],
  'receivables.read': ['owner', 'staff'],
  'payments.write': ['owner', 'staff'],
  'receivables.adjust': ['owner'],
  'credits.read': ['owner', 'staff'],
  'credits.deposit': ['owner', 'staff'],
  'credits.refund': ['owner'],
  'cash.read': ['owner', 'staff'],
  'cash.open': ['owner'],
  'cash.add': ['owner', 'staff'],
  'cash.remove': ['owner'],
  'cash.close': ['owner'],
  'reversals.read': ['owner', 'staff'],
  'reversals.write': ['owner'],
};

export const E2E_OWNER_SUBJECT = 'e2e-owner';
export const E2E_STAFF_SUBJECT = 'e2e-staff';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}

export function roleLabel(role: UserRole): string {
  return role === 'owner' ? 'Dona' : 'Funcionário';
}
