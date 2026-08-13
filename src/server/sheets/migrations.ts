import { err, ok, type Result } from '../../domain/result';
import { checksumHeaders } from './serialize';
import {
  BACKUPS_MIGRATION_ID,
  BACKUPS_SHEET,
  FOUNDATION_MIGRATION_ID,
  OPERATION_REQUESTS_MIGRATION_ID,
  OPERATION_REQUESTS_SHEET,
  SESSIONS_SHEET,
  USERS_MIGRATION_ID,
  USERS_SHEET,
} from './schema';

export interface Migration {
  id: string;
  description: string;
  checksum: string;
}

export const FOUNDATION_MIGRATION: Migration = {
  id: FOUNDATION_MIGRATION_ID,
  description: 'Cria _meta e _schema_migrations',
  checksum: 'meta|schema_migrations',
};

export const OPERATION_REQUESTS_MIGRATION: Migration = {
  id: OPERATION_REQUESTS_MIGRATION_ID,
  description: 'Cria _operation_requests',
  checksum: checksumHeaders(OPERATION_REQUESTS_SHEET.headers),
};

export const BACKUPS_MIGRATION: Migration = {
  id: BACKUPS_MIGRATION_ID,
  description: 'Cria _backups',
  checksum: checksumHeaders(BACKUPS_SHEET.headers),
};

export const USERS_MIGRATION: Migration = {
  id: USERS_MIGRATION_ID,
  description: 'Cria _users e _sessions',
  checksum: checksumHeaders([
    ...USERS_SHEET.headers,
    ...SESSIONS_SHEET.headers,
  ]),
};

export const MIGRATION_CATALOG: readonly Migration[] = [
  FOUNDATION_MIGRATION,
  OPERATION_REQUESTS_MIGRATION,
  BACKUPS_MIGRATION,
  USERS_MIGRATION,
];

export function pendingMigrations(
  appliedIds: readonly string[],
  catalog: readonly Migration[] = MIGRATION_CATALOG,
): Result<Migration[]> {
  const applied = new Set(appliedIds);
  const pending = catalog.filter((migration) => !applied.has(migration.id));

  if (
    appliedIds.some((id) => !catalog.some((migration) => migration.id === id))
  ) {
    return err({
      code: 'UNKNOWN_MIGRATION',
      message: 'Há migration aplicada que não existe no catálogo.',
      retryable: false,
    });
  }

  return ok(pending);
}
