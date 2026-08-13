import { describe, expect, it } from 'vitest';
import {
  FOUNDATION_MIGRATION,
  OPERATION_REQUESTS_MIGRATION,
  pendingMigrations,
} from '../../src/server/sheets/migrations';

describe('migration runner', () => {
  it('plans pending migrations in catalog order', () => {
    expect(pendingMigrations([])).toEqual({
      ok: true,
      data: [FOUNDATION_MIGRATION, OPERATION_REQUESTS_MIGRATION],
    });
    expect(pendingMigrations(['001_foundation'])).toEqual({
      ok: true,
      data: [OPERATION_REQUESTS_MIGRATION],
    });
  });

  it('is idempotent after all catalog migrations', () => {
    expect(
      pendingMigrations(['001_foundation', '002_operation_requests']),
    ).toEqual({
      ok: true,
      data: [],
    });
  });

  it('refuses unknown applied migrations', () => {
    const result = pendingMigrations(['999_unknown']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNKNOWN_MIGRATION');
    }
  });
});
