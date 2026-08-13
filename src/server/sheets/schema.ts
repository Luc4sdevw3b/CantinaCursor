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
export const USERS_MIGRATION_ID = '004_users';
export const STUDENTS_MIGRATION_ID = '005_students';
export const FOUNDATION_SCHEMA_VERSION = 1;
export const CURRENT_SCHEMA_VERSION = 5;

export const USERS_SHEET: SheetSchema = {
  name: '_users',
  headers: ['id', 'google_subject', 'role', 'active', 'created_at'],
};

export const SESSIONS_SHEET: SheetSchema = {
  name: '_sessions',
  headers: ['id', 'user_id', 'role', 'created_at', 'expires_at', 'revoked'],
};

export const SCHOOL_YEARS_SHEET: SheetSchema = {
  name: '_school_years',
  headers: ['id', 'label', 'started_on', 'ended_on', 'active', 'created_at'],
};

export const CLASSROOMS_SHEET: SheetSchema = {
  name: '_classrooms',
  headers: ['id', 'school_year_id', 'name', 'active', 'created_at'],
};

export const STUDENTS_SHEET: SheetSchema = {
  name: '_students',
  headers: [
    'id',
    'full_name',
    'birth_date',
    'approximate_age',
    'approximate_age_reference_year',
    'active',
    'created_at',
    'updated_at',
  ],
};

export const STUDENT_ENROLLMENTS_SHEET: SheetSchema = {
  name: '_student_enrollments',
  headers: [
    'id',
    'student_id',
    'classroom_id',
    'started_on',
    'ended_on',
    'created_by',
    'created_at',
  ],
};
