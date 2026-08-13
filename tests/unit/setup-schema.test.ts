import { describe, expect, it } from 'vitest';
import { setupSchema } from '../../src/server/sheets/setup-schema';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';
import {
  FOUNDATION_MIGRATION_ID,
  OPERATION_REQUESTS_MIGRATION_ID,
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
        schemaVersion: 2,
        appliedMigrations: [
          FOUNDATION_MIGRATION_ID,
          OPERATION_REQUESTS_MIGRATION_ID,
        ],
      },
    });
    expect(second).toEqual(first);
    expect(sheets.get('_schema_migrations')?.listRows()).toHaveLength(2);
    expect(sheets.get('_meta')?.getHeaders()).toEqual(['key', 'value']);
    expect(sheets.get('_operation_requests')?.getHeaders()).toEqual([
      'request_id',
      'operation_type',
      'result_entity_id',
      'status',
      'created_at',
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
      ]);
    }
    expect(sheets.get('_schema_migrations')?.listRows()).toHaveLength(2);
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
});
