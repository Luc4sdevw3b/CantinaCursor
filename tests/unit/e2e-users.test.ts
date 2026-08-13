import { describe, expect, it } from 'vitest';
import {
  E2E_FIXTURE_USERS,
  missingE2EUsers,
} from '../../src/server/auth/e2e-users';

describe('E2E fixture users', () => {
  it('creates owner and staff subjects when the sheet is empty', () => {
    expect(missingE2EUsers([])).toEqual(E2E_FIXTURE_USERS);
  });

  it('does not recreate subjects that already exist', () => {
    expect(missingE2EUsers(['e2e-owner'])).toEqual([
      { googleSubject: 'e2e-staff', role: 'staff' },
    ]);
    expect(missingE2EUsers(['e2e-owner', 'e2e-staff'])).toEqual([]);
  });
});
