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
