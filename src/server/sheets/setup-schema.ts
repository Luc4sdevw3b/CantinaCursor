import { DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE } from '../../domain/age';
import { RESET_PROD_FORBIDDEN_ERROR } from '../../domain/e2e-lifecycle';
import { REQUIRE_GUARDIAN_BELOW_AGE_KEY } from '../../domain/guardian-setting';
import { err, ok, type Result } from '../../domain/result';
import { pendingMigrations } from './migrations';
import {
  BACKUPS_MIGRATION_ID,
  BACKUPS_SHEET,
  CLASSROOMS_SHEET,
  CURRENT_SCHEMA_VERSION,
  FOUNDATION_MIGRATION_ID,
  FOUNDATION_SCHEMA_VERSION,
  GUARDIANS_MIGRATION_ID,
  GUARDIANS_SHEET,
  META_SHEET,
  OPERATION_REQUESTS_MIGRATION_ID,
  OPERATION_REQUESTS_SHEET,
  SCHEMA_MIGRATIONS_SHEET,
  SCHOOL_YEARS_SHEET,
  SESSIONS_SHEET,
  SETTINGS_SHEET,
  STUDENTS_MIGRATION_ID,
  STUDENTS_SHEET,
  STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
  STUDENT_ENROLLMENTS_SHEET,
  STUDENT_GUARDIANS_SHEET,
  USERS_MIGRATION_ID,
  USERS_SHEET,
  PRODUCTS_MIGRATION_ID,
  PRODUCT_CATEGORIES_SHEET,
  PRODUCTS_SHEET,
  PRODUCT_PRICE_HISTORY_SHEET,
  AD_HOC_ITEMS_SHEET,
  INVENTORY_MIGRATION_ID,
  INVENTORY_DAYS_SHEET,
  INVENTORY_OPENING_ITEMS_SHEET,
  INVENTORY_MOVEMENTS_SHEET,
} from './schema';
import { deserializeRecord, serializeRecord } from './serialize';
import { ensureSheet } from './ensure-sheet';
import type { SpreadsheetPort } from './sheet-port';

export interface SetupSchemaInput {
  environment: string | null | undefined;
  appVersion: string;
  nowIso: string;
  spreadsheet: SpreadsheetPort;
  beforePendingMigrations?: () => Result<void>;
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

  if (pending.data.length > 0 && input.beforePendingMigrations) {
    const prepared = input.beforePendingMigrations();
    if (!prepared.ok) {
      return err(prepared.error);
    }
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

    if (migration.id === OPERATION_REQUESTS_MIGRATION_ID) {
      const operations = ensureSheet(
        input.spreadsheet,
        OPERATION_REQUESTS_SHEET,
      );
      if (!operations.ok) {
        return err(operations.error);
      }
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: '2',
        }),
      );
    }

    if (migration.id === BACKUPS_MIGRATION_ID) {
      const backups = ensureSheet(input.spreadsheet, BACKUPS_SHEET);
      if (!backups.ok) {
        return err(backups.error);
      }
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: '3',
        }),
      );
    }

    if (migration.id === USERS_MIGRATION_ID) {
      const users = ensureSheet(input.spreadsheet, USERS_SHEET);
      if (!users.ok) {
        return err(users.error);
      }
      const sessions = ensureSheet(input.spreadsheet, SESSIONS_SHEET);
      if (!sessions.ok) {
        return err(sessions.error);
      }
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: '4',
        }),
      );
    }

    if (migration.id === STUDENTS_MIGRATION_ID) {
      const years = ensureSheet(input.spreadsheet, SCHOOL_YEARS_SHEET);
      if (!years.ok) {
        return err(years.error);
      }
      const classrooms = ensureSheet(input.spreadsheet, CLASSROOMS_SHEET);
      if (!classrooms.ok) {
        return err(classrooms.error);
      }
      const students = ensureSheet(input.spreadsheet, STUDENTS_SHEET);
      if (!students.ok) {
        return err(students.error);
      }
      const enrollments = ensureSheet(
        input.spreadsheet,
        STUDENT_ENROLLMENTS_SHEET,
      );
      if (!enrollments.ok) {
        return err(enrollments.error);
      }
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: '5',
        }),
      );
    }

    if (migration.id === GUARDIANS_MIGRATION_ID) {
      const guardians = ensureSheet(input.spreadsheet, GUARDIANS_SHEET);
      if (!guardians.ok) {
        return err(guardians.error);
      }
      const links = ensureSheet(input.spreadsheet, STUDENT_GUARDIANS_SHEET);
      if (!links.ok) {
        return err(links.error);
      }
      const authorizations = ensureSheet(
        input.spreadsheet,
        STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
      );
      if (!authorizations.ok) {
        return err(authorizations.error);
      }
      const settings = ensureSheet(input.spreadsheet, SETTINGS_SHEET);
      if (!settings.ok) {
        return err(settings.error);
      }
      settings.data.appendRow(
        serializeRecord(SETTINGS_SHEET.headers, {
          key: REQUIRE_GUARDIAN_BELOW_AGE_KEY,
          value: String(DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE),
        }),
      );
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: '6',
        }),
      );
    }

    if (migration.id === PRODUCTS_MIGRATION_ID) {
      const categories = ensureSheet(
        input.spreadsheet,
        PRODUCT_CATEGORIES_SHEET,
      );
      if (!categories.ok) {
        return err(categories.error);
      }
      const products = ensureSheet(input.spreadsheet, PRODUCTS_SHEET);
      if (!products.ok) {
        return err(products.error);
      }
      const history = ensureSheet(
        input.spreadsheet,
        PRODUCT_PRICE_HISTORY_SHEET,
      );
      if (!history.ok) {
        return err(history.error);
      }
      const adHoc = ensureSheet(input.spreadsheet, AD_HOC_ITEMS_SHEET);
      if (!adHoc.ok) {
        return err(adHoc.error);
      }
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: '7',
        }),
      );
    }

    if (migration.id === INVENTORY_MIGRATION_ID) {
      const days = ensureSheet(input.spreadsheet, INVENTORY_DAYS_SHEET);
      if (!days.ok) {
        return err(days.error);
      }
      const openings = ensureSheet(
        input.spreadsheet,
        INVENTORY_OPENING_ITEMS_SHEET,
      );
      if (!openings.ok) {
        return err(openings.error);
      }
      const movements = ensureSheet(
        input.spreadsheet,
        INVENTORY_MOVEMENTS_SHEET,
      );
      if (!movements.ok) {
        return err(movements.error);
      }
      meta.data.appendRow(
        serializeRecord(META_SHEET.headers, {
          key: 'schema_version',
          value: String(CURRENT_SCHEMA_VERSION),
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
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appliedMigrations: listAppliedMigrationIds(migrations.data.listRows()),
  });
}
