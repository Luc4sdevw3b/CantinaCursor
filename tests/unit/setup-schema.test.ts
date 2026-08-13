import { describe, expect, it } from 'vitest';
import { setupSchema } from '../../src/server/sheets/setup-schema';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';
import {
  BACKUPS_MIGRATION_ID,
  FOUNDATION_MIGRATION_ID,
  OPERATION_REQUESTS_MIGRATION_ID,
  USERS_MIGRATION_ID,
} from '../../src/server/sheets/schema';

describe('setupSchema', () => {
  it('creates foundation sheets idempotently', () => {
    const { spreadsheet, sheets } = createMemorySpreadsheet();
    const input = {
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    };

    const first = setupSchema(input);
    const second = setupSchema(input);

    expect(first).toEqual({
      ok: true,
      data: {
        schemaVersion: 4,
        appliedMigrations: [
          FOUNDATION_MIGRATION_ID,
          OPERATION_REQUESTS_MIGRATION_ID,
          BACKUPS_MIGRATION_ID,
          USERS_MIGRATION_ID,
        ],
      },
    });
    expect(second).toEqual(first);
    expect(sheets.get('_schema_migrations')?.listRows()).toHaveLength(4);
    expect(sheets.get('_meta')?.getHeaders()).toEqual(['key', 'value']);
    expect(sheets.get('_operation_requests')?.getHeaders()).toEqual([
      'request_id',
      'operation_type',
      'result_entity_id',
      'status',
      'created_at',
    ]);
    expect(sheets.get('_backups')?.getHeaders()).toEqual([
      'id',
      'created_at',
      'app_version',
      'schema_version',
      'reason',
      'status',
      'drive_file_id',
    ]);
    expect(sheets.get('_users')?.getHeaders()).toEqual([
      'id',
      'google_subject',
      'role',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_sessions')?.getHeaders()).toEqual([
      'id',
      'user_id',
      'role',
      'created_at',
      'expires_at',
      'revoked',
    ]);
  });

  it('applies only the operation-requests migration when foundation already exists', () => {
    const { spreadsheet, sheets } = createMemorySpreadsheet();
    const meta = spreadsheet.createSheet('_meta');
    meta.setHeaders(['key', 'value']);
    const migrations = spreadsheet.createSheet('_schema_migrations');
    migrations.setHeaders([
      'migration_id',
      'applied_at',
      'app_version',
      'checksum',
      'description',
    ]);
    migrations.appendRow([
      FOUNDATION_MIGRATION_ID,
      '2026-08-13T12:00:00.000Z',
      '0.1.0-dev',
      'meta|schema_migrations',
      'Cria _meta e _schema_migrations',
    ]);

    const result = setupSchema({
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:30:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.appliedMigrations).toEqual([
        FOUNDATION_MIGRATION_ID,
        OPERATION_REQUESTS_MIGRATION_ID,
        BACKUPS_MIGRATION_ID,
        USERS_MIGRATION_ID,
      ]);
    }
    expect(sheets.get('_schema_migrations')?.listRows()).toHaveLength(4);
  });

  it('refuses PROD', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const result = setupSchema({
      environment: 'PROD',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RESET_PROD_FORBIDDEN');
    }
  });

  it('refuses unexpected headers on sheets that already have data', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const meta = spreadsheet.createSheet('_meta');
    meta.setHeaders(['id', 'value']);
    meta.appendRow(['schema_version', '1']);

    const result = setupSchema({
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('HEADER_MISMATCH');
    }
  });

  it('refuses unknown applied migrations', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const meta = spreadsheet.createSheet('_meta');
    meta.setHeaders(['key', 'value']);
    const migrations = spreadsheet.createSheet('_schema_migrations');
    migrations.setHeaders([
      'migration_id',
      'applied_at',
      'app_version',
      'checksum',
      'description',
    ]);
    migrations.appendRow(['999_unknown', '', '', '', '']);

    const result = setupSchema({
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNKNOWN_MIGRATION');
    }
  });

  it('runs the pre-migration hook only when there are pending migrations', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const calls: number[] = [];
    const input = {
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
      beforePendingMigrations: () => {
        calls.push(1);
        return { ok: true as const, data: undefined };
      },
    };

    expect(setupSchema(input).ok).toBe(true);
    expect(setupSchema(input).ok).toBe(true);
    expect(calls).toEqual([1]);
  });
});
