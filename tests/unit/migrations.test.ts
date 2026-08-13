import { describe, expect, it } from 'vitest';
import {
  BACKUPS_MIGRATION,
  FOUNDATION_MIGRATION,
  GUARDIANS_MIGRATION,
  OPERATION_REQUESTS_MIGRATION,
  STUDENTS_MIGRATION,
  PRODUCTS_MIGRATION,
  USERS_MIGRATION,
  pendingMigrations,
} from '../../src/server/sheets/migrations';

describe('migration runner', () => {
  it('plans pending migrations in catalog order', () => {
    expect(pendingMigrations([])).toEqual({
      ok: true,
      data: [
        FOUNDATION_MIGRATION,
        OPERATION_REQUESTS_MIGRATION,
        BACKUPS_MIGRATION,
        USERS_MIGRATION,
        STUDENTS_MIGRATION,
        GUARDIANS_MIGRATION,
        PRODUCTS_MIGRATION,
      ],
    });
    expect(pendingMigrations(['001_foundation'])).toEqual({
      ok: true,
      data: [
        OPERATION_REQUESTS_MIGRATION,
        BACKUPS_MIGRATION,
        USERS_MIGRATION,
        STUDENTS_MIGRATION,
        GUARDIANS_MIGRATION,
        PRODUCTS_MIGRATION,
      ],
    });
  });

  it('is idempotent after all catalog migrations', () => {
    expect(
      pendingMigrations([
        '001_foundation',
        '002_operation_requests',
        '003_backups',
        '004_users',
        '005_students',
        '006_guardians',
        '007_products',
      ]),
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
