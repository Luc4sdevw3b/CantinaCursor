export interface SheetSchema {
  name: string;
  headers: readonly string[];
}

export const META_SHEET: SheetSchema = {
  name: '_meta',
  headers: ['key', 'value'],
};

export const SCHEMA_MIGRATIONS_SHEET: SheetSchema = {
  name: '_schema_migrations',
  headers: [
    'migration_id',
    'applied_at',
    'app_version',
    'checksum',
    'description',
  ],
};

export const FOUNDATION_SHEETS: readonly SheetSchema[] = [
  META_SHEET,
  SCHEMA_MIGRATIONS_SHEET,
];

export const OPERATION_REQUESTS_SHEET: SheetSchema = {
  name: '_operation_requests',
  headers: [
    'request_id',
    'operation_type',
    'result_entity_id',
    'status',
    'created_at',
  ],
};

export const BACKUPS_SHEET: SheetSchema = {
  name: '_backups',
  headers: [
    'id',
    'created_at',
    'app_version',
    'schema_version',
    'reason',
    'status',
    'drive_file_id',
  ],
};

export const FOUNDATION_MIGRATION_ID = '001_foundation';
export const OPERATION_REQUESTS_MIGRATION_ID = '002_operation_requests';
export const BACKUPS_MIGRATION_ID = '003_backups';
export const FOUNDATION_SCHEMA_VERSION = 1;
export const CURRENT_SCHEMA_VERSION = 3;
