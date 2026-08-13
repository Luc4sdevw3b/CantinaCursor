import { err, ok, type Result } from '../../domain/result';
import { FOUNDATION_MIGRATION_ID } from './schema';

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

export const MIGRATION_CATALOG: readonly Migration[] = [FOUNDATION_MIGRATION];

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
