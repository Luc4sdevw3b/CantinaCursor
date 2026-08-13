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
export const GUARDIANS_MIGRATION_ID = '006_guardians';
export const PRODUCTS_MIGRATION_ID = '007_products';
export const INVENTORY_MIGRATION_ID = '008_inventory';
export const SALES_MIGRATION_ID = '009_sales';
export const RECEIVABLES_MIGRATION_ID = '010_receivables';
export const PAYMENTS_MIGRATION_ID = '011_payments';
export const FOUNDATION_SCHEMA_VERSION = 1;
export const CURRENT_SCHEMA_VERSION = 11;

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

export const GUARDIANS_SHEET: SheetSchema = {
  name: '_guardians',
  headers: [
    'id',
    'full_name',
    'phone',
    'whatsapp_enabled',
    'relation_label',
    'active',
    'created_at',
    'updated_at',
  ],
};

export const STUDENT_GUARDIANS_SHEET: SheetSchema = {
  name: '_student_guardians',
  headers: [
    'id',
    'student_id',
    'guardian_id',
    'is_primary',
    'can_use_guardian_credit',
    'auto_settle_debt_from_guardian_credit',
    'active',
    'started_at',
    'ended_at',
    'note',
    'created_at',
  ],
};

export const STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET: SheetSchema = {
  name: '_student_account_authorizations',
  headers: [
    'id',
    'consumer_student_id',
    'account_student_id',
    'can_charge_account',
    'can_use_account_credit',
    'active',
    'authorized_at',
    'revoked_at',
    'created_by',
    'note',
  ],
};

export const SETTINGS_SHEET: SheetSchema = {
  name: '_settings',
  headers: ['key', 'value'],
};

export const PRODUCT_CATEGORIES_SHEET: SheetSchema = {
  name: '_product_categories',
  headers: ['id', 'name', 'sort_order', 'active', 'created_at'],
};

export const PRODUCTS_SHEET: SheetSchema = {
  name: '_products',
  headers: [
    'id',
    'category_id',
    'name',
    'price_cents',
    'discount_allowed',
    'stock_tracked',
    'reservable',
    'active',
    'created_at',
    'updated_at',
  ],
};

export const PRODUCT_PRICE_HISTORY_SHEET: SheetSchema = {
  name: '_product_price_history',
  headers: [
    'id',
    'product_id',
    'price_cents',
    'started_at',
    'ended_at',
    'created_by',
  ],
};

export const AD_HOC_ITEMS_SHEET: SheetSchema = {
  name: '_ad_hoc_items',
  headers: ['id', 'name', 'price_cents', 'created_by', 'created_at'],
};

export const INVENTORY_DAYS_SHEET: SheetSchema = {
  name: '_inventory_days',
  headers: ['id', 'business_date', 'status', 'opened_by', 'opened_at'],
};

export const INVENTORY_OPENING_ITEMS_SHEET: SheetSchema = {
  name: '_inventory_opening_items',
  headers: ['id', 'inventory_day_id', 'product_id', 'opening_quantity'],
};

export const INVENTORY_MOVEMENTS_SHEET: SheetSchema = {
  name: '_inventory_movements',
  headers: [
    'id',
    'inventory_day_id',
    'product_id',
    'kind',
    'quantity_delta',
    'source_type',
    'source_id',
    'created_by',
    'created_at',
    'reason',
  ],
};

export const SALES_SHEET: SheetSchema = {
  name: '_sales',
  headers: [
    'id',
    'consumer_student_id',
    'charged_student_id',
    'status',
    'gross_total_cents',
    'discount_total_cents',
    'net_total_cents',
    'source_reservation_id',
    'created_by',
    'created_at',
    'reversal_id',
  ],
};

export const SALE_ITEMS_SHEET: SheetSchema = {
  name: '_sale_items',
  headers: [
    'id',
    'sale_id',
    'product_id',
    'item_kind',
    'description_snapshot',
    'quantity',
    'unit_price_cents',
    'discount_kind',
    'discount_input',
    'discount_amount_cents',
    'line_net_total_cents',
  ],
};

export const SALE_SETTLEMENTS_SHEET: SheetSchema = {
  name: '_sale_settlements',
  headers: [
    'id',
    'sale_id',
    'kind',
    'amount_cents',
    'related_entity_id',
    'created_at',
  ],
};

export const RECEIVABLES_SHEET: SheetSchema = {
  name: '_receivables',
  headers: [
    'id',
    'charged_student_id',
    'source_sale_id',
    'due_date',
    'status',
    'created_by',
    'created_at',
  ],
};

export const RECEIVABLE_CHARGES_SHEET: SheetSchema = {
  name: '_receivable_charges',
  headers: [
    'id',
    'receivable_id',
    'kind',
    'amount_cents',
    'reason_code',
    'note',
    'created_by',
    'created_at',
    'reversal_id',
  ],
};

export const RECEIVABLE_DUE_DATE_HISTORY_SHEET: SheetSchema = {
  name: '_receivable_due_date_history',
  headers: [
    'receivable_id',
    'old_due_date',
    'new_due_date',
    'reason',
    'changed_by',
    'changed_at',
  ],
};

export const PAYMENTS_SHEET: SheetSchema = {
  name: '_payments',
  headers: [
    'id',
    'payer_guardian_id',
    'payer_student_id',
    'method',
    'amount_received_cents',
    'status',
    'created_by',
    'created_at',
    'note',
  ],
};

export const PAYMENT_ALLOCATIONS_SHEET: SheetSchema = {
  name: '_payment_allocations',
  headers: ['payment_id', 'receivable_id', 'student_id', 'amount_cents'],
};
