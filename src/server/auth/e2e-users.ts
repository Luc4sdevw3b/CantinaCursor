import {
  E2E_OWNER_SUBJECT,
  E2E_STAFF_SUBJECT,
  type UserRole,
} from '../../domain/auth';

export const E2E_FIXTURE_USERS: ReadonlyArray<{
  googleSubject: string;
  role: UserRole;
}> = [
  { googleSubject: E2E_OWNER_SUBJECT, role: 'owner' },
  { googleSubject: E2E_STAFF_SUBJECT, role: 'staff' },
];

export function missingE2EUsers(
  existingSubjects: readonly string[],
): Array<{ googleSubject: string; role: UserRole }> {
  const known = new Set(existingSubjects);
  return E2E_FIXTURE_USERS.filter((user) => !known.has(user.googleSubject));
}
