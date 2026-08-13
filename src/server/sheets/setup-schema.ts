import { RESET_PROD_FORBIDDEN_ERROR } from '../../domain/e2e-lifecycle';
import { err, ok, type Result } from '../../domain/result';
import { pendingMigrations } from './migrations';
import {
  FOUNDATION_MIGRATION_ID,
  FOUNDATION_SCHEMA_VERSION,
  META_SHEET,
  SCHEMA_MIGRATIONS_SHEET,
} from './schema';
import { deserializeRecord, serializeRecord } from './serialize';
import { ensureSheet } from './ensure-sheet';
import type { SpreadsheetPort } from './sheet-port';

export interface SetupSchemaInput {
  environment: string | null | undefined;
  appVersion: string;
  nowIso: string;
  spreadsheet: SpreadsheetPort;
}

export interface SetupSchemaResult {
  schemaVersion: number;
  appliedMigrations: string[];
}

function listAppliedMigrationIds(rows: string[][]): string[] {
  return rows
    .map((row) => deserializeRecord(SCHEMA_MIGRATIONS_SHEET.headers, row))
    .map((record) => record.migration_id)
    .filter((id): id is string => Boolean(id));
}

export function setupSchema(
  input: SetupSchemaInput,
): Result<SetupSchemaResult> {
  if (input.environment === 'PROD') {
    return err(RESET_PROD_FORBIDDEN_ERROR);
  }

  const meta = ensureSheet(input.spreadsheet, META_SHEET);
  if (!meta.ok) {
    return err(meta.error);
  }

  const migrations = ensureSheet(input.spreadsheet, SCHEMA_MIGRATIONS_SHEET);
  if (!migrations.ok) {
    return err(migrations.error);
  }

  const appliedIds = listAppliedMigrationIds(migrations.data.listRows());
  const pending = pendingMigrations(appliedIds);
  if (!pending.ok) {
    return err(pending.error);
  }

  for (const migration of pending.data) {
    if (migration.id === FOUNDATION_MIGRATION_ID) {
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: String(FOUNDATION_SCHEMA_VERSION),
        }),
      );
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'app_version',
          value: input.appVersion,
        }),
      );
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'environment',
          value: String(input.environment ?? ''),
        }),
      );
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'created_at',
          value: input.nowIso,
        }),
      );
    }

    migrations.data.appendRow(
      serializeRecord(SCHEMA_MIGRATIONS_SHEET.headers, {
        migration_id: migration.id,
        applied_at: input.nowIso,
        app_version: input.appVersion,
        checksum: migration.checksum,
        description: migration.description,
      }),
    );
  }

  return ok({
    schemaVersion: FOUNDATION_SCHEMA_VERSION,
    appliedMigrations: listAppliedMigrationIds(migrations.data.listRows()),
  });
}
