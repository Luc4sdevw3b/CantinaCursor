import { describe, expect, it } from 'vitest';
import {
  FOUNDATION_MIGRATION,
  pendingMigrations,
} from '../../src/server/sheets/migrations';

describe('migration runner', () => {
  it('plans the foundation migration when none is applied', () => {
    expect(pendingMigrations([])).toEqual({
      ok: true,
      data: [FOUNDATION_MIGRATION],
    });
  });

  it('is idempotent after the foundation migration', () => {
    expect(pendingMigrations(['001_foundation'])).toEqual({
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
