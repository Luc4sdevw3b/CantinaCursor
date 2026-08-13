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

export const FOUNDATION_MIGRATION_ID = '001_foundation';
export const FOUNDATION_SCHEMA_VERSION = 1;
