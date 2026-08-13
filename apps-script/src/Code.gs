const CANTINA_APP_NAME = 'Cantina V2 AppScript';
const CANTINA_APP_VERSION = '0.1.0-dev';
const CANTINA_ENVIRONMENT = 'E2E';
const E2E_META_SHEET = '_e2e_meta';
const E2E_SEED_MARKER = 'cantina-e2e-fictitious';
const META_SHEET = '_meta';
const MIGRATIONS_SHEET = '_schema_migrations';
const OPERATION_REQUESTS_SHEET = '_operation_requests';
const META_HEADERS = ['key', 'value'];
const MIGRATION_HEADERS = [
  'migration_id',
  'applied_at',
  'app_version',
  'checksum',
  'description',
];
const OPERATION_REQUESTS_HEADERS = [
  'request_id',
  'operation_type',
  'result_entity_id',
  'status',
  'created_at',
];
const FOUNDATION_MIGRATION_ID = '001_foundation';
const FOUNDATION_MIGRATION_CHECKSUM = 'meta|schema_migrations';
const OPERATION_REQUESTS_MIGRATION_ID = '002_operation_requests';
const OPERATION_REQUESTS_MIGRATION_CHECKSUM =
  'request_id|operation_type|result_entity_id|status|created_at';
const CURRENT_SCHEMA_VERSION = 11;
const BACKUPS_SHEET = '_backups';
const BACKUPS_HEADERS = [
  'id',
  'created_at',
  'app_version',
  'schema_version',
  'reason',
  'status',
  'drive_file_id',
];
const BACKUPS_MIGRATION_ID = '003_backups';
const BACKUPS_MIGRATION_CHECKSUM =
  'id|created_at|app_version|schema_version|reason|status|drive_file_id';
const USERS_SHEET = '_users';
const USERS_HEADERS = ['id', 'google_subject', 'role', 'active', 'created_at'];
const SESSIONS_SHEET = '_sessions';
const SESSIONS_HEADERS = [
  'id',
  'user_id',
  'role',
  'created_at',
  'expires_at',
  'revoked',
];
const USERS_MIGRATION_ID = '004_users';
const USERS_MIGRATION_CHECKSUM =
  'id|google_subject|role|active|created_at|id|user_id|role|created_at|expires_at|revoked';
const SCHOOL_YEARS_SHEET = '_school_years';
const SCHOOL_YEARS_HEADERS = [
  'id',
  'label',
  'started_on',
  'ended_on',
  'active',
  'created_at',
];
const CLASSROOMS_SHEET = '_classrooms';
const CLASSROOMS_HEADERS = [
  'id',
  'school_year_id',
  'name',
  'active',
  'created_at',
];
const STUDENTS_SHEET = '_students';
const STUDENTS_HEADERS = [
  'id',
  'full_name',
  'birth_date',
  'approximate_age',
  'approximate_age_reference_year',
  'active',
  'created_at',
  'updated_at',
];
const STUDENT_ENROLLMENTS_SHEET = '_student_enrollments';
const STUDENT_ENROLLMENTS_HEADERS = [
  'id',
  'student_id',
  'classroom_id',
  'started_on',
  'ended_on',
  'created_by',
  'created_at',
];
const STUDENTS_MIGRATION_ID = '005_students';
const STUDENTS_MIGRATION_CHECKSUM =
  'id|label|started_on|ended_on|active|created_at|id|school_year_id|name|active|created_at|id|full_name|birth_date|approximate_age|approximate_age_reference_year|active|created_at|updated_at|id|student_id|classroom_id|started_on|ended_on|created_by|created_at';
const GUARDIANS_SHEET = '_guardians';
const GUARDIANS_HEADERS = [
  'id',
  'full_name',
  'phone',
  'whatsapp_enabled',
  'relation_label',
  'active',
  'created_at',
  'updated_at',
];
const STUDENT_GUARDIANS_SHEET = '_student_guardians';
const STUDENT_GUARDIANS_HEADERS = [
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
];
const STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET = '_student_account_authorizations';
const STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS = [
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
];
const SETTINGS_SHEET = '_settings';
const SETTINGS_HEADERS = ['key', 'value'];
const GUARDIANS_MIGRATION_ID = '006_guardians';
const GUARDIANS_MIGRATION_CHECKSUM =
  'id|full_name|phone|whatsapp_enabled|relation_label|active|created_at|updated_at|id|student_id|guardian_id|is_primary|can_use_guardian_credit|auto_settle_debt_from_guardian_credit|active|started_at|ended_at|note|created_at|id|consumer_student_id|account_student_id|can_charge_account|can_use_account_credit|active|authorized_at|revoked_at|created_by|note|key|value';
const PRODUCT_CATEGORIES_SHEET = '_product_categories';
const PRODUCT_CATEGORIES_HEADERS = [
  'id',
  'name',
  'sort_order',
  'active',
  'created_at',
];
const PRODUCTS_SHEET = '_products';
const PRODUCTS_HEADERS = [
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
];
const PRODUCT_PRICE_HISTORY_SHEET = '_product_price_history';
const PRODUCT_PRICE_HISTORY_HEADERS = [
  'id',
  'product_id',
  'price_cents',
  'started_at',
  'ended_at',
  'created_by',
];
const AD_HOC_ITEMS_SHEET = '_ad_hoc_items';
const AD_HOC_ITEMS_HEADERS = [
  'id',
  'name',
  'price_cents',
  'created_by',
  'created_at',
];
const PRODUCTS_MIGRATION_ID = '007_products';
const PRODUCTS_MIGRATION_CHECKSUM =
  'id|name|sort_order|active|created_at|id|category_id|name|price_cents|discount_allowed|stock_tracked|reservable|active|created_at|updated_at|id|product_id|price_cents|started_at|ended_at|created_by|id|name|price_cents|created_by|created_at';
const INVENTORY_DAYS_SHEET = '_inventory_days';
const INVENTORY_DAYS_HEADERS = [
  'id',
  'business_date',
  'status',
  'opened_by',
  'opened_at',
];
const INVENTORY_OPENING_ITEMS_SHEET = '_inventory_opening_items';
const INVENTORY_OPENING_ITEMS_HEADERS = [
  'id',
  'inventory_day_id',
  'product_id',
  'opening_quantity',
];
const INVENTORY_MOVEMENTS_SHEET = '_inventory_movements';
const INVENTORY_MOVEMENTS_HEADERS = [
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
];
const INVENTORY_MIGRATION_ID = '008_inventory';
const INVENTORY_MIGRATION_CHECKSUM =
  'id|business_date|status|opened_by|opened_at|id|inventory_day_id|product_id|opening_quantity|id|inventory_day_id|product_id|kind|quantity_delta|source_type|source_id|created_by|created_at|reason';
const SALES_SHEET = '_sales';
const SALES_HEADERS = [
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
];
const SALE_ITEMS_SHEET = '_sale_items';
const SALE_ITEMS_HEADERS = [
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
];
const SALE_SETTLEMENTS_SHEET = '_sale_settlements';
const SALE_SETTLEMENTS_HEADERS = [
  'id',
  'sale_id',
  'kind',
  'amount_cents',
  'related_entity_id',
  'created_at',
];
const SALES_MIGRATION_ID = '009_sales';
const SALES_MIGRATION_CHECKSUM =
  'id|consumer_student_id|charged_student_id|status|gross_total_cents|discount_total_cents|net_total_cents|source_reservation_id|created_by|created_at|reversal_id|id|sale_id|product_id|item_kind|description_snapshot|quantity|unit_price_cents|discount_kind|discount_input|discount_amount_cents|line_net_total_cents|id|sale_id|kind|amount_cents|related_entity_id|created_at';
const RECEIVABLES_SHEET = '_receivables';
const RECEIVABLES_HEADERS = [
  'id',
  'charged_student_id',
  'source_sale_id',
  'due_date',
  'status',
  'created_by',
  'created_at',
];
const RECEIVABLE_CHARGES_SHEET = '_receivable_charges';
const RECEIVABLE_CHARGES_HEADERS = [
  'id',
  'receivable_id',
  'kind',
  'amount_cents',
  'reason_code',
  'note',
  'created_by',
  'created_at',
  'reversal_id',
];
const RECEIVABLE_DUE_DATE_HISTORY_SHEET = '_receivable_due_date_history';
const RECEIVABLE_DUE_DATE_HISTORY_HEADERS = [
  'receivable_id',
  'old_due_date',
  'new_due_date',
  'reason',
  'changed_by',
  'changed_at',
];
const RECEIVABLES_MIGRATION_ID = '010_receivables';
const RECEIVABLES_MIGRATION_CHECKSUM =
  'id|charged_student_id|source_sale_id|due_date|status|created_by|created_at|id|receivable_id|kind|amount_cents|reason_code|note|created_by|created_at|reversal_id|receivable_id|old_due_date|new_due_date|reason|changed_by|changed_at';
const PAYMENTS_SHEET = '_payments';
const PAYMENTS_HEADERS = [
  'id',
  'payer_guardian_id',
  'payer_student_id',
  'method',
  'amount_received_cents',
  'status',
  'created_by',
  'created_at',
  'note',
];
const PAYMENT_ALLOCATIONS_SHEET = '_payment_allocations';
const PAYMENT_ALLOCATIONS_HEADERS = [
  'payment_id',
  'receivable_id',
  'student_id',
  'amount_cents',
];
const PAYMENTS_MIGRATION_ID = '011_payments';
const PAYMENTS_MIGRATION_CHECKSUM =
  'id|payer_guardian_id|payer_student_id|method|amount_received_cents|status|created_by|created_at|note|payment_id|receivable_id|student_id|amount_cents';
const PIX_COPY_TEXT_KEY = 'pix_copy_text';
const DEFAULT_PIX_COPY_TEXT = 'Chave PIX de teste: cantina-e2e@example.test';
const SALE_STATUS_PAID = 'paid';
const SALE_ITEM_PRODUCT = 'product';
const SALE_ITEM_AD_HOC = 'ad_hoc';
const SETTLEMENT_PIX = 'pix';
const SETTLEMENT_CASH = 'cash';
const SETTLEMENT_CHANGE = 'change';
const SETTLEMENT_FIADO = 'fiado';
const PAYMENT_MIXED = 'mixed';
const PAYMENT_FIADO = 'fiado';
const RECEIVABLE_STATUS_OPEN = 'open';
const RECEIVABLE_CHARGE_PRINCIPAL = 'principal';
const RECEIVABLE_REASON_SALE = 'sale';
const PAYMENT_STATUS_COMPLETED = 'completed';
const PAYMENT_METHOD_PIX = 'pix';
const PAYMENT_METHOD_CASH = 'cash';
const PAYMENT_MODE_OLDEST_FIRST = 'oldest_first';
const PAYMENT_MODE_SELECTED = 'selected';
const PAYMENT_MODE_MANUAL = 'manual';
const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const DISCOUNT_NONE = 'none';
const DISCOUNT_AMOUNT = 'amount';
const DISCOUNT_PERCENT = 'percent';
const ANONYMOUS_SALE_LABEL = 'Anônima';
const SOLD_OUT_LABEL = 'ACABOU';
const INVENTORY_DAY_OPEN = 'open';
const REQUIRE_GUARDIAN_BELOW_AGE_KEY = 'require_guardian_below_age';
const DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE = 18;
const E2E_OWNER_SUBJECT = 'e2e-owner';
const E2E_STAFF_SUBJECT = 'e2e-staff';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ACTION_ROLES = {
  'e2e.probe': ['owner', 'staff'],
  'e2e.reset': ['owner'],
  'e2e.seed': ['owner'],
  'backup.run': ['owner'],
  'backup.restore': ['owner'],
  'users.manage': ['owner'],
  'students.read': ['owner', 'staff'],
  'students.write': ['owner', 'staff'],
  'school_years.manage': ['owner', 'staff'],
  'classrooms.manage': ['owner', 'staff'],
  'guardians.read': ['owner', 'staff'],
  'guardians.write': ['owner', 'staff'],
  'settings.manage': ['owner'],
  'products.read': ['owner', 'staff'],
  'products.write': ['owner', 'staff'],
  'ad_hoc.create': ['owner'],
  'inventory.read': ['owner', 'staff'],
  'inventory.open': ['owner'],
  'inventory.adjust': ['owner'],
  'sales.read': ['owner', 'staff'],
  'sales.write': ['owner', 'staff'],
  'receivables.read': ['owner', 'staff'],
  'payments.write': ['owner', 'staff'],
};
const BACKUP_FILE_PREFIX = 'cantina-backup';
const BACKUP_FOLDER_NAME = 'Cantina V2 AppScript E2E backups';
const DEFAULT_BACKUP_RETENTION_DAYS = 14;
const SCHEDULED_BACKUP_HANDLER = 'runScheduledBackup';
const SCHEDULED_BACKUP_HOUR = 6;
const E2E_PROBE_OPERATION = 'e2e.probe';
const OPERATION_COMPLETED = 'completed';
const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCRIPT_LOCK_TIMEOUT_MS = 30000;

function doGet() {
  ensureE2EConfigured();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CANTINA_APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getScriptEnvironment() {
  return PropertiesService.getScriptProperties().getProperty('ENVIRONMENT');
}

function getConfiguredSpreadsheetId() {
  return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
}

function assertE2EEnvironment() {
  const environment = getScriptEnvironment();
  if (environment === 'PROD') {
    throw new Error(
      'RESET_PROD_FORBIDDEN: Reset e seed nunca podem rodar em PROD.',
    );
  }
  if (environment !== CANTINA_ENVIRONMENT) {
    throw new Error(
      'E2E_ONLY: Reset e seed só podem rodar no ambiente E2E isolado.',
    );
  }
}

function ensureE2EConfigured() {
  const environment = getScriptEnvironment();
  if (environment === 'PROD') {
    throw new Error('RESET_PROD_FORBIDDEN: este projeto E2E recusa PROD.');
  }
  if (environment && environment !== CANTINA_ENVIRONMENT) {
    throw new Error('CONFIGURATION_ERROR: ENVIRONMENT deve ser E2E.');
  }
  if (environment === CANTINA_ENVIRONMENT && getConfiguredSpreadsheetId()) {
    return;
  }
  configureE2EEnvironment();
}

function openConfiguredSpreadsheet() {
  const spreadsheetId = getConfiguredSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error('CONFIGURATION_ERROR: SPREADSHEET_ID não configurado.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function withScriptLock(work) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(SCRIPT_LOCK_TIMEOUT_MS)) {
    throw new Error('LOCK_TIMEOUT: não foi possível obter o lock.');
  }
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}

function isUserRole(value) {
  return value === 'owner' || value === 'staff';
}

function throwAuthError(code, message) {
  throw new Error(code + ': ' + message);
}

function listSheetRecords(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  return sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues()
    .map(function (row) {
      const record = {};
      headers.forEach(function (header, index) {
        record[header] = String(row[index] || '');
      });
      return record;
    });
}

function findLatestByField(records, field, value) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (records[index][field] === value) {
      return records[index];
    }
  }
  return null;
}

function openUsersSheet() {
  return getOrCreateSheet(
    openConfiguredSpreadsheet(),
    USERS_SHEET,
    USERS_HEADERS,
  );
}

function openSessionsSheet() {
  return getOrCreateSheet(
    openConfiguredSpreadsheet(),
    SESSIONS_SHEET,
    SESSIONS_HEADERS,
  );
}

function ensureE2EUsers() {
  setupSchema();
  const users = openUsersSheet();
  const existing = listSheetRecords(users, USERS_HEADERS);
  const createdAt = new Date().toISOString();
  const fixtures = [
    { google_subject: E2E_OWNER_SUBJECT, role: 'owner' },
    { google_subject: E2E_STAFF_SUBJECT, role: 'staff' },
  ];
  fixtures.forEach(function (fixture) {
    if (
      !findLatestByField(existing, 'google_subject', fixture.google_subject)
    ) {
      users.appendRow([
        Utilities.getUuid(),
        fixture.google_subject,
        fixture.role,
        'true',
        createdAt,
      ]);
    }
  });
}

function createSessionForUser(user) {
  if (!user || user.active !== 'true' || !isUserRole(user.role)) {
    throwAuthError('FORBIDDEN', 'Esta ação não é permitida para o seu perfil.');
  }
  const now = new Date();
  const token = Utilities.getUuid();
  openSessionsSheet().appendRow([
    token,
    user.id,
    user.role,
    now.toISOString(),
    new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    'false',
  ]);
  return { token: token, role: user.role };
}

function publicSession(session) {
  return { role: session.role };
}

function requireSession(sessionToken) {
  if (
    typeof sessionToken !== 'string' ||
    !REQUEST_ID_PATTERN.test(sessionToken)
  ) {
    throwAuthError('UNAUTHENTICATED', 'Entre para continuar.');
  }
  const latest = findLatestByField(
    listSheetRecords(openSessionsSheet(), SESSIONS_HEADERS),
    'id',
    sessionToken,
  );
  if (!latest || latest.revoked === 'true' || !isUserRole(latest.role)) {
    throwAuthError('UNAUTHENTICATED', 'Entre para continuar.');
  }
  if (Date.parse(latest.expires_at) <= Date.now()) {
    throwAuthError('SESSION_EXPIRED', 'A sessão expirou. Entre novamente.');
  }
  return latest;
}

function requireAction(sessionToken, action) {
  setupSchema();
  const session = requireSession(sessionToken);
  const allowed = ACTION_ROLES[action] || [];
  if (allowed.indexOf(session.role) === -1) {
    throwAuthError('FORBIDDEN', 'Esta ação não é permitida para o seu perfil.');
  }
  return session;
}

function loginE2E(role) {
  assertE2EEnvironment();
  if (!isUserRole(role)) {
    throw new Error('INVALID_ROLE: informe dona ou funcionário.');
  }
  return withScriptLock(function () {
    ensureE2EUsers();
    const subject = role === 'owner' ? E2E_OWNER_SUBJECT : E2E_STAFF_SUBJECT;
    const user = findLatestByField(
      listSheetRecords(openUsersSheet(), USERS_HEADERS),
      'google_subject',
      subject,
    );
    return createSessionForUser(user);
  });
}

function loginWithGoogle() {
  assertE2EEnvironment();
  let email = '';
  try {
    email = Session.getActiveUser().getEmail();
  } catch (error) {
    email = '';
  }
  if (!email) {
    throwAuthError('UNAUTHENTICATED', 'Entre para continuar.');
  }
  return withScriptLock(function () {
    setupSchema();
    const user = findLatestByField(
      listSheetRecords(openUsersSheet(), USERS_HEADERS),
      'google_subject',
      email,
    );
    if (!user) {
      throwAuthError(
        'FORBIDDEN',
        'Esta ação não é permitida para o seu perfil.',
      );
    }
    return createSessionForUser(user);
  });
}

function getSession(sessionToken) {
  setupSchema();
  return publicSession(requireSession(sessionToken));
}

function logout(sessionToken) {
  setupSchema();
  const session = requireSession(sessionToken);
  return withScriptLock(function () {
    openSessionsSheet().appendRow([
      session.id,
      session.user_id,
      session.role,
      session.created_at,
      session.expires_at,
      'true',
    ]);
    return { loggedOut: true };
  });
}

function isRequestId(value) {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value);
}

function buildHealth() {
  const properties = PropertiesService.getScriptProperties();
  const environment = properties.getProperty('ENVIRONMENT');
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const version = properties.getProperty('APP_VERSION');
  const backupFolderId = properties.getProperty('BACKUP_FOLDER_ID');

  if (environment !== CANTINA_ENVIRONMENT) {
    throw new Error('CONFIGURATION_ERROR: ENVIRONMENT deve ser E2E.');
  }
  if (!spreadsheetId) {
    throw new Error('CONFIGURATION_ERROR: SPREADSHEET_ID não configurado.');
  }
  if (version !== CANTINA_APP_VERSION) {
    throw new Error('CONFIGURATION_ERROR: APP_VERSION incompatível.');
  }

  SpreadsheetApp.openById(spreadsheetId);
  const meta = openConfiguredSpreadsheet().getSheetByName(META_SHEET);

  return {
    appName: CANTINA_APP_NAME,
    version: version,
    environment: environment,
    status: 'ready',
    adapter: 'google-script',
    spreadsheetConfigured: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    backupConfigured: Boolean(backupFolderId),
    lastBackupAt: meta ? getMetaValue(meta, 'last_backup_at') : null,
  };
}

function getHealth() {
  ensureE2EConfigured();
  setupSchema();
  return buildHealth();
}

function configureE2EEnvironment(spreadsheetId) {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const targetSpreadsheetId =
    spreadsheetId || (activeSpreadsheet && activeSpreadsheet.getId());
  if (!targetSpreadsheetId) {
    throw new Error('CONFIGURATION_ERROR: informe ou vincule a planilha E2E.');
  }

  SpreadsheetApp.openById(targetSpreadsheetId);

  PropertiesService.getScriptProperties().setProperties(
    {
      ENVIRONMENT: CANTINA_ENVIRONMENT,
      SPREADSHEET_ID: targetSpreadsheetId,
      APP_VERSION: CANTINA_APP_VERSION,
    },
    false,
  );

  return buildHealth();
}

function getOrCreateSheet(spreadsheet, name, headers) {
  const existing = spreadsheet.getSheetByName(name);
  const sheet = existing || spreadsheet.insertSheet(name);
  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const actual = sheet.getRange(1, 1, 1, lastColumn).getValues()[0] || [];
  const hasHeaders = headers.every(function (header, index) {
    return String(actual[index] || '') === header;
  });
  if (!hasHeaders) {
    if (existing && sheet.getLastRow() > 1) {
      throw new Error('HEADER_MISMATCH: cabeçalho inesperado em ' + name + '.');
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function getOrCreateE2EMetaSheet(spreadsheet) {
  return getOrCreateSheet(spreadsheet, E2E_META_SHEET, ['key', 'value']);
}

function clearSheetData(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function resetE2EUnlocked() {
  const spreadsheet = openConfiguredSpreadsheet();
  clearSheetData(getOrCreateE2EMetaSheet(spreadsheet));
  const operations = spreadsheet.getSheetByName(OPERATION_REQUESTS_SHEET);
  if (operations) {
    clearSheetData(operations);
  }
  const backups = spreadsheet.getSheetByName(BACKUPS_SHEET);
  if (backups) {
    clearSheetData(backups);
  }
  const sessions = spreadsheet.getSheetByName(SESSIONS_SHEET);
  if (sessions) {
    clearSheetData(sessions);
  }
  [
    SCHOOL_YEARS_SHEET,
    CLASSROOMS_SHEET,
    STUDENTS_SHEET,
    STUDENT_ENROLLMENTS_SHEET,
    GUARDIANS_SHEET,
    STUDENT_GUARDIANS_SHEET,
    STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
    SETTINGS_SHEET,
    PRODUCT_CATEGORIES_SHEET,
    PRODUCTS_SHEET,
    PRODUCT_PRICE_HISTORY_SHEET,
    AD_HOC_ITEMS_SHEET,
    INVENTORY_DAYS_SHEET,
    INVENTORY_OPENING_ITEMS_SHEET,
    INVENTORY_MOVEMENTS_SHEET,
    SALES_SHEET,
    SALE_ITEMS_SHEET,
    SALE_SETTLEMENTS_SHEET,
    RECEIVABLES_SHEET,
    RECEIVABLE_CHARGES_SHEET,
    RECEIVABLE_DUE_DATE_HISTORY_SHEET,
    PAYMENTS_SHEET,
    PAYMENT_ALLOCATIONS_SHEET,
  ].forEach(function (name) {
    const sheet = spreadsheet.getSheetByName(name);
    if (sheet) {
      clearSheetData(sheet);
    }
  });
  return { reset: true, environment: CANTINA_ENVIRONMENT };
}

function resetE2E(sessionToken) {
  assertE2EEnvironment();
  requireAction(sessionToken, 'e2e.reset');
  return withScriptLock(function () {
    return resetE2EUnlocked();
  });
}

function seedE2E(sessionToken) {
  assertE2EEnvironment();
  requireAction(sessionToken, 'e2e.seed');
  return withScriptLock(function () {
    resetE2EUnlocked();
    const spreadsheet = openConfiguredSpreadsheet();
    const sheet = getOrCreateE2EMetaSheet(spreadsheet);
    sheet.appendRow(['marker', E2E_SEED_MARKER]);
    sheet.appendRow(['seeded', 'true']);
    seedE2EStudentsUnlocked();
    seedE2EGuardiansUnlocked();
    seedE2EProductsUnlocked();
    seedE2EInventoryUnlocked();
    ensurePixCopySettingUnlocked();
    return {
      marker: E2E_SEED_MARKER,
      seeded: true,
      environment: CANTINA_ENVIRONMENT,
    };
  });
}

function listAppliedMigrationIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  return sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .map(function (row) {
      return String(row[0] || '');
    })
    .filter(Boolean);
}

function assertKnownMigrations(applied) {
  const catalog = [
    FOUNDATION_MIGRATION_ID,
    OPERATION_REQUESTS_MIGRATION_ID,
    BACKUPS_MIGRATION_ID,
    USERS_MIGRATION_ID,
    STUDENTS_MIGRATION_ID,
    GUARDIANS_MIGRATION_ID,
    PRODUCTS_MIGRATION_ID,
    INVENTORY_MIGRATION_ID,
    SALES_MIGRATION_ID,
    RECEIVABLES_MIGRATION_ID,
    PAYMENTS_MIGRATION_ID,
  ];
  applied.forEach(function (id) {
    if (catalog.indexOf(id) === -1) {
      throw new Error(
        'UNKNOWN_MIGRATION: há migration aplicada que não existe no catálogo.',
      );
    }
  });
}

function setupSchema() {
  assertE2EEnvironment();
  const spreadsheet = openConfiguredSpreadsheet();
  const meta = getOrCreateSheet(spreadsheet, META_SHEET, META_HEADERS);
  const migrations = getOrCreateSheet(
    spreadsheet,
    MIGRATIONS_SHEET,
    MIGRATION_HEADERS,
  );
  const applied = listAppliedMigrationIds(migrations);
  assertKnownMigrations(applied);
  const pending =
    applied.indexOf(FOUNDATION_MIGRATION_ID) === -1 ||
    applied.indexOf(OPERATION_REQUESTS_MIGRATION_ID) === -1 ||
    applied.indexOf(BACKUPS_MIGRATION_ID) === -1 ||
    applied.indexOf(USERS_MIGRATION_ID) === -1 ||
    applied.indexOf(STUDENTS_MIGRATION_ID) === -1 ||
    applied.indexOf(GUARDIANS_MIGRATION_ID) === -1 ||
    applied.indexOf(PRODUCTS_MIGRATION_ID) === -1 ||
    applied.indexOf(INVENTORY_MIGRATION_ID) === -1 ||
    applied.indexOf(SALES_MIGRATION_ID) === -1 ||
    applied.indexOf(RECEIVABLES_MIGRATION_ID) === -1 ||
    applied.indexOf(PAYMENTS_MIGRATION_ID) === -1;
  let pendingCopy = null;
  if (pending) {
    try {
      pendingCopy = copySpreadsheetUnlocked('pre-migration');
    } catch (error) {
      pendingCopy = null;
    }
  }
  const createdAt = new Date().toISOString();
  if (applied.indexOf(FOUNDATION_MIGRATION_ID) === -1) {
    meta.appendRow(['schema_version', '1']);
    meta.appendRow(['app_version', CANTINA_APP_VERSION]);
    meta.appendRow(['environment', CANTINA_ENVIRONMENT]);
    meta.appendRow(['created_at', createdAt]);
    migrations.appendRow([
      FOUNDATION_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      FOUNDATION_MIGRATION_CHECKSUM,
      'Cria _meta e _schema_migrations',
    ]);
  }
  if (applied.indexOf(OPERATION_REQUESTS_MIGRATION_ID) === -1) {
    getOrCreateSheet(
      spreadsheet,
      OPERATION_REQUESTS_SHEET,
      OPERATION_REQUESTS_HEADERS,
    );
    meta.appendRow(['schema_version', '2']);
    migrations.appendRow([
      OPERATION_REQUESTS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      OPERATION_REQUESTS_MIGRATION_CHECKSUM,
      'Cria _operation_requests',
    ]);
  }
  if (applied.indexOf(BACKUPS_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, BACKUPS_SHEET, BACKUPS_HEADERS);
    meta.appendRow(['schema_version', '3']);
    migrations.appendRow([
      BACKUPS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      BACKUPS_MIGRATION_CHECKSUM,
      'Cria _backups',
    ]);
  }
  if (applied.indexOf(USERS_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, USERS_SHEET, USERS_HEADERS);
    getOrCreateSheet(spreadsheet, SESSIONS_SHEET, SESSIONS_HEADERS);
    meta.appendRow(['schema_version', '4']);
    migrations.appendRow([
      USERS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      USERS_MIGRATION_CHECKSUM,
      'Cria _users e _sessions',
    ]);
  }
  if (applied.indexOf(STUDENTS_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, SCHOOL_YEARS_SHEET, SCHOOL_YEARS_HEADERS);
    getOrCreateSheet(spreadsheet, CLASSROOMS_SHEET, CLASSROOMS_HEADERS);
    getOrCreateSheet(spreadsheet, STUDENTS_SHEET, STUDENTS_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      STUDENT_ENROLLMENTS_SHEET,
      STUDENT_ENROLLMENTS_HEADERS,
    );
    meta.appendRow(['schema_version', '5']);
    migrations.appendRow([
      STUDENTS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      STUDENTS_MIGRATION_CHECKSUM,
      'Cria anos letivos, turmas, alunos e matrículas',
    ]);
  }
  if (applied.indexOf(GUARDIANS_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, GUARDIANS_SHEET, GUARDIANS_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      STUDENT_GUARDIANS_SHEET,
      STUDENT_GUARDIANS_HEADERS,
    );
    getOrCreateSheet(
      spreadsheet,
      STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
      STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS,
    );
    const settings = getOrCreateSheet(
      spreadsheet,
      SETTINGS_SHEET,
      SETTINGS_HEADERS,
    );
    settings.appendRow([
      REQUIRE_GUARDIAN_BELOW_AGE_KEY,
      String(DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE),
    ]);
    meta.appendRow(['schema_version', '6']);
    migrations.appendRow([
      GUARDIANS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      GUARDIANS_MIGRATION_CHECKSUM,
      'Cria responsáveis, vínculos, autorizações de irmãos e settings',
    ]);
  }
  if (applied.indexOf(PRODUCTS_MIGRATION_ID) === -1) {
    getOrCreateSheet(
      spreadsheet,
      PRODUCT_CATEGORIES_SHEET,
      PRODUCT_CATEGORIES_HEADERS,
    );
    getOrCreateSheet(spreadsheet, PRODUCTS_SHEET, PRODUCTS_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      PRODUCT_PRICE_HISTORY_SHEET,
      PRODUCT_PRICE_HISTORY_HEADERS,
    );
    getOrCreateSheet(spreadsheet, AD_HOC_ITEMS_SHEET, AD_HOC_ITEMS_HEADERS);
    meta.appendRow(['schema_version', '7']);
    migrations.appendRow([
      PRODUCTS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      PRODUCTS_MIGRATION_CHECKSUM,
      'Cria categorias, produtos, histórico de preço e itens avulsos',
    ]);
  }
  if (applied.indexOf(INVENTORY_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, INVENTORY_DAYS_SHEET, INVENTORY_DAYS_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      INVENTORY_OPENING_ITEMS_SHEET,
      INVENTORY_OPENING_ITEMS_HEADERS,
    );
    getOrCreateSheet(
      spreadsheet,
      INVENTORY_MOVEMENTS_SHEET,
      INVENTORY_MOVEMENTS_HEADERS,
    );
    meta.appendRow(['schema_version', '8']);
    migrations.appendRow([
      INVENTORY_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      INVENTORY_MIGRATION_CHECKSUM,
      'Cria estoque diário, abertura e movimentos',
    ]);
  }
  if (applied.indexOf(SALES_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, SALES_SHEET, SALES_HEADERS);
    getOrCreateSheet(spreadsheet, SALE_ITEMS_SHEET, SALE_ITEMS_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      SALE_SETTLEMENTS_SHEET,
      SALE_SETTLEMENTS_HEADERS,
    );
    getOrCreateSheet(spreadsheet, SETTINGS_SHEET, SETTINGS_HEADERS).appendRow([
      PIX_COPY_TEXT_KEY,
      DEFAULT_PIX_COPY_TEXT,
    ]);
    meta.appendRow(['schema_version', '9']);
    migrations.appendRow([
      SALES_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      SALES_MIGRATION_CHECKSUM,
      'Cria vendas, itens com snapshot e settlements PIX',
    ]);
  }
  if (applied.indexOf(RECEIVABLES_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, RECEIVABLES_SHEET, RECEIVABLES_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      RECEIVABLE_CHARGES_SHEET,
      RECEIVABLE_CHARGES_HEADERS,
    );
    getOrCreateSheet(
      spreadsheet,
      RECEIVABLE_DUE_DATE_HISTORY_SHEET,
      RECEIVABLE_DUE_DATE_HISTORY_HEADERS,
    );
    meta.appendRow(['schema_version', '10']);
    migrations.appendRow([
      RECEIVABLES_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      RECEIVABLES_MIGRATION_CHECKSUM,
      'Cria recebíveis, charges e histórico de vencimento',
    ]);
  }
  if (applied.indexOf(PAYMENTS_MIGRATION_ID) === -1) {
    getOrCreateSheet(spreadsheet, PAYMENTS_SHEET, PAYMENTS_HEADERS);
    getOrCreateSheet(
      spreadsheet,
      PAYMENT_ALLOCATIONS_SHEET,
      PAYMENT_ALLOCATIONS_HEADERS,
    );
    meta.appendRow(['schema_version', String(CURRENT_SCHEMA_VERSION)]);
    migrations.appendRow([
      PAYMENTS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      PAYMENTS_MIGRATION_CHECKSUM,
      'Cria pagamentos e alocações em recebíveis',
    ]);
  }
  if (pendingCopy) {
    recordBackupUnlocked(pendingCopy);
    pruneBackupsUnlocked();
    ensureBackupTrigger();
  }
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appliedMigrations: listAppliedMigrationIds(migrations),
    environment: CANTINA_ENVIRONMENT,
  };
}

function findOperationRequest(sheet, requestId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }
  const rows = sheet
    .getRange(2, 1, lastRow - 1, OPERATION_REQUESTS_HEADERS.length)
    .getValues();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || [];
    if (String(row[0] || '') === requestId) {
      return {
        request_id: String(row[0] || ''),
        operation_type: String(row[1] || ''),
        result_entity_id: String(row[2] || ''),
        status: String(row[3] || ''),
        created_at: String(row[4] || ''),
      };
    }
  }
  return null;
}

function applyBatchAppend(sheetName, rows) {
  const spreadsheetId = getConfiguredSpreadsheetId();
  const sheet = openConfiguredSpreadsheet().getSheetByName(sheetName);
  if (!spreadsheetId || !sheet) {
    throw new Error('SHEET_NOT_FOUND: aba necessária para o batch não existe.');
  }
  if (typeof Sheets === 'undefined' || !Sheets.Spreadsheets) {
    throw new Error(
      'CONFIGURATION_ERROR: Advanced Sheets Service não habilitado.',
    );
  }
  Sheets.Spreadsheets.batchUpdate(
    {
      requests: [
        {
          appendCells: {
            sheetId: sheet.getSheetId(),
            rows: rows.map(function (row) {
              return {
                values: row.map(function (value) {
                  return { userEnteredValue: { stringValue: String(value) } };
                }),
              };
            }),
            fields: 'userEnteredValue',
          },
        },
      ],
    },
    spreadsheetId,
  );
}

function probeIdempotentOperation(sessionToken, requestId) {
  assertE2EEnvironment();
  requireAction(sessionToken, 'e2e.probe');
  return withScriptLock(function () {
    setupSchema();
    if (!isRequestId(requestId)) {
      throw new Error(
        'INVALID_REQUEST_ID: request_id deve ser UUID, nunca número da linha.',
      );
    }
    const sheet = getOrCreateSheet(
      openConfiguredSpreadsheet(),
      OPERATION_REQUESTS_SHEET,
      OPERATION_REQUESTS_HEADERS,
    );
    const existing = findOperationRequest(sheet, requestId);
    if (existing) {
      if (existing.operation_type !== E2E_PROBE_OPERATION) {
        throw new Error(
          'REQUEST_CONFLICT: este request_id já foi usado em outra operação.',
        );
      }
      if (existing.status !== OPERATION_COMPLETED) {
        throw new Error(
          'REQUEST_INCOMPLETE: a operação ainda não concluiu. Tente de novo.',
        );
      }
      return {
        requestId: existing.request_id,
        resultEntityId: existing.result_entity_id,
        replayed: true,
        status: existing.status,
      };
    }
    const resultEntityId = Utilities.getUuid();
    applyBatchAppend(OPERATION_REQUESTS_SHEET, [
      [
        requestId,
        E2E_PROBE_OPERATION,
        resultEntityId,
        OPERATION_COMPLETED,
        new Date().toISOString(),
      ],
    ]);
    return {
      requestId: requestId,
      resultEntityId: resultEntityId,
      replayed: false,
      status: OPERATION_COMPLETED,
    };
  });
}

function getMetaValue(sheet, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }
  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  let value = null;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || [];
    if (String(row[0] || '') === key && String(row[1] || '')) {
      value = String(row[1] || '');
    }
  }
  return value;
}

function getBackupRetentionDays() {
  const raw = PropertiesService.getScriptProperties().getProperty(
    'BACKUP_RETENTION_DAYS',
  );
  const parsed = parseInt(raw || '', 10);
  if (parsed > 0) {
    return parsed;
  }
  return DEFAULT_BACKUP_RETENTION_DAYS;
}

function createBackupFileName(nowIso, schemaVersion) {
  const stamp = String(nowIso)
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/\.\d+Z$/, 'Z');
  const version = CANTINA_APP_VERSION.replace(/[^0-9A-Za-z]+/g, '-');
  return (
    BACKUP_FILE_PREFIX +
    '-' +
    CANTINA_ENVIRONMENT +
    '-' +
    stamp +
    '-v' +
    version +
    '-s' +
    schemaVersion
  );
}

function ensureBackupFolderId() {
  const properties = PropertiesService.getScriptProperties();
  const existing = properties.getProperty('BACKUP_FOLDER_ID');
  if (existing) {
    return existing;
  }
  const folder = DriveApp.createFolder(BACKUP_FOLDER_NAME);
  const folderId = folder.getId();
  properties.setProperty('BACKUP_FOLDER_ID', folderId);
  return folderId;
}

function copySpreadsheetUnlocked(reason) {
  const spreadsheetId = getConfiguredSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error('CONFIGURATION_ERROR: SPREADSHEET_ID não configurado.');
  }
  const folderId = ensureBackupFolderId();
  const folder = DriveApp.getFolderById(folderId);
  const createdAt = new Date().toISOString();
  const file = DriveApp.getFileById(spreadsheetId).makeCopy(
    createBackupFileName(createdAt, CURRENT_SCHEMA_VERSION),
    folder,
  );
  file.setDescription(
    JSON.stringify({
      appVersion: CANTINA_APP_VERSION,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      reason: reason,
      environment: CANTINA_ENVIRONMENT,
    }),
  );
  return {
    fileId: file.getId(),
    createdAt: createdAt,
    reason: reason,
  };
}

function recordBackupUnlocked(copy) {
  const spreadsheet = openConfiguredSpreadsheet();
  const backups = getOrCreateSheet(spreadsheet, BACKUPS_SHEET, BACKUPS_HEADERS);
  const meta = getOrCreateSheet(spreadsheet, META_SHEET, META_HEADERS);
  backups.appendRow([
    Utilities.getUuid(),
    copy.createdAt,
    CANTINA_APP_VERSION,
    String(CURRENT_SCHEMA_VERSION),
    copy.reason,
    'completed',
    copy.fileId,
  ]);
  meta.appendRow(['last_backup_at', copy.createdAt]);
}

function pruneBackupsUnlocked() {
  const folderId =
    PropertiesService.getScriptProperties().getProperty('BACKUP_FOLDER_ID');
  if (!folderId) {
    return;
  }
  const retentionDays = getBackupRetentionDays();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const files = DriveApp.getFolderById(folderId).getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const created = file.getDateCreated();
    if (
      name.indexOf(BACKUP_FILE_PREFIX + '-') === 0 &&
      created &&
      created.getTime() < cutoff
    ) {
      file.setTrashed(true);
    }
  }
}

function ensureBackupTrigger() {
  if (typeof ScriptApp === 'undefined') {
    return;
  }
  const triggers = ScriptApp.getProjectTriggers();
  for (let index = 0; index < triggers.length; index += 1) {
    if (triggers[index].getHandlerFunction() === SCHEDULED_BACKUP_HANDLER) {
      return;
    }
  }
  ScriptApp.newTrigger(SCHEDULED_BACKUP_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(SCHEDULED_BACKUP_HOUR)
    .create();
}

function runBackupUnlocked(reason) {
  setupSchema();
  const copy = copySpreadsheetUnlocked(reason || 'manual');
  recordBackupUnlocked(copy);
  pruneBackupsUnlocked();
  ensureBackupTrigger();
  return {
    createdAt: copy.createdAt,
    reason: copy.reason,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

function runBackup(sessionToken, reason) {
  assertE2EEnvironment();
  requireAction(sessionToken, 'backup.run');
  return withScriptLock(function () {
    return runBackupUnlocked(reason);
  });
}

function runScheduledBackup() {
  assertE2EEnvironment();
  return withScriptLock(function () {
    return runBackupUnlocked('scheduled');
  });
}

function prepareRestore(sessionToken, backupId, confirmed) {
  assertE2EEnvironment();
  requireAction(sessionToken, 'backup.restore');
  return withScriptLock(function () {
    if (!confirmed) {
      throw new Error(
        'RESTORE_NOT_CONFIRMED: a restauração precisa de confirmação explícita.',
      );
    }
    if (!isRequestId(backupId)) {
      throw new Error(
        'INVALID_BACKUP_ID: o backup deve ser identificado por UUID, nunca pelo número da linha.',
      );
    }
    setupSchema();
    const sheet = getOrCreateSheet(
      openConfiguredSpreadsheet(),
      BACKUPS_SHEET,
      BACKUPS_HEADERS,
    );
    const lastRow = sheet.getLastRow();
    let driveFileId = '';
    if (lastRow > 1) {
      const rows = sheet
        .getRange(2, 1, lastRow - 1, BACKUPS_HEADERS.length)
        .getValues();
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index] || [];
        if (String(row[0] || '') === backupId) {
          driveFileId = String(row[6] || '');
        }
      }
    }
    if (!driveFileId) {
      throw new Error(
        'RESTORE_SNAPSHOT_INVALID: o snapshot de backup não é válido para restaurar.',
      );
    }
    const snapshot = DriveApp.getFileById(driveFileId);
    if (!snapshot || snapshot.isTrashed()) {
      throw new Error(
        'RESTORE_SNAPSHOT_INVALID: o snapshot de backup não é válido para restaurar.',
      );
    }
    const copy = copySpreadsheetUnlocked('pre-restore');
    recordBackupUnlocked(copy);
    return {
      prepared: true,
      merge: false,
      snapshotValid: true,
      currentBackupCreated: true,
    };
  });
}

function todayCivil() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
}

function isCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function utcFromCivilGs(civilDate) {
  return new Date(
    Date.UTC(
      Number(civilDate.slice(0, 4)),
      Number(civilDate.slice(5, 7)) - 1,
      Number(civilDate.slice(8, 10)),
    ),
  );
}

function addCivilDaysGs(civilDate, days) {
  const utc = utcFromCivilGs(civilDate);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function nextFridayGs(civilDate) {
  const weekday = utcFromCivilGs(civilDate).getUTCDay();
  const delta = weekday === 5 ? 7 : (5 - weekday + 7) % 7;
  return addCivilDaysGs(civilDate, delta);
}

function formatCivilDisplayGs(civilDate) {
  if (!isCivilDate(civilDate)) {
    return civilDate;
  }
  const weekday = WEEKDAY_LABELS[utcFromCivilGs(civilDate).getUTCDay()];
  return (
    weekday +
    ' • ' +
    civilDate.slice(8, 10) +
    '/' +
    civilDate.slice(5, 7) +
    '/' +
    civilDate.slice(2, 4)
  );
}

function agendaBucketGs(dueDate, today) {
  if (dueDate < today) {
    return 'overdue';
  }
  if (dueDate === today) {
    return 'today';
  }
  return 'upcoming';
}

function dueDateShortcutsGs(today) {
  return {
    today: today,
    tomorrow: addCivilDaysGs(today, 1),
    nextFriday: nextFridayGs(today),
    plus7: addCivilDaysGs(today, 7),
  };
}

function parseCivilDateGs(value) {
  if (!isCivilDate(value)) {
    throw new Error(
      'INVALID_CIVIL_DATE: Use uma data civil no formato AAAA-MM-DD.',
    );
  }
  return value;
}

function dueDateLabelForDatesGs(dueDates) {
  if (!dueDates.length) {
    return null;
  }
  if (dueDates.length === 1) {
    return formatCivilDisplayGs(dueDates[0]);
  }
  return dueDates.length + ' vencimentos';
}

function receivableSummaryLabelGs(studentLabel, amountLabel, dueDateLabel) {
  return studentLabel + ' • ' + amountLabel + ' • ' + dueDateLabel;
}

function planFiadoInstallmentsGs(netTotalCents, installments) {
  const rows = installments || [];
  if (!rows.length) {
    throw new Error(
      'FIADO_INSTALLMENTS_REQUIRED: Informe o vencimento do fiado.',
    );
  }
  const planned = [];
  for (let index = 0; index < rows.length; index += 1) {
    const installment = rows[index] || {};
    const dueDate = parseCivilDateGs(installment.dueDate);
    if (rows.length === 1 && installment.amountCents == null) {
      planned.push({
        due_date: dueDate,
        amount_cents: String(netTotalCents),
      });
      continue;
    }
    var amount;
    try {
      amount = parseCentsGs(installment.amountCents);
    } catch (error) {
      throw new Error(
        'FIADO_AMOUNT_MISMATCH: A soma dos vencimentos precisa ser igual ao fiado.',
      );
    }
    if (amount <= 0) {
      throw new Error(
        'FIADO_AMOUNT_MISMATCH: A soma dos vencimentos precisa ser igual ao fiado.',
      );
    }
    planned.push({
      due_date: dueDate,
      amount_cents: String(amount),
    });
  }
  const total = planned.reduce(function (sum, item) {
    return sum + Number(item.amount_cents);
  }, 0);
  if (total !== netTotalCents) {
    throw new Error(
      'FIADO_AMOUNT_MISMATCH: A soma dos vencimentos precisa ser igual ao fiado.',
    );
  }
  return planned;
}

function latestRecordsById(records) {
  const latest = {};
  records.forEach(function (record) {
    latest[record.id] = record;
  });
  return Object.keys(latest).map(function (id) {
    return latest[id];
  });
}

function openNamedSheet(name, headers) {
  return getOrCreateSheet(openConfiguredSpreadsheet(), name, headers);
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function normalizePersonName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function personNameKey(value) {
  return normalizePersonName(value).toLowerCase();
}

function validateStudentProfileGs(input) {
  const fullName = normalizePersonName(input && input.fullName);
  if (fullName.length < 2) {
    throw new Error('STUDENT_NAME_REQUIRED: Informe o nome completo do aluno.');
  }
  const hasBirth = !isBlank(input && input.birthDate);
  const hasAge = !isBlank(input && input.approximateAge);
  const hasYear = !isBlank(input && input.approximateAgeReferenceYear);
  if (hasBirth && (hasAge || hasYear)) {
    throw new Error(
      'STUDENT_AGE_CONFLICT: Use nascimento ou idade aproximada, não os dois.',
    );
  }
  if (!hasBirth && !hasAge && !hasYear) {
    throw new Error(
      'STUDENT_AGE_REQUIRED: Informe a data de nascimento ou a idade aproximada com o ano.',
    );
  }
  if (!hasBirth && hasAge !== hasYear) {
    throw new Error(
      'INVALID_APPROXIMATE_AGE: Informe idade aproximada e o ano de referência.',
    );
  }
  if (hasBirth) {
    const birthDate = String(input.birthDate).trim();
    if (!isCivilDate(birthDate)) {
      throw new Error(
        'INVALID_BIRTH_DATE: A data de nascimento precisa ser uma data civil válida.',
      );
    }
    return {
      full_name: fullName,
      birth_date: birthDate,
      approximate_age: '',
      approximate_age_reference_year: '',
    };
  }
  const age = Number(input.approximateAge);
  const year = Number(input.approximateAgeReferenceYear);
  if (
    !Number.isInteger(age) ||
    age < 0 ||
    age > 120 ||
    !Number.isInteger(year) ||
    year < 1990 ||
    year > 2100
  ) {
    throw new Error(
      'INVALID_APPROXIMATE_AGE: Informe idade aproximada e o ano de referência.',
    );
  }
  return {
    full_name: fullName,
    birth_date: '',
    approximate_age: String(age),
    approximate_age_reference_year: String(year),
  };
}

function studentAgeLabelGs(student) {
  const today = todayCivil();
  if (student.birth_date) {
    const birthYear = Number(student.birth_date.slice(0, 4));
    const birthMonth = Number(student.birth_date.slice(5, 7));
    const birthDay = Number(student.birth_date.slice(8, 10));
    const todayYear = Number(today.slice(0, 4));
    const todayMonth = Number(today.slice(5, 7));
    const todayDay = Number(today.slice(8, 10));
    let age = todayYear - birthYear;
    if (
      todayMonth < birthMonth ||
      (todayMonth === birthMonth && todayDay < birthDay)
    ) {
      age -= 1;
    }
    return String(Math.max(age, 0));
  }
  const age = Number(student.approximate_age);
  const year = Number(student.approximate_age_reference_year);
  return '~' + Math.max(age + (Number(today.slice(0, 4)) - year), 0);
}

function currentEnrollmentGs(studentId) {
  const open = listSheetRecords(
    openNamedSheet(STUDENT_ENROLLMENTS_SHEET, STUDENT_ENROLLMENTS_HEADERS),
    STUDENT_ENROLLMENTS_HEADERS,
  ).filter(function (record) {
    return record.student_id === studentId && record.ended_on === '';
  });
  return open.length ? open[open.length - 1] : null;
}

function classroomById(id) {
  return latestRecordsById(
    listSheetRecords(
      openNamedSheet(CLASSROOMS_SHEET, CLASSROOMS_HEADERS),
      CLASSROOMS_HEADERS,
    ),
  ).filter(function (room) {
    return room.id === id;
  })[0];
}

function schoolYearById(id) {
  return latestRecordsById(
    listSheetRecords(
      openNamedSheet(SCHOOL_YEARS_SHEET, SCHOOL_YEARS_HEADERS),
      SCHOOL_YEARS_HEADERS,
    ),
  ).filter(function (year) {
    return year.id === id;
  })[0];
}

function toStudentSummaryGs(student) {
  const enrollment = currentEnrollmentGs(student.id);
  const classroom = enrollment ? classroomById(enrollment.classroom_id) : null;
  const year = classroom ? schoolYearById(classroom.school_year_id) : null;
  const primaryId = primaryGuardianIdGs(student.id);
  const primary = primaryId ? latestGuardianById(primaryId, false) : null;
  const ageYears = studentAgeYearsGs(student);
  return {
    id: student.id,
    fullName: student.full_name,
    active: student.active === 'true',
    ageLabel: studentAgeLabelGs(student),
    classroomName: classroom ? classroom.name : null,
    schoolYearLabel: year ? year.label : null,
    isHomonym: false,
    primaryGuardianName: primary ? primary.full_name : null,
    needsGuardian: needsGuardianGs(ageYears, Boolean(primaryId)),
  };
}

function markHomonymsGs(summaries) {
  const counts = {};
  summaries.forEach(function (item) {
    const key = personNameKey(item.fullName);
    counts[key] = (counts[key] || 0) + 1;
  });
  return summaries.map(function (item) {
    return Object.assign({}, item, {
      isHomonym: (counts[personNameKey(item.fullName)] || 0) > 1,
    });
  });
}

function latestStudentById(id) {
  if (!REQUEST_ID_PATTERN.test(id)) {
    throw new Error(
      'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
    );
  }
  const student = latestRecordsById(
    listSheetRecords(
      openNamedSheet(STUDENTS_SHEET, STUDENTS_HEADERS),
      STUDENTS_HEADERS,
    ),
  ).filter(function (item) {
    return item.id === id;
  })[0];
  if (!student) {
    throw new Error('STUDENT_NOT_FOUND: Aluno não encontrado.');
  }
  return student;
}

function toStudentDetailGs(student) {
  const summary = toStudentSummaryGs(student);
  const enrollments = listSheetRecords(
    openNamedSheet(STUDENT_ENROLLMENTS_SHEET, STUDENT_ENROLLMENTS_HEADERS),
    STUDENT_ENROLLMENTS_HEADERS,
  )
    .filter(function (item) {
      return item.student_id === student.id;
    })
    .map(function (item) {
      const classroom = classroomById(item.classroom_id);
      const year = classroom ? schoolYearById(classroom.school_year_id) : null;
      return {
        id: item.id,
        classroomId: item.classroom_id,
        classroomName: classroom ? classroom.name : '',
        schoolYearLabel: year ? year.label : '',
        startedOn: item.started_on,
        endedOn: item.ended_on || null,
      };
    });
  return Object.assign({}, summary, {
    birthDate: student.birth_date || null,
    approximateAge: student.approximate_age
      ? Number(student.approximate_age)
      : null,
    approximateAgeReferenceYear: student.approximate_age_reference_year
      ? Number(student.approximate_age_reference_year)
      : null,
    enrollments: enrollments,
  });
}

function appendStudentRecord(record) {
  openNamedSheet(STUDENTS_SHEET, STUDENTS_HEADERS).appendRow([
    record.id,
    record.full_name,
    record.birth_date,
    record.approximate_age,
    record.approximate_age_reference_year,
    record.active,
    record.created_at,
    record.updated_at,
  ]);
}

function enrollStudentUnlocked(studentId, classroomId, startedOn, createdBy) {
  if (!REQUEST_ID_PATTERN.test(String(classroomId || ''))) {
    throw new Error(
      'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
    );
  }
  if (!isCivilDate(startedOn)) {
    throw new Error(
      'INVALID_ENROLLMENT_DATE: A matrícula precisa de uma data civil de início.',
    );
  }
  const classroom = classroomById(classroomId);
  if (!classroom) {
    throw new Error('CLASSROOM_NOT_FOUND: Turma não encontrada.');
  }
  const current = currentEnrollmentGs(studentId);
  const now = new Date().toISOString();
  const enrollments = openNamedSheet(
    STUDENT_ENROLLMENTS_SHEET,
    STUDENT_ENROLLMENTS_HEADERS,
  );
  if (current && current.classroom_id === classroomId) {
    return;
  }
  if (current) {
    enrollments.appendRow([
      current.id,
      current.student_id,
      current.classroom_id,
      current.started_on,
      startedOn,
      current.created_by,
      current.created_at,
    ]);
  }
  enrollments.appendRow([
    Utilities.getUuid(),
    studentId,
    classroomId,
    startedOn,
    '',
    createdBy,
    now,
  ]);
}

function seedE2EStudentsUnlocked() {
  setupSchema();
  const now = new Date().toISOString();
  const yearId = Utilities.getUuid();
  const classA = Utilities.getUuid();
  const classB = Utilities.getUuid();
  openNamedSheet(SCHOOL_YEARS_SHEET, SCHOOL_YEARS_HEADERS).appendRow([
    yearId,
    '2026',
    '2026-02-01',
    '',
    'true',
    now,
  ]);
  openNamedSheet(CLASSROOMS_SHEET, CLASSROOMS_HEADERS).appendRow([
    classA,
    yearId,
    '3º A',
    'true',
    now,
  ]);
  openNamedSheet(CLASSROOMS_SHEET, CLASSROOMS_HEADERS).appendRow([
    classB,
    yearId,
    '2º B',
    'true',
    now,
  ]);
  const anaApprox = Utilities.getUuid();
  const anaBirth = Utilities.getUuid();
  const bruno = Utilities.getUuid();
  appendStudentRecord({
    id: anaApprox,
    full_name: 'Ana Souza',
    birth_date: '',
    approximate_age: '8',
    approximate_age_reference_year: '2026',
    active: 'true',
    created_at: now,
    updated_at: now,
  });
  appendStudentRecord({
    id: anaBirth,
    full_name: 'Ana Souza',
    birth_date: '2016-03-10',
    approximate_age: '',
    approximate_age_reference_year: '',
    active: 'true',
    created_at: now,
    updated_at: now,
  });
  appendStudentRecord({
    id: bruno,
    full_name: 'Bruno Lima',
    birth_date: '2015-06-01',
    approximate_age: '',
    approximate_age_reference_year: '',
    active: 'true',
    created_at: now,
    updated_at: now,
  });
  enrollStudentUnlocked(anaApprox, classA, '2026-02-01', 'e2e-seed');
  enrollStudentUnlocked(anaBirth, classB, '2026-02-01', 'e2e-seed');
  enrollStudentUnlocked(bruno, classA, '2026-02-01', 'e2e-seed');
  return {
    anaApprox: anaApprox,
    anaBirth: anaBirth,
    bruno: bruno,
  };
}

function seedE2EGuardiansUnlocked() {
  setupSchema();
  const now = new Date().toISOString();
  const students = latestRecordsById(
    listSheetRecords(
      openNamedSheet(STUDENTS_SHEET, STUDENTS_HEADERS),
      STUDENTS_HEADERS,
    ),
  );
  let anaApprox = null;
  let anaBirth = null;
  let bruno = null;
  students.forEach(function (student) {
    if (student.full_name === 'Ana Souza' && student.approximate_age === '8') {
      anaApprox = student;
    }
    if (
      student.full_name === 'Ana Souza' &&
      student.birth_date === '2016-03-10'
    ) {
      anaBirth = student;
    }
    if (student.full_name === 'Bruno Lima') {
      bruno = student;
    }
  });
  if (!anaApprox || !anaBirth || !bruno) {
    return;
  }
  const settings = openNamedSheet(SETTINGS_SHEET, SETTINGS_HEADERS);
  settings.appendRow([
    REQUIRE_GUARDIAN_BELOW_AGE_KEY,
    String(DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE),
  ]);
  const mariaId = Utilities.getUuid();
  const pauloId = Utilities.getUuid();
  appendGuardianRecord({
    id: mariaId,
    full_name: 'Maria Souza',
    phone: '11999990001',
    whatsapp_enabled: 'true',
    relation_label: 'mãe',
    active: 'true',
    created_at: now,
    updated_at: now,
  });
  appendGuardianRecord({
    id: pauloId,
    full_name: 'Paulo Nunes',
    phone: '11999990002',
    whatsapp_enabled: 'false',
    relation_label: 'pai',
    active: 'true',
    created_at: now,
    updated_at: now,
  });
  appendGuardianLinkGs({
    studentId: anaApprox.id,
    guardianId: mariaId,
    isPrimary: true,
    createdAt: now,
  });
  appendGuardianLinkGs({
    studentId: bruno.id,
    guardianId: mariaId,
    isPrimary: true,
    createdAt: now,
  });
  appendGuardianLinkGs({
    studentId: anaBirth.id,
    guardianId: pauloId,
    isPrimary: true,
    createdAt: now,
  });
  openNamedSheet(
    STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
    STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS,
  ).appendRow([
    Utilities.getUuid(),
    bruno.id,
    anaApprox.id,
    'true',
    'false',
    'true',
    now,
    '',
    Utilities.getUuid(),
    '',
  ]);
}

function listSchoolYears(sessionToken) {
  requireAction(sessionToken, 'students.read');
  return latestRecordsById(
    listSheetRecords(
      openNamedSheet(SCHOOL_YEARS_SHEET, SCHOOL_YEARS_HEADERS),
      SCHOOL_YEARS_HEADERS,
    ),
  ).map(function (year) {
    return {
      id: year.id,
      label: year.label,
      startedOn: year.started_on,
      endedOn: year.ended_on || null,
      active: year.active === 'true',
    };
  });
}

function createSchoolYear(sessionToken, payload) {
  const session = requireAction(sessionToken, 'school_years.manage');
  return withScriptLock(function () {
    setupSchema();
    if (
      !payload ||
      !String(payload.label || '').trim() ||
      !isCivilDate(payload.startedOn)
    ) {
      throw new Error(
        'INVALID_SCHOOL_YEAR: Informe o nome do ano letivo e a data de início.',
      );
    }
    const record = {
      id: Utilities.getUuid(),
      label: String(payload.label).trim(),
      startedOn: payload.startedOn,
      endedOn: isCivilDate(payload.endedOn) ? payload.endedOn : null,
      active: true,
    };
    openNamedSheet(SCHOOL_YEARS_SHEET, SCHOOL_YEARS_HEADERS).appendRow([
      record.id,
      record.label,
      record.startedOn,
      record.endedOn || '',
      'true',
      new Date().toISOString(),
    ]);
    void session;
    return record;
  });
}

function listClassrooms(sessionToken, schoolYearId) {
  requireAction(sessionToken, 'students.read');
  return latestRecordsById(
    listSheetRecords(
      openNamedSheet(CLASSROOMS_SHEET, CLASSROOMS_HEADERS),
      CLASSROOMS_HEADERS,
    ),
  )
    .filter(function (room) {
      return !schoolYearId || room.school_year_id === schoolYearId;
    })
    .map(function (room) {
      return {
        id: room.id,
        schoolYearId: room.school_year_id,
        name: room.name,
        active: room.active === 'true',
      };
    });
}

function createClassroom(sessionToken, payload) {
  requireAction(sessionToken, 'classrooms.manage');
  return withScriptLock(function () {
    setupSchema();
    if (!payload || !REQUEST_ID_PATTERN.test(payload.schoolYearId)) {
      throw new Error(
        'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
      );
    }
    if (!schoolYearById(payload.schoolYearId)) {
      throw new Error('SCHOOL_YEAR_NOT_FOUND: Ano letivo não encontrado.');
    }
    if (!String(payload.name || '').trim()) {
      throw new Error('INVALID_CLASSROOM: Informe o nome da turma.');
    }
    const record = {
      id: Utilities.getUuid(),
      schoolYearId: payload.schoolYearId,
      name: String(payload.name).trim(),
      active: true,
    };
    openNamedSheet(CLASSROOMS_SHEET, CLASSROOMS_HEADERS).appendRow([
      record.id,
      record.schoolYearId,
      record.name,
      'true',
      new Date().toISOString(),
    ]);
    return record;
  });
}

function listStudents(sessionToken, query) {
  requireAction(sessionToken, 'students.read');
  const includeInactive = !query || query.includeInactive !== false;
  const summaries = latestRecordsById(
    listSheetRecords(
      openNamedSheet(STUDENTS_SHEET, STUDENTS_HEADERS),
      STUDENTS_HEADERS,
    ),
  )
    .filter(function (student) {
      return includeInactive || student.active === 'true';
    })
    .map(toStudentSummaryGs);
  return markHomonymsGs(summaries);
}

function getStudent(sessionToken, id) {
  requireAction(sessionToken, 'students.read');
  return toStudentDetailGs(latestStudentById(id));
}

function createStudent(sessionToken, payload) {
  const session = requireAction(sessionToken, 'students.write');
  return withScriptLock(function () {
    setupSchema();
    const profile = validateStudentProfileGs(payload || {});
    const now = new Date().toISOString();
    const record = Object.assign(
      {
        id: Utilities.getUuid(),
        active: 'true',
        created_at: now,
        updated_at: now,
      },
      profile,
    );
    appendStudentRecord(record);
    if (payload && payload.classroomId) {
      enrollStudentUnlocked(
        record.id,
        payload.classroomId,
        payload.startedOn || todayCivil(),
        session.user_id,
      );
    }
    return toStudentDetailGs(record);
  });
}

function updateStudent(sessionToken, id, payload) {
  requireAction(sessionToken, 'students.write');
  return withScriptLock(function () {
    setupSchema();
    const previous = latestStudentById(id);
    const profile = validateStudentProfileGs(payload || {});
    const record = Object.assign({}, previous, profile, {
      updated_at: new Date().toISOString(),
    });
    appendStudentRecord(record);
    return toStudentDetailGs(record);
  });
}

function deactivateStudent(sessionToken, id) {
  requireAction(sessionToken, 'students.write');
  return withScriptLock(function () {
    setupSchema();
    const previous = latestStudentById(id);
    if (previous.active !== 'true') {
      throw new Error('STUDENT_ALREADY_INACTIVE: Este aluno já está inativo.');
    }
    const record = Object.assign({}, previous, {
      active: 'false',
      updated_at: new Date().toISOString(),
    });
    appendStudentRecord(record);
    return toStudentDetailGs(record);
  });
}

function reactivateStudent(sessionToken, id, payload) {
  const session = requireAction(sessionToken, 'students.write');
  return withScriptLock(function () {
    setupSchema();
    const previous = latestStudentById(id);
    if (previous.active === 'true') {
      throw new Error('STUDENT_ALREADY_ACTIVE: Este aluno já está ativo.');
    }
    if (!payload || payload.reviewed !== true) {
      throw new Error(
        'REACTIVATION_REVIEW_REQUIRED: Revise o cadastro antes de reativar.',
      );
    }
    const profile = validateStudentProfileGs({
      fullName: (payload && payload.fullName) || previous.full_name,
      birthDate:
        payload && payload.birthDate !== undefined
          ? payload.birthDate
          : previous.birth_date,
      approximateAge:
        payload && payload.approximateAge !== undefined
          ? payload.approximateAge
          : previous.approximate_age,
      approximateAgeReferenceYear:
        payload && payload.approximateAgeReferenceYear !== undefined
          ? payload.approximateAgeReferenceYear
          : previous.approximate_age_reference_year,
    });
    const record = Object.assign({}, previous, profile, {
      active: 'true',
      updated_at: new Date().toISOString(),
    });
    appendStudentRecord(record);
    if (payload.classroomId) {
      enrollStudentUnlocked(
        id,
        payload.classroomId,
        payload.startedOn || todayCivil(),
        session.user_id,
      );
    }
    return toStudentDetailGs(latestStudentById(id));
  });
}

function enrollStudent(sessionToken, id, payload) {
  const session = requireAction(sessionToken, 'students.write');
  return withScriptLock(function () {
    setupSchema();
    const student = latestStudentById(id);
    if (student.active !== 'true') {
      throw new Error(
        'STUDENT_INACTIVE: Reative o aluno antes de mudar a turma.',
      );
    }
    enrollStudentUnlocked(
      id,
      payload && payload.classroomId,
      payload && payload.startedOn,
      session.user_id,
    );
    return toStudentDetailGs(latestStudentById(id));
  });
}

function normalizePhoneGs(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '';
  }
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) {
    throw new Error('INVALID_PHONE: Informe um telefone com DDD, só números.');
  }
  return digits;
}

function validateGuardianProfileGs(payload) {
  const fullName = normalizePersonName(
    payload && payload.fullName ? String(payload.fullName) : '',
  );
  if (fullName.length < 2) {
    throw new Error(
      'GUARDIAN_NAME_REQUIRED: Informe o nome completo do responsável.',
    );
  }
  const relation = normalizePersonName(
    payload && payload.relationLabel ? String(payload.relationLabel) : '',
  );
  return {
    full_name: fullName,
    phone: normalizePhoneGs(payload && payload.phone),
    whatsapp_enabled:
      payload && payload.whatsappEnabled === true ? 'true' : 'false',
    relation_label: relation,
  };
}

function listGuardianRecords() {
  return listSheetRecords(
    openNamedSheet(GUARDIANS_SHEET, GUARDIANS_HEADERS),
    GUARDIANS_HEADERS,
  );
}

function listGuardianLinkRecords() {
  return listSheetRecords(
    openNamedSheet(STUDENT_GUARDIANS_SHEET, STUDENT_GUARDIANS_HEADERS),
    STUDENT_GUARDIANS_HEADERS,
  );
}

function listAuthorizationRecords() {
  return listSheetRecords(
    openNamedSheet(
      STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
      STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS,
    ),
    STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS,
  );
}

function latestActiveLinksGs() {
  return latestRecordsById(listGuardianLinkRecords()).filter(function (record) {
    return record.active === 'true' && record.ended_at === '';
  });
}

function primaryGuardianIdGs(studentId) {
  const primary = latestActiveLinksGs().filter(function (record) {
    return record.student_id === studentId && record.is_primary === 'true';
  })[0];
  return primary ? primary.guardian_id : null;
}

function siblingStudentIdsGs(studentId) {
  const active = latestActiveLinksGs();
  const guardianIds = {};
  active.forEach(function (record) {
    if (record.student_id === studentId) {
      guardianIds[record.guardian_id] = true;
    }
  });
  const siblings = {};
  active.forEach(function (record) {
    if (guardianIds[record.guardian_id] && record.student_id !== studentId) {
      siblings[record.student_id] = true;
    }
  });
  return Object.keys(siblings);
}

function studentAgeYearsGs(student) {
  return Number(String(studentAgeLabelGs(student)).replace('~', ''));
}

function requireGuardianBelowAgeGs() {
  const records = listSheetRecords(
    openNamedSheet(SETTINGS_SHEET, SETTINGS_HEADERS),
    SETTINGS_HEADERS,
  );
  let value = '';
  records.forEach(function (record) {
    if (record.key === REQUIRE_GUARDIAN_BELOW_AGE_KEY) {
      value = record.value;
    }
  });
  const age = Number(value);
  if (!Number.isInteger(age) || age < 1 || age > 21) {
    return DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE;
  }
  return age;
}

function needsGuardianGs(ageYears, hasPrimary) {
  return ageYears < requireGuardianBelowAgeGs() && !hasPrimary;
}

function latestGuardianById(id, required) {
  if (!REQUEST_ID_PATTERN.test(id)) {
    throw new Error(
      'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
    );
  }
  const guardian = latestRecordsById(listGuardianRecords()).filter(
    function (item) {
      return item.id === id;
    },
  )[0];
  if (!guardian && required) {
    throw new Error('GUARDIAN_NOT_FOUND: Responsável não encontrado.');
  }
  return guardian || null;
}

function appendGuardianRecord(record) {
  openNamedSheet(GUARDIANS_SHEET, GUARDIANS_HEADERS).appendRow([
    record.id,
    record.full_name,
    record.phone,
    record.whatsapp_enabled,
    record.relation_label,
    record.active,
    record.created_at,
    record.updated_at,
  ]);
}

function appendGuardianLinkRecord(record) {
  openNamedSheet(STUDENT_GUARDIANS_SHEET, STUDENT_GUARDIANS_HEADERS).appendRow([
    record.id,
    record.student_id,
    record.guardian_id,
    record.is_primary,
    record.can_use_guardian_credit,
    record.auto_settle_debt_from_guardian_credit,
    record.active,
    record.started_at,
    record.ended_at,
    record.note,
    record.created_at,
  ]);
}

function appendGuardianLinkGs(input) {
  const existing = listGuardianLinkRecords();
  const latest = {};
  existing.forEach(function (record) {
    latest[record.id] = record;
  });
  const activeLatest = Object.keys(latest)
    .map(function (id) {
      return latest[id];
    })
    .filter(function (record) {
      return record.active === 'true' && record.ended_at === '';
    });
  const current = activeLatest.filter(function (record) {
    return (
      record.student_id === input.studentId &&
      record.guardian_id === input.guardianId
    );
  })[0];
  const previousPrimary = activeLatest.filter(function (record) {
    return (
      record.student_id === input.studentId &&
      record.is_primary === 'true' &&
      record.guardian_id !== input.guardianId
    );
  })[0];
  const hasPrimary = activeLatest.some(function (record) {
    return (
      record.student_id === input.studentId && record.is_primary === 'true'
    );
  });
  const makePrimary = input.isPrimary || (!current && !hasPrimary);
  if (makePrimary && previousPrimary) {
    appendGuardianLinkRecord(
      Object.assign({}, previousPrimary, { is_primary: 'false' }),
    );
  }
  appendGuardianLinkRecord({
    id: current ? current.id : Utilities.getUuid(),
    student_id: input.studentId,
    guardian_id: input.guardianId,
    is_primary: makePrimary ? 'true' : 'false',
    can_use_guardian_credit: input.canUseGuardianCredit ? 'true' : 'false',
    auto_settle_debt_from_guardian_credit: input.autoSettle ? 'true' : 'false',
    active: 'true',
    started_at: current ? current.started_at : input.createdAt,
    ended_at: '',
    note: input.note ? String(input.note).trim() : current ? current.note : '',
    created_at: current ? current.created_at : input.createdAt,
  });
}

function toGuardianGs(record) {
  return {
    id: record.id,
    fullName: record.full_name,
    phone: record.phone,
    whatsappEnabled: record.whatsapp_enabled === 'true',
    relationLabel: record.relation_label,
    active: record.active === 'true',
  };
}

function toGuardianLinkGs(record) {
  const guardian = latestGuardianById(record.guardian_id, false);
  return {
    id: record.id,
    studentId: record.student_id,
    guardianId: record.guardian_id,
    guardianName: guardian ? guardian.full_name : '',
    isPrimary: record.is_primary === 'true',
    canUseGuardianCredit: record.can_use_guardian_credit === 'true',
    autoSettleDebtFromGuardianCredit:
      record.auto_settle_debt_from_guardian_credit === 'true',
    active: record.active === 'true',
    startedAt: record.started_at,
    endedAt: record.ended_at || null,
    note: record.note,
  };
}

function studentNameByIdGs(id) {
  const student = latestRecordsById(
    listSheetRecords(
      openNamedSheet(STUDENTS_SHEET, STUDENTS_HEADERS),
      STUDENTS_HEADERS,
    ),
  ).filter(function (item) {
    return item.id === id;
  })[0];
  return student ? student.full_name : '';
}

function toAuthorizationGs(record) {
  return {
    id: record.id,
    consumerStudentId: record.consumer_student_id,
    accountStudentId: record.account_student_id,
    consumerName: studentNameByIdGs(record.consumer_student_id),
    accountName: studentNameByIdGs(record.account_student_id),
    canChargeAccount: record.can_charge_account === 'true',
    canUseAccountCredit: record.can_use_account_credit === 'true',
    active: record.active === 'true',
    authorizedAt: record.authorized_at,
    revokedAt: record.revoked_at || null,
    note: record.note,
  };
}

function listStudentGuardianLinksUnlocked(studentId) {
  return latestRecordsById(listGuardianLinkRecords())
    .filter(function (record) {
      return record.student_id === studentId;
    })
    .map(toGuardianLinkGs);
}

function listGuardians(sessionToken, query) {
  requireAction(sessionToken, 'guardians.read');
  const includeInactive = !query || query.includeInactive !== false;
  return latestRecordsById(listGuardianRecords())
    .filter(function (record) {
      return includeInactive || record.active === 'true';
    })
    .map(toGuardianGs);
}

function createGuardian(sessionToken, payload) {
  requireAction(sessionToken, 'guardians.write');
  return withScriptLock(function () {
    setupSchema();
    const profile = validateGuardianProfileGs(payload || {});
    const now = new Date().toISOString();
    const record = Object.assign(
      {
        id: Utilities.getUuid(),
        active: 'true',
        created_at: now,
        updated_at: now,
      },
      profile,
    );
    appendGuardianRecord(record);
    return toGuardianGs(record);
  });
}

function updateGuardian(sessionToken, id, payload) {
  requireAction(sessionToken, 'guardians.write');
  return withScriptLock(function () {
    setupSchema();
    const previous = latestGuardianById(id, true);
    const profile = validateGuardianProfileGs(payload || {});
    const record = Object.assign({}, previous, profile, {
      updated_at: new Date().toISOString(),
    });
    appendGuardianRecord(record);
    return toGuardianGs(record);
  });
}

function getStudentGuardians(sessionToken, studentId) {
  requireAction(sessionToken, 'guardians.read');
  latestStudentById(studentId);
  return listStudentGuardianLinksUnlocked(studentId);
}

function linkGuardian(sessionToken, studentId, guardianId, payload) {
  requireAction(sessionToken, 'guardians.write');
  return withScriptLock(function () {
    setupSchema();
    latestStudentById(studentId);
    latestGuardianById(guardianId, true);
    appendGuardianLinkGs({
      studentId: studentId,
      guardianId: guardianId,
      isPrimary: payload && payload.isPrimary === true,
      canUseGuardianCredit: payload && payload.canUseGuardianCredit === true,
      autoSettle: payload && payload.autoSettle === true,
      note: payload && payload.note,
      createdAt: new Date().toISOString(),
    });
    return listStudentGuardianLinksUnlocked(studentId);
  });
}

function setPrimaryGuardian(sessionToken, studentId, guardianId) {
  return linkGuardian(sessionToken, studentId, guardianId, { isPrimary: true });
}

function unlinkGuardian(sessionToken, studentId, guardianId) {
  requireAction(sessionToken, 'guardians.write');
  return withScriptLock(function () {
    setupSchema();
    if (
      !REQUEST_ID_PATTERN.test(studentId) ||
      !REQUEST_ID_PATTERN.test(guardianId)
    ) {
      throw new Error(
        'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
      );
    }
    const current = latestActiveLinksGs().filter(function (record) {
      return (
        record.student_id === studentId && record.guardian_id === guardianId
      );
    })[0];
    if (!current) {
      throw new Error(
        'GUARDIAN_LINK_NOT_FOUND: Este responsável não está vinculado ao aluno.',
      );
    }
    appendGuardianLinkRecord(
      Object.assign({}, current, {
        active: 'false',
        ended_at: new Date().toISOString(),
      }),
    );
    return listStudentGuardianLinksUnlocked(studentId);
  });
}

function listSiblings(sessionToken, studentId) {
  requireAction(sessionToken, 'guardians.read');
  latestStudentById(studentId);
  const siblingIds = siblingStudentIdsGs(studentId);
  const summaries = latestRecordsById(
    listSheetRecords(
      openNamedSheet(STUDENTS_SHEET, STUDENTS_HEADERS),
      STUDENTS_HEADERS,
    ),
  )
    .filter(function (student) {
      return siblingIds.indexOf(student.id) !== -1;
    })
    .map(toStudentSummaryGs);
  return markHomonymsGs(summaries);
}

function authorizeSibling(sessionToken, payload) {
  const session = requireAction(sessionToken, 'guardians.write');
  return withScriptLock(function () {
    setupSchema();
    const consumerId = payload && payload.consumerStudentId;
    const accountId = payload && payload.accountStudentId;
    latestStudentById(consumerId);
    latestStudentById(accountId);
    if (consumerId === accountId) {
      throw new Error(
        'SELF_AUTHORIZATION: Um aluno não autoriza a própria conta.',
      );
    }
    if (siblingStudentIdsGs(consumerId).indexOf(accountId) === -1) {
      throw new Error(
        'NOT_SIBLINGS: Só irmãos que compartilham responsável podem se autorizar.',
      );
    }
    if (
      !(payload && payload.canChargeAccount) &&
      !(payload && payload.canUseAccountCredit)
    ) {
      throw new Error(
        'AUTHORIZATION_REQUIRED: Escolha lançar na conta ou usar o crédito do irmão.',
      );
    }
    const record = {
      id: Utilities.getUuid(),
      consumer_student_id: consumerId,
      account_student_id: accountId,
      can_charge_account: payload.canChargeAccount === true ? 'true' : 'false',
      can_use_account_credit:
        payload.canUseAccountCredit === true ? 'true' : 'false',
      active: 'true',
      authorized_at: new Date().toISOString(),
      revoked_at: '',
      created_by: session.user_id,
      note: payload.note ? String(payload.note).trim() : '',
    };
    openNamedSheet(
      STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
      STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS,
    ).appendRow([
      record.id,
      record.consumer_student_id,
      record.account_student_id,
      record.can_charge_account,
      record.can_use_account_credit,
      record.active,
      record.authorized_at,
      record.revoked_at,
      record.created_by,
      record.note,
    ]);
    return toAuthorizationGs(record);
  });
}

function revokeSiblingAuthorization(sessionToken, id) {
  requireAction(sessionToken, 'guardians.write');
  return withScriptLock(function () {
    setupSchema();
    if (!REQUEST_ID_PATTERN.test(id)) {
      throw new Error(
        'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
      );
    }
    const current = latestRecordsById(listAuthorizationRecords()).filter(
      function (record) {
        return (
          record.id === id &&
          record.active === 'true' &&
          record.revoked_at === ''
        );
      },
    )[0];
    if (!current) {
      throw new Error(
        'AUTHORIZATION_NOT_FOUND: Autorização de irmão não encontrada.',
      );
    }
    const record = Object.assign({}, current, {
      active: 'false',
      revoked_at: new Date().toISOString(),
    });
    openNamedSheet(
      STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
      STUDENT_ACCOUNT_AUTHORIZATIONS_HEADERS,
    ).appendRow([
      record.id,
      record.consumer_student_id,
      record.account_student_id,
      record.can_charge_account,
      record.can_use_account_credit,
      record.active,
      record.authorized_at,
      record.revoked_at,
      record.created_by,
      record.note,
    ]);
    return toAuthorizationGs(record);
  });
}

function listSiblingAuthorizations(sessionToken, studentId) {
  requireAction(sessionToken, 'guardians.read');
  if (studentId) {
    latestStudentById(studentId);
  }
  return latestRecordsById(listAuthorizationRecords())
    .filter(function (record) {
      return (
        !studentId ||
        record.consumer_student_id === studentId ||
        record.account_student_id === studentId
      );
    })
    .map(toAuthorizationGs);
}

function getGuardianSettings(sessionToken) {
  requireAction(sessionToken, 'guardians.read');
  return {
    requireGuardianBelowAge: requireGuardianBelowAgeGs(),
  };
}

function setRequireGuardianBelowAge(sessionToken, age) {
  requireAction(sessionToken, 'settings.manage');
  return withScriptLock(function () {
    setupSchema();
    const parsed = Number(age);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 21) {
      throw new Error(
        'INVALID_GUARDIAN_AGE_SETTING: A idade para pedir responsável deve ser um número entre 1 e 21.',
      );
    }
    openNamedSheet(SETTINGS_SHEET, SETTINGS_HEADERS).appendRow([
      REQUIRE_GUARDIAN_BELOW_AGE_KEY,
      String(parsed),
    ]);
    return { requireGuardianBelowAge: parsed };
  });
}

function parseCentsGs(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(String(value).trim())) {
    return Number(String(value).trim());
  }
  throw new Error(
    'INVALID_CENTS: O preço precisa ser um valor em centavos, número inteiro.',
  );
}

function formatBrlGs(cents) {
  const safe =
    Number.isInteger(cents) && cents >= 0 ? cents : parseCentsGs(cents);
  const reais = Math.floor(safe / 100);
  let fraction = String(safe % 100);
  if (fraction.length < 2) {
    fraction = '0' + fraction;
  }
  return 'R$ ' + reais + ',' + fraction;
}

function validateProductProfileGs(payload) {
  const name = normalizePersonName(
    payload && payload.name ? String(payload.name) : '',
  );
  if (name.length < 2) {
    throw new Error('PRODUCT_NAME_REQUIRED: Informe o nome do produto.');
  }
  const categoryId = payload && payload.categoryId;
  if (!REQUEST_ID_PATTERN.test(String(categoryId || ''))) {
    throw new Error(
      'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
    );
  }
  return {
    name: name,
    category_id: categoryId,
    price_cents: String(parseCentsGs(payload && payload.priceCents)),
    discount_allowed:
      payload && payload.discountAllowed === true ? 'true' : 'false',
    stock_tracked: payload && payload.stockTracked === true ? 'true' : 'false',
    reservable: payload && payload.reservable === true ? 'true' : 'false',
  };
}

function listCategoryRecords() {
  return listSheetRecords(
    openNamedSheet(PRODUCT_CATEGORIES_SHEET, PRODUCT_CATEGORIES_HEADERS),
    PRODUCT_CATEGORIES_HEADERS,
  );
}

function listProductRecords() {
  return listSheetRecords(
    openNamedSheet(PRODUCTS_SHEET, PRODUCTS_HEADERS),
    PRODUCTS_HEADERS,
  );
}

function listPriceHistoryRecords() {
  return listSheetRecords(
    openNamedSheet(PRODUCT_PRICE_HISTORY_SHEET, PRODUCT_PRICE_HISTORY_HEADERS),
    PRODUCT_PRICE_HISTORY_HEADERS,
  );
}

function latestCategoryById(id, required) {
  if (!REQUEST_ID_PATTERN.test(id)) {
    throw new Error(
      'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
    );
  }
  const category = latestRecordsById(listCategoryRecords()).filter(
    function (item) {
      return item.id === id;
    },
  )[0];
  if (!category && required) {
    throw new Error('CATEGORY_NOT_FOUND: Categoria não encontrada.');
  }
  return category || null;
}

function latestProductById(id) {
  if (!REQUEST_ID_PATTERN.test(id)) {
    throw new Error(
      'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
    );
  }
  const product = latestRecordsById(listProductRecords()).filter(
    function (item) {
      return item.id === id;
    },
  )[0];
  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND: Produto não encontrado.');
  }
  return product;
}

function appendProductRecord(record) {
  openNamedSheet(PRODUCTS_SHEET, PRODUCTS_HEADERS).appendRow([
    record.id,
    record.category_id,
    record.name,
    record.price_cents,
    record.discount_allowed,
    record.stock_tracked,
    record.reservable,
    record.active,
    record.created_at,
    record.updated_at,
  ]);
}

function appendPriceHistoryGs(productId, priceCents, createdBy, changedAt) {
  const existing = listPriceHistoryRecords().filter(function (record) {
    return record.product_id === productId && record.ended_at === '';
  });
  const current = existing.length ? existing[existing.length - 1] : null;
  const history = openNamedSheet(
    PRODUCT_PRICE_HISTORY_SHEET,
    PRODUCT_PRICE_HISTORY_HEADERS,
  );
  if (current && current.price_cents === String(priceCents)) {
    return;
  }
  if (current) {
    history.appendRow([
      current.id,
      current.product_id,
      current.price_cents,
      current.started_at,
      changedAt,
      current.created_by,
    ]);
  }
  history.appendRow([
    Utilities.getUuid(),
    productId,
    String(priceCents),
    changedAt,
    '',
    createdBy,
  ]);
}

function toProductGs(record) {
  const category = latestCategoryById(record.category_id, false);
  const priceCents = Number(record.price_cents);
  return {
    id: record.id,
    categoryId: record.category_id,
    categoryName: category ? category.name : '',
    name: record.name,
    priceCents: priceCents,
    priceLabel: formatBrlGs(priceCents),
    discountAllowed: record.discount_allowed === 'true',
    stockTracked: record.stock_tracked === 'true',
    reservable: record.reservable === 'true',
    active: record.active === 'true',
  };
}

function seedE2EProductsUnlocked() {
  setupSchema();
  const now = new Date().toISOString();
  const names = ['Salgados', 'Bebidas', 'Doces', 'Outros'];
  const ids = {};
  names.forEach(function (name, index) {
    const id = Utilities.getUuid();
    ids[name] = id;
    openNamedSheet(
      PRODUCT_CATEGORIES_SHEET,
      PRODUCT_CATEGORIES_HEADERS,
    ).appendRow([id, name, String(index + 1), 'true', now]);
  });
  const items = [
    {
      name: 'Coxinha',
      category: 'Salgados',
      price: 550,
      discount: true,
      stock: true,
      reservable: false,
    },
    {
      name: 'Suco de uva',
      category: 'Bebidas',
      price: 400,
      discount: false,
      stock: true,
      reservable: true,
    },
    {
      name: 'Brigadeiro',
      category: 'Doces',
      price: 250,
      discount: true,
      stock: false,
      reservable: false,
    },
  ];
  items.forEach(function (item) {
    const id = Utilities.getUuid();
    appendProductRecord({
      id: id,
      category_id: ids[item.category],
      name: item.name,
      price_cents: String(item.price),
      discount_allowed: item.discount ? 'true' : 'false',
      stock_tracked: item.stock ? 'true' : 'false',
      reservable: item.reservable ? 'true' : 'false',
      active: 'true',
      created_at: now,
      updated_at: now,
    });
    appendPriceHistoryGs(id, item.price, Utilities.getUuid(), now);
  });
}

function listProductCategories(sessionToken) {
  requireAction(sessionToken, 'products.read');
  return latestRecordsById(listCategoryRecords())
    .slice()
    .sort(function (left, right) {
      return Number(left.sort_order) - Number(right.sort_order);
    })
    .map(function (category) {
      return {
        id: category.id,
        name: category.name,
        active: category.active === 'true',
      };
    });
}

function listProducts(sessionToken, query) {
  requireAction(sessionToken, 'products.read');
  const includeInactive = !query || query.includeInactive !== false;
  return latestRecordsById(listProductRecords())
    .filter(function (product) {
      return includeInactive || product.active === 'true';
    })
    .map(toProductGs);
}

function createProduct(sessionToken, payload) {
  const session = requireAction(sessionToken, 'products.write');
  return withScriptLock(function () {
    setupSchema();
    const profile = validateProductProfileGs(payload || {});
    latestCategoryById(profile.category_id, true);
    const now = new Date().toISOString();
    const record = Object.assign(
      {
        id: Utilities.getUuid(),
        active: 'true',
        created_at: now,
        updated_at: now,
      },
      profile,
    );
    appendProductRecord(record);
    appendPriceHistoryGs(
      record.id,
      Number(record.price_cents),
      session.user_id,
      now,
    );
    return toProductGs(record);
  });
}

function updateProduct(sessionToken, id, payload) {
  const session = requireAction(sessionToken, 'products.write');
  return withScriptLock(function () {
    setupSchema();
    const previous = latestProductById(id);
    const profile = validateProductProfileGs(payload || {});
    latestCategoryById(profile.category_id, true);
    const now = new Date().toISOString();
    const record = Object.assign({}, previous, profile, { updated_at: now });
    appendProductRecord(record);
    appendPriceHistoryGs(
      record.id,
      Number(record.price_cents),
      session.user_id,
      now,
    );
    return toProductGs(record);
  });
}

function deactivateProduct(sessionToken, id) {
  requireAction(sessionToken, 'products.write');
  return withScriptLock(function () {
    setupSchema();
    const previous = latestProductById(id);
    if (previous.active !== 'true') {
      throw new Error(
        'PRODUCT_ALREADY_INACTIVE: Este produto já está inativo.',
      );
    }
    const record = Object.assign({}, previous, {
      active: 'false',
      updated_at: new Date().toISOString(),
    });
    appendProductRecord(record);
    return toProductGs(record);
  });
}

function listProductPriceHistory(sessionToken, productId) {
  requireAction(sessionToken, 'products.read');
  latestProductById(productId);
  return latestRecordsById(listPriceHistoryRecords())
    .filter(function (record) {
      return record.product_id === productId;
    })
    .map(function (record) {
      const priceCents = Number(record.price_cents);
      return {
        id: record.id,
        productId: record.product_id,
        priceCents: priceCents,
        priceLabel: formatBrlGs(priceCents),
        startedAt: record.started_at,
        endedAt: record.ended_at || null,
      };
    });
}

function createAdHocItem(sessionToken, payload) {
  const session = requireAction(sessionToken, 'ad_hoc.create');
  return withScriptLock(function () {
    setupSchema();
    const name = normalizePersonName(
      payload && payload.name ? String(payload.name) : '',
    );
    if (name.length < 2) {
      throw new Error('AD_HOC_NAME_REQUIRED: Informe o nome do item avulso.');
    }
    const priceCents = parseCentsGs(payload && payload.priceCents);
    const now = new Date().toISOString();
    const record = {
      id: Utilities.getUuid(),
      name: name,
      price_cents: String(priceCents),
      created_by: session.user_id,
      created_at: now,
    };
    openNamedSheet(AD_HOC_ITEMS_SHEET, AD_HOC_ITEMS_HEADERS).appendRow([
      record.id,
      record.name,
      record.price_cents,
      record.created_by,
      record.created_at,
    ]);
    return {
      id: record.id,
      name: record.name,
      priceCents: priceCents,
      priceLabel: formatBrlGs(priceCents),
      createdAt: record.created_at,
    };
  });
}

function listAdHocItems(sessionToken) {
  requireAction(sessionToken, 'ad_hoc.create');
  return listSheetRecords(
    openNamedSheet(AD_HOC_ITEMS_SHEET, AD_HOC_ITEMS_HEADERS),
    AD_HOC_ITEMS_HEADERS,
  ).map(function (record) {
    const priceCents = Number(record.price_cents);
    return {
      id: record.id,
      name: record.name,
      priceCents: priceCents,
      priceLabel: formatBrlGs(priceCents),
      createdAt: record.created_at,
    };
  });
}

function parseOpeningQuantityGs(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(String(value).trim())) {
    return Number(String(value).trim());
  }
  throw new Error(
    'INVALID_OPENING_QUANTITY: A quantidade inicial precisa ser um número inteiro, zero ou maior.',
  );
}

function parseQuantityDeltaGs(value) {
  var parsed = null;
  if (typeof value === 'number' && Number.isInteger(value)) {
    parsed = value;
  } else if (
    typeof value === 'string' &&
    /^-?\d+$/.test(String(value).trim())
  ) {
    parsed = Number(String(value).trim());
  }
  if (parsed === null || parsed === 0) {
    throw new Error(
      'INVALID_QUANTITY_DELTA: O ajuste precisa ser um número inteiro diferente de zero.',
    );
  }
  return parsed;
}

function listInventoryDayRecords() {
  return listSheetRecords(
    openNamedSheet(INVENTORY_DAYS_SHEET, INVENTORY_DAYS_HEADERS),
    INVENTORY_DAYS_HEADERS,
  );
}

function listOpeningRecords() {
  return listSheetRecords(
    openNamedSheet(
      INVENTORY_OPENING_ITEMS_SHEET,
      INVENTORY_OPENING_ITEMS_HEADERS,
    ),
    INVENTORY_OPENING_ITEMS_HEADERS,
  );
}

function listMovementRecords() {
  return listSheetRecords(
    openNamedSheet(INVENTORY_MOVEMENTS_SHEET, INVENTORY_MOVEMENTS_HEADERS),
    INVENTORY_MOVEMENTS_HEADERS,
  );
}

function trackedProductRecordsGs() {
  return latestRecordsById(listProductRecords()).filter(function (product) {
    return product.active === 'true' && product.stock_tracked === 'true';
  });
}

function resolveBusinessDateGs(value) {
  if (!value) {
    return todayCivil();
  }
  if (!isCivilDate(String(value))) {
    throw new Error(
      'INVALID_CIVIL_DATE: Use uma data civil no formato AAAA-MM-DD.',
    );
  }
  return String(value);
}

function findInventoryDayGs(businessDate) {
  const days = latestRecordsById(listInventoryDayRecords()).filter(
    function (day) {
      return day.business_date === businessDate;
    },
  );
  return days.length ? days[days.length - 1] : null;
}

function requireInventoryDayGs(businessDate) {
  const day = findInventoryDayGs(businessDate);
  if (!day) {
    throw new Error(
      'INVENTORY_DAY_NOT_OPEN: Abra o estoque do dia antes de continuar.',
    );
  }
  return day;
}

function physicalForGs(dayId, productId) {
  const opening = listOpeningRecords().filter(function (item) {
    return item.inventory_day_id === dayId && item.product_id === productId;
  })[0];
  let physical = opening ? Number(opening.opening_quantity) : 0;
  listMovementRecords()
    .filter(function (item) {
      return item.inventory_day_id === dayId && item.product_id === productId;
    })
    .forEach(function (item) {
      physical += Number(item.quantity_delta);
    });
  return physical;
}

function quantityLabelGs(physical) {
  return physical === 0 ? SOLD_OUT_LABEL : String(physical);
}

function toBalanceGs(dayId, opening, products) {
  const product = products.filter(function (item) {
    return item.id === opening.product_id;
  })[0];
  const physical = physicalForGs(dayId, opening.product_id);
  return {
    productId: opening.product_id,
    productName: product ? product.name : '',
    openingQuantity: Number(opening.opening_quantity),
    physicalQuantity: physical,
    reservedQuantity: 0,
    availableQuantity: physical,
    soldOut: physical === 0,
    quantityLabel: quantityLabelGs(physical),
  };
}

function listBalancesUnlocked(businessDate) {
  const day = requireInventoryDayGs(businessDate);
  const products = latestRecordsById(listProductRecords());
  return {
    businessDate: day.business_date,
    status: INVENTORY_DAY_OPEN,
    items: listOpeningRecords()
      .filter(function (item) {
        return item.inventory_day_id === day.id;
      })
      .map(function (opening) {
        return toBalanceGs(day.id, opening, products);
      }),
  };
}

function seedE2EInventoryUnlocked() {
  setupSchema();
  const products = latestRecordsById(listProductRecords());
  const coxinha = products.filter(function (item) {
    return item.name === 'Coxinha';
  })[0];
  const suco = products.filter(function (item) {
    return item.name === 'Suco de uva';
  })[0];
  if (!coxinha || !suco) {
    throw new Error('DEMO_STOCK: produtos controlados ausentes.');
  }
  openInventoryDayUnlocked(Utilities.getUuid(), {
    businessDate: todayCivil(),
    items: [
      { productId: coxinha.id, openingQuantity: 10 },
      { productId: suco.id, openingQuantity: 0 },
    ],
  });
}

function openInventoryDayUnlocked(userId, payload) {
  const businessDate = resolveBusinessDateGs(
    payload && payload.businessDate ? payload.businessDate : todayCivil(),
  );
  if (findInventoryDayGs(businessDate)) {
    throw new Error(
      'INVENTORY_DAY_ALREADY_OPEN: O estoque deste dia já foi aberto.',
    );
  }
  const tracked = trackedProductRecordsGs();
  if (!tracked.length) {
    throw new Error(
      'INVENTORY_ITEMS_REQUIRED: Informe a quantidade inicial de cada produto que controla estoque.',
    );
  }
  const items = payload && payload.items ? payload.items : [];
  const seen = {};
  const validated = [];
  items.forEach(function (item) {
    const productId = item && item.productId ? String(item.productId) : '';
    if (!REQUEST_ID_PATTERN.test(productId) || seen[productId]) {
      throw new Error(
        'PRODUCT_STOCK_NOT_TRACKED: Só produtos que controlam estoque entram no estoque do dia.',
      );
    }
    const match = tracked.filter(function (product) {
      return product.id === productId;
    })[0];
    if (!match) {
      throw new Error(
        'PRODUCT_STOCK_NOT_TRACKED: Só produtos que controlam estoque entram no estoque do dia.',
      );
    }
    seen[productId] = true;
    validated.push({
      product_id: productId,
      opening_quantity: String(
        parseOpeningQuantityGs(item && item.openingQuantity),
      ),
    });
  });
  if (Object.keys(seen).length !== tracked.length) {
    throw new Error(
      'INVENTORY_ITEMS_REQUIRED: Informe a quantidade inicial de cada produto que controla estoque.',
    );
  }
  const now = new Date().toISOString();
  const dayId = Utilities.getUuid();
  openNamedSheet(INVENTORY_DAYS_SHEET, INVENTORY_DAYS_HEADERS).appendRow([
    dayId,
    businessDate,
    INVENTORY_DAY_OPEN,
    userId,
    now,
  ]);
  const openings = openNamedSheet(
    INVENTORY_OPENING_ITEMS_SHEET,
    INVENTORY_OPENING_ITEMS_HEADERS,
  );
  validated.forEach(function (item) {
    openings.appendRow([
      Utilities.getUuid(),
      dayId,
      item.product_id,
      item.opening_quantity,
    ]);
  });
  return listBalancesUnlocked(businessDate);
}

function getInventoryDay(sessionToken, businessDate) {
  requireAction(sessionToken, 'inventory.read');
  const day = findInventoryDayGs(resolveBusinessDateGs(businessDate));
  if (!day) {
    return null;
  }
  return {
    id: day.id,
    businessDate: day.business_date,
    status: INVENTORY_DAY_OPEN,
    openedAt: day.opened_at,
  };
}

function openInventoryDay(sessionToken, payload) {
  const session = requireAction(sessionToken, 'inventory.open');
  return withScriptLock(function () {
    setupSchema();
    return openInventoryDayUnlocked(session.user_id, payload || {});
  });
}

function listInventoryBalances(sessionToken, businessDate) {
  requireAction(sessionToken, 'inventory.read');
  return listBalancesUnlocked(resolveBusinessDateGs(businessDate));
}

function adjustInventory(sessionToken, payload) {
  const session = requireAction(sessionToken, 'inventory.adjust');
  return withScriptLock(function () {
    setupSchema();
    const businessDate = resolveBusinessDateGs(payload && payload.businessDate);
    const day = requireInventoryDayGs(businessDate);
    const productId =
      payload && payload.productId ? String(payload.productId) : '';
    if (!REQUEST_ID_PATTERN.test(productId)) {
      throw new Error(
        'INVALID_ID: ID deve ser UUID imutável, nunca número da linha.',
      );
    }
    const product = latestProductById(productId);
    const current = physicalForGs(day.id, productId);
    const delta = parseQuantityDeltaGs(payload && payload.quantityDelta);
    const reason = String((payload && payload.reason) || '').trim();
    if (reason.length < 2) {
      throw new Error(
        'INVENTORY_REASON_REQUIRED: Informe o motivo do ajuste de estoque.',
      );
    }
    if (product.stock_tracked !== 'true') {
      throw new Error(
        'PRODUCT_STOCK_NOT_TRACKED: Só produtos que controlam estoque entram no estoque do dia.',
      );
    }
    if (current + delta < 0) {
      throw new Error('INSUFFICIENT_STOCK: O estoque não pode ficar negativo.');
    }
    const movementId = Utilities.getUuid();
    const now = new Date().toISOString();
    openNamedSheet(
      INVENTORY_MOVEMENTS_SHEET,
      INVENTORY_MOVEMENTS_HEADERS,
    ).appendRow([
      movementId,
      day.id,
      productId,
      'adjustment',
      String(delta),
      'manual',
      movementId,
      session.user_id,
      now,
      reason,
    ]);
    return listBalancesUnlocked(businessDate);
  });
}

function listInventoryMovements(sessionToken, businessDate) {
  requireAction(sessionToken, 'inventory.read');
  const day = requireInventoryDayGs(resolveBusinessDateGs(businessDate));
  const products = latestRecordsById(listProductRecords());
  return listMovementRecords()
    .filter(function (item) {
      return item.inventory_day_id === day.id;
    })
    .map(function (item) {
      const product = products.filter(function (entry) {
        return entry.id === item.product_id;
      })[0];
      return {
        id: item.id,
        productId: item.product_id,
        productName: product ? product.name : '',
        kind: item.kind,
        quantityDelta: Number(item.quantity_delta),
        reason: item.reason,
        createdAt: item.created_at,
      };
    });
}

function percentAmountGs(cents, percent) {
  if (!Number.isInteger(cents) || cents < 0 || !Number.isInteger(percent)) {
    return 0;
  }
  return Math.floor((cents * percent + 50) / 100);
}

function parseSaleQuantityGs(value) {
  var parsed = null;
  if (typeof value === 'number' && Number.isInteger(value)) {
    parsed = value;
  } else if (
    typeof value === 'string' &&
    /^-?\d+$/.test(String(value).trim())
  ) {
    parsed = Number(String(value).trim());
  }
  if (parsed === null || parsed < 1) {
    throw new Error(
      'INVALID_SALE_QUANTITY: A quantidade da venda precisa ser um número inteiro maior que zero.',
    );
  }
  return parsed;
}

function parseDiscountKindGs(value) {
  if (value === DISCOUNT_AMOUNT || value === DISCOUNT_PERCENT) {
    return value;
  }
  return DISCOUNT_NONE;
}

function computeLineDiscountGs(
  lineGrossCents,
  kind,
  discountInput,
  discountAllowed,
  actorIsOwner,
) {
  if (kind === DISCOUNT_NONE) {
    return { kind: kind, input: 0, amountCents: 0 };
  }
  if (!actorIsOwner) {
    throw new Error('FORBIDDEN: Só a dona aplica desconto.');
  }
  if (!discountAllowed) {
    throw new Error('DISCOUNT_NOT_ALLOWED: Este produto não permite desconto.');
  }
  if (kind === DISCOUNT_PERCENT) {
    const percent = parseCentsGs(discountInput);
    if (percent < 1 || percent > 100) {
      throw new Error(
        'INVALID_DISCOUNT: O desconto precisa ser um valor válido e menor que o item.',
      );
    }
    const amountCents = percentAmountGs(lineGrossCents, percent);
    if (amountCents <= 0 || amountCents >= lineGrossCents) {
      throw new Error(
        'INVALID_DISCOUNT: O desconto precisa ser um valor válido e menor que o item.',
      );
    }
    return { kind: kind, input: percent, amountCents: amountCents };
  }
  const amount = parseCentsGs(discountInput);
  if (amount <= 0 || amount >= lineGrossCents) {
    throw new Error(
      'INVALID_DISCOUNT: O desconto precisa ser um valor válido e menor que o item.',
    );
  }
  return { kind: kind, input: amount, amountCents: amount };
}

function planSaleLineGs(item, product, actorIsOwner) {
  const quantity = parseSaleQuantityGs(item && item.quantity);
  const adHocName = String((item && item.adHocName) || '').trim();
  if (adHocName) {
    if (!actorIsOwner) {
      throw new Error('FORBIDDEN: Só a dona vende item avulso.');
    }
    const price = parseCentsGs(item && item.adHocPriceCents);
    const lineGross = quantity * price;
    const discount = computeLineDiscountGs(
      lineGross,
      parseDiscountKindGs(item && item.discountKind),
      item && item.discountInput,
      true,
      actorIsOwner,
    );
    return {
      product_id: '',
      item_kind: SALE_ITEM_AD_HOC,
      description_snapshot: adHocName,
      quantity: String(quantity),
      unit_price_cents: String(price),
      discount_kind: discount.kind,
      discount_input: String(discount.input),
      discount_amount_cents: String(discount.amountCents),
      line_gross_cents: lineGross,
      line_net_total_cents: String(lineGross - discount.amountCents),
      stock_tracked: false,
    };
  }
  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND: Produto não encontrado.');
  }
  if (product.active !== 'true') {
    throw new Error(
      'PRODUCT_INACTIVE: Produto inativo não entra em venda nova.',
    );
  }
  const unitPrice = Number(product.price_cents);
  const lineGross = quantity * unitPrice;
  const discount = computeLineDiscountGs(
    lineGross,
    parseDiscountKindGs(item && item.discountKind),
    item && item.discountInput,
    product.discount_allowed === 'true',
    actorIsOwner,
  );
  return {
    product_id: product.id,
    item_kind: SALE_ITEM_PRODUCT,
    description_snapshot: product.name,
    quantity: String(quantity),
    unit_price_cents: String(unitPrice),
    discount_kind: discount.kind,
    discount_input: String(discount.input),
    discount_amount_cents: String(discount.amountCents),
    line_gross_cents: lineGross,
    line_net_total_cents: String(lineGross - discount.amountCents),
    stock_tracked: product.stock_tracked === 'true',
  };
}

function planSaleTotalsGs(lines) {
  let gross = 0;
  let net = 0;
  lines.forEach(function (line) {
    gross += line.line_gross_cents;
    net += Number(line.line_net_total_cents);
  });
  return {
    gross_total_cents: String(gross),
    discount_total_cents: String(gross - net),
    net_total_cents: String(net),
  };
}

function listSaleRecords() {
  return listSheetRecords(
    openNamedSheet(SALES_SHEET, SALES_HEADERS),
    SALES_HEADERS,
  );
}

function listSaleItemRecords() {
  return listSheetRecords(
    openNamedSheet(SALE_ITEMS_SHEET, SALE_ITEMS_HEADERS),
    SALE_ITEMS_HEADERS,
  );
}

function listSettlementRecords() {
  return listSheetRecords(
    openNamedSheet(SALE_SETTLEMENTS_SHEET, SALE_SETTLEMENTS_HEADERS),
    SALE_SETTLEMENTS_HEADERS,
  );
}

function listReceivableRecords() {
  return listSheetRecords(
    openNamedSheet(RECEIVABLES_SHEET, RECEIVABLES_HEADERS),
    RECEIVABLES_HEADERS,
  );
}

function listReceivableChargeRecords() {
  return listSheetRecords(
    openNamedSheet(RECEIVABLE_CHARGES_SHEET, RECEIVABLE_CHARGES_HEADERS),
    RECEIVABLE_CHARGES_HEADERS,
  );
}

function listPaymentRecords() {
  return listSheetRecords(
    openNamedSheet(PAYMENTS_SHEET, PAYMENTS_HEADERS),
    PAYMENTS_HEADERS,
  );
}

function listPaymentAllocationRecords() {
  return listSheetRecords(
    openNamedSheet(PAYMENT_ALLOCATIONS_SHEET, PAYMENT_ALLOCATIONS_HEADERS),
    PAYMENT_ALLOCATIONS_HEADERS,
  );
}

function remainingCentsGs(receivableId) {
  const charged = listReceivableChargeRecords()
    .filter(function (item) {
      return item.receivable_id === receivableId;
    })
    .reduce(function (total, item) {
      return total + Number(item.amount_cents);
    }, 0);
  const allocated = listPaymentAllocationRecords()
    .filter(function (item) {
      return item.receivable_id === receivableId;
    })
    .reduce(function (total, item) {
      return total + Number(item.amount_cents);
    }, 0);
  return charged - allocated;
}

function saleConsumerLabelGs(consumerStudentId) {
  if (!consumerStudentId) {
    return ANONYMOUS_SALE_LABEL;
  }
  const student = latestStudentById(consumerStudentId);
  return student.full_name + ' • ' + studentAgeLabelGs(student);
}

function parsePaymentKindGs(value) {
  if (
    value === SETTLEMENT_PIX ||
    value === SETTLEMENT_CASH ||
    value === PAYMENT_MIXED ||
    value === PAYMENT_FIADO
  ) {
    return value;
  }
  throw new Error(
    'PAYMENT_KIND_UNSUPPORTED: Use PIX, dinheiro, PIX + dinheiro ou fiado.',
  );
}

function planSettlementsGs(
  paymentKind,
  net,
  pixAmountCents,
  cashTenderedCents,
) {
  const kind = parsePaymentKindGs(paymentKind);
  if (!Number.isInteger(net) || net <= 0) {
    throw new Error(
      'INVALID_CENTS: O total da venda precisa ser um valor em centavos, número inteiro.',
    );
  }
  if (kind === SETTLEMENT_PIX) {
    return {
      paymentKind: SETTLEMENT_PIX,
      rows: [{ kind: SETTLEMENT_PIX, amount_cents: String(net) }],
      cashTenderedCents: 0,
      changeCents: 0,
    };
  }
  if (kind === PAYMENT_FIADO) {
    return {
      paymentKind: PAYMENT_FIADO,
      rows: [{ kind: SETTLEMENT_FIADO, amount_cents: String(net) }],
      cashTenderedCents: 0,
      changeCents: 0,
    };
  }
  var tendered;
  try {
    tendered = parseCentsGs(cashTenderedCents);
  } catch (error) {
    throw new Error('CASH_TENDERED_REQUIRED: Informe o dinheiro recebido.');
  }
  if (tendered <= 0) {
    throw new Error('CASH_TENDERED_REQUIRED: Informe o dinheiro recebido.');
  }
  if (kind === SETTLEMENT_CASH) {
    if (tendered < net) {
      throw new Error(
        'INSUFFICIENT_CASH: O dinheiro recebido não cobre o restante da venda.',
      );
    }
    const changeCents = tendered - net;
    const rows = [{ kind: SETTLEMENT_CASH, amount_cents: String(tendered) }];
    if (changeCents > 0) {
      rows.push({
        kind: SETTLEMENT_CHANGE,
        amount_cents: String(-changeCents),
      });
    }
    return {
      paymentKind: SETTLEMENT_CASH,
      rows: rows,
      cashTenderedCents: tendered,
      changeCents: changeCents,
    };
  }
  var pix;
  try {
    pix = parseCentsGs(pixAmountCents);
  } catch (error) {
    throw new Error(
      'INVALID_PIX_AMOUNT: No misto, o PIX precisa ser parte do total, não o total inteiro.',
    );
  }
  if (pix <= 0 || pix >= net) {
    throw new Error(
      'INVALID_PIX_AMOUNT: No misto, o PIX precisa ser parte do total, não o total inteiro.',
    );
  }
  const remaining = net - pix;
  if (tendered < remaining) {
    throw new Error(
      'INSUFFICIENT_CASH: O dinheiro recebido não cobre o restante da venda.',
    );
  }
  const mixedChange = tendered - remaining;
  const mixedRows = [
    { kind: SETTLEMENT_PIX, amount_cents: String(pix) },
    { kind: SETTLEMENT_CASH, amount_cents: String(tendered) },
  ];
  if (mixedChange > 0) {
    mixedRows.push({
      kind: SETTLEMENT_CHANGE,
      amount_cents: String(-mixedChange),
    });
  }
  return {
    paymentKind: PAYMENT_MIXED,
    rows: mixedRows,
    cashTenderedCents: tendered,
    changeCents: mixedChange,
  };
}

function paymentKindFromSettlementsGs(rows) {
  const hasPix = rows.some(function (row) {
    return row.kind === SETTLEMENT_PIX;
  });
  const hasCash = rows.some(function (row) {
    return row.kind === SETTLEMENT_CASH;
  });
  const hasFiado = rows.some(function (row) {
    return row.kind === SETTLEMENT_FIADO;
  });
  if (hasFiado) {
    return PAYMENT_FIADO;
  }
  if (hasPix && hasCash) {
    return PAYMENT_MIXED;
  }
  if (hasCash) {
    return SETTLEMENT_CASH;
  }
  return SETTLEMENT_PIX;
}

function saleSummaryLabelGs(
  consumerLabel,
  descriptions,
  netLabel,
  paymentKind,
  changeLabel,
  dueDateLabel,
) {
  const base =
    consumerLabel + ' • ' + descriptions.join(', ') + ' • ' + netLabel;
  const extras = [];
  if (paymentKind === SETTLEMENT_CASH) {
    extras.push('Dinheiro');
  }
  if (paymentKind === PAYMENT_MIXED) {
    extras.push('PIX + dinheiro');
  }
  if (paymentKind === PAYMENT_FIADO) {
    extras.push('Fiado');
  }
  if (changeLabel) {
    extras.push('Troco ' + changeLabel);
  }
  if (dueDateLabel) {
    extras.push(dueDateLabel);
  }
  return extras.length ? base + ' • ' + extras.join(' • ') : base;
}

function toSaleViewGs(sale) {
  const items = listSaleItemRecords()
    .filter(function (item) {
      return item.sale_id === sale.id;
    })
    .map(function (item) {
      return {
        id: item.id,
        description: item.description_snapshot,
        quantity: Number(item.quantity),
        unitPriceCents: Number(item.unit_price_cents),
        discountAmountCents: Number(item.discount_amount_cents),
        lineNetCents: Number(item.line_net_total_cents),
      };
    });
  const settlementRows = listSettlementRecords().filter(function (item) {
    return item.sale_id === sale.id;
  });
  const paymentKind = paymentKindFromSettlementsGs(settlementRows);
  const cashTenderedCents = settlementRows
    .filter(function (item) {
      return item.kind === SETTLEMENT_CASH;
    })
    .reduce(function (total, item) {
      return total + Number(item.amount_cents);
    }, 0);
  const changeCents = Math.abs(
    settlementRows
      .filter(function (item) {
        return item.kind === SETTLEMENT_CHANGE;
      })
      .reduce(function (total, item) {
        return total + Number(item.amount_cents);
      }, 0),
  );
  const netTotalCents = Number(sale.net_total_cents);
  const consumerLabel = saleConsumerLabelGs(sale.consumer_student_id);
  const netLabel = formatBrlGs(netTotalCents);
  const changeLabel = changeCents > 0 ? formatBrlGs(changeCents) : null;
  const descriptions = items.map(function (item) {
    return item.description;
  });
  const dueDates = listReceivableRecords()
    .filter(function (item) {
      return item.source_sale_id === sale.id;
    })
    .map(function (item) {
      return item.due_date;
    });
  const dueDateLabel = dueDateLabelForDatesGs(dueDates);
  return {
    id: sale.id,
    consumerStudentId: sale.consumer_student_id || null,
    consumerLabel: consumerLabel,
    status: SALE_STATUS_PAID,
    paymentKind: paymentKind,
    grossTotalCents: Number(sale.gross_total_cents),
    discountTotalCents: Number(sale.discount_total_cents),
    netTotalCents: netTotalCents,
    netLabel: netLabel,
    cashTenderedCents: cashTenderedCents,
    changeCents: changeCents,
    changeLabel: changeLabel,
    dueDateLabel: dueDateLabel,
    settlements: settlementRows.map(function (item) {
      return {
        kind: item.kind,
        amountCents: Number(item.amount_cents),
      };
    }),
    items: items,
    summaryLabel: saleSummaryLabelGs(
      consumerLabel,
      descriptions,
      netLabel,
      paymentKind,
      changeLabel,
      dueDateLabel,
    ),
    createdAt: sale.created_at,
  };
}

function readPixCopyTextUnlocked() {
  const records = listSheetRecords(
    openNamedSheet(SETTINGS_SHEET, SETTINGS_HEADERS),
    SETTINGS_HEADERS,
  );
  let text = DEFAULT_PIX_COPY_TEXT;
  records.forEach(function (row) {
    if (row.key === PIX_COPY_TEXT_KEY && row.value) {
      text = row.value;
    }
  });
  return { text: text };
}

function ensurePixCopySettingUnlocked() {
  setupSchema();
  const settings = openNamedSheet(SETTINGS_SHEET, SETTINGS_HEADERS);
  const records = listSheetRecords(settings, SETTINGS_HEADERS);
  const exists = records.some(function (row) {
    return row.key === PIX_COPY_TEXT_KEY;
  });
  if (!exists) {
    settings.appendRow([PIX_COPY_TEXT_KEY, DEFAULT_PIX_COPY_TEXT]);
  }
}

function createSaleUnlocked(userId, payload, actorIsOwner) {
  const items = payload && payload.items ? payload.items : [];
  if (!items.length) {
    throw new Error(
      'SALE_ITEMS_REQUIRED: Inclua pelo menos um item no carrinho.',
    );
  }
  const products = latestRecordsById(listProductRecords());
  const planned = [];
  items.forEach(function (item) {
    const productId = item && item.productId ? String(item.productId) : '';
    const product = productId
      ? products.filter(function (entry) {
          return entry.id === productId;
        })[0] || null
      : null;
    planned.push(planSaleLineGs(item, product, actorIsOwner));
  });
  const needed = {};
  planned.forEach(function (line) {
    if (!line.stock_tracked || !line.product_id) {
      return;
    }
    needed[line.product_id] =
      (needed[line.product_id] || 0) + Number(line.quantity);
  });
  const businessDate = todayCivil();
  Object.keys(needed).forEach(function (productId) {
    const day = requireInventoryDayGs(businessDate);
    const available = physicalForGs(day.id, productId);
    if (available < needed[productId]) {
      throw new Error(
        'INSUFFICIENT_STOCK: Não há estoque suficiente para esta venda.',
      );
    }
  });
  let consumerId = '';
  if (payload.consumerStudentId) {
    const student = latestStudentById(String(payload.consumerStudentId));
    if (student.active !== 'true') {
      throw new Error(
        'STUDENT_INACTIVE: Aluno inativo não entra em venda nova.',
      );
    }
    consumerId = student.id;
  }
  const totals = planSaleTotalsGs(planned);
  const plannedSettlements = planSettlementsGs(
    payload && payload.paymentKind,
    Number(totals.net_total_cents),
    payload && payload.pixAmountCents,
    payload && payload.cashTenderedCents,
  );
  let installments = [];
  if (plannedSettlements.paymentKind === PAYMENT_FIADO) {
    if (!consumerId) {
      throw new Error(
        'FIADO_STUDENT_REQUIRED: Fiado precisa de um aluno na conta.',
      );
    }
    installments = planFiadoInstallmentsGs(
      Number(totals.net_total_cents),
      payload && payload.installments,
    );
  }
  const now = new Date().toISOString();
  const saleId = Utilities.getUuid();
  openNamedSheet(SALES_SHEET, SALES_HEADERS).appendRow([
    saleId,
    consumerId,
    consumerId,
    SALE_STATUS_PAID,
    totals.gross_total_cents,
    totals.discount_total_cents,
    totals.net_total_cents,
    '',
    userId,
    now,
    '',
  ]);
  const itemsSheet = openNamedSheet(SALE_ITEMS_SHEET, SALE_ITEMS_HEADERS);
  planned.forEach(function (line) {
    itemsSheet.appendRow([
      Utilities.getUuid(),
      saleId,
      line.product_id,
      line.item_kind,
      line.description_snapshot,
      line.quantity,
      line.unit_price_cents,
      line.discount_kind,
      line.discount_input,
      line.discount_amount_cents,
      line.line_net_total_cents,
    ]);
  });
  const settlementsSheet = openNamedSheet(
    SALE_SETTLEMENTS_SHEET,
    SALE_SETTLEMENTS_HEADERS,
  );
  plannedSettlements.rows.forEach(function (row) {
    settlementsSheet.appendRow([
      Utilities.getUuid(),
      saleId,
      row.kind,
      row.amount_cents,
      '',
      now,
    ]);
  });
  const receivablesSheet = openNamedSheet(
    RECEIVABLES_SHEET,
    RECEIVABLES_HEADERS,
  );
  const chargesSheet = openNamedSheet(
    RECEIVABLE_CHARGES_SHEET,
    RECEIVABLE_CHARGES_HEADERS,
  );
  installments.forEach(function (installment) {
    const receivableId = Utilities.getUuid();
    receivablesSheet.appendRow([
      receivableId,
      consumerId,
      saleId,
      installment.due_date,
      RECEIVABLE_STATUS_OPEN,
      userId,
      now,
    ]);
    chargesSheet.appendRow([
      Utilities.getUuid(),
      receivableId,
      RECEIVABLE_CHARGE_PRINCIPAL,
      installment.amount_cents,
      RECEIVABLE_REASON_SALE,
      '',
      userId,
      now,
      '',
    ]);
  });
  const day = Object.keys(needed).length
    ? requireInventoryDayGs(businessDate)
    : null;
  const movements = openNamedSheet(
    INVENTORY_MOVEMENTS_SHEET,
    INVENTORY_MOVEMENTS_HEADERS,
  );
  Object.keys(needed).forEach(function (productId) {
    movements.appendRow([
      Utilities.getUuid(),
      day.id,
      productId,
      'sale',
      String(-needed[productId]),
      'sale',
      saleId,
      userId,
      now,
      'venda',
    ]);
  });
  return toSaleViewGs({
    id: saleId,
    consumer_student_id: consumerId,
    charged_student_id: consumerId,
    status: SALE_STATUS_PAID,
    gross_total_cents: totals.gross_total_cents,
    discount_total_cents: totals.discount_total_cents,
    net_total_cents: totals.net_total_cents,
    source_reservation_id: '',
    created_by: userId,
    created_at: now,
    reversal_id: '',
  });
}

function createSale(sessionToken, payload) {
  const session = requireAction(sessionToken, 'sales.write');
  return withScriptLock(function () {
    setupSchema();
    return createSaleUnlocked(
      session.user_id,
      payload || {},
      session.role === 'owner',
    );
  });
}

function listSales(sessionToken) {
  requireAction(sessionToken, 'sales.read');
  return listSaleRecords()
    .slice()
    .reverse()
    .map(function (sale) {
      return toSaleViewGs(sale);
    });
}

function getPixCopyText(sessionToken) {
  requireAction(sessionToken, 'sales.read');
  return readPixCopyTextUnlocked();
}

function getDueDateShortcuts(sessionToken) {
  requireAction(sessionToken, 'receivables.read');
  return dueDateShortcutsGs(todayCivil());
}

function toReceivableViewGs(receivable, today, remainingCents) {
  const remainingLabel = formatBrlGs(remainingCents);
  const studentLabel = saleConsumerLabelGs(receivable.charged_student_id);
  const dueDateLabel = formatCivilDisplayGs(receivable.due_date);
  return {
    id: receivable.id,
    chargedStudentId: receivable.charged_student_id,
    studentLabel: studentLabel,
    sourceSaleId: receivable.source_sale_id,
    dueDate: receivable.due_date,
    dueDateLabel: dueDateLabel,
    amountCents: remainingCents,
    amountLabel: remainingLabel,
    remainingCents: remainingCents,
    remainingLabel: remainingLabel,
    status: RECEIVABLE_STATUS_OPEN,
    bucket: agendaBucketGs(receivable.due_date, today),
    summaryLabel: receivableSummaryLabelGs(
      studentLabel,
      remainingLabel,
      dueDateLabel,
    ),
  };
}

function listReceivables(sessionToken) {
  requireAction(sessionToken, 'receivables.read');
  const today = todayCivil();
  const overdue = [];
  const dueToday = [];
  const upcoming = [];
  listReceivableRecords().forEach(function (receivable) {
    const remaining = remainingCentsGs(receivable.id);
    if (remaining <= 0) {
      return;
    }
    const view = toReceivableViewGs(receivable, today, remaining);
    if (view.bucket === 'overdue') {
      overdue.push(view);
    } else if (view.bucket === 'today') {
      dueToday.push(view);
    } else {
      upcoming.push(view);
    }
  });
  overdue.sort(function (left, right) {
    return left.dueDate < right.dueDate
      ? -1
      : left.dueDate > right.dueDate
        ? 1
        : 0;
  });
  dueToday.sort(function (left, right) {
    return left.dueDate < right.dueDate
      ? -1
      : left.dueDate > right.dueDate
        ? 1
        : 0;
  });
  upcoming.sort(function (left, right) {
    return left.dueDate < right.dueDate
      ? -1
      : left.dueDate > right.dueDate
        ? 1
        : 0;
  });
  return { overdue: overdue, today: dueToday, upcoming: upcoming };
}

function parsePaymentMethodGs(value) {
  if (value === PAYMENT_METHOD_PIX || value === PAYMENT_METHOD_CASH) {
    return value;
  }
  throw new Error('PAYMENT_METHOD_UNSUPPORTED: Use PIX ou dinheiro.');
}

function parsePaymentModeGs(value) {
  if (
    value === PAYMENT_MODE_OLDEST_FIRST ||
    value === PAYMENT_MODE_SELECTED ||
    value === PAYMENT_MODE_MANUAL
  ) {
    return value;
  }
  throw new Error(
    'PAYMENT_MODE_UNSUPPORTED: Use a dívida mais antiga, selecionadas ou alocação manual.',
  );
}

function parsePaymentAmountGs(value) {
  const amount = parseCentsGs(value);
  if (amount <= 0) {
    throw new Error(
      'INVALID_CENTS: O valor do pagamento precisa ser um valor em centavos, número inteiro.',
    );
  }
  return amount;
}

function sortOldestFirstGs(receivables) {
  return receivables.slice().sort(function (left, right) {
    if (left.due_date !== right.due_date) {
      return left.due_date < right.due_date ? -1 : 1;
    }
    if (left.created_at !== right.created_at) {
      return left.created_at < right.created_at ? -1 : 1;
    }
    if (left.id === right.id) {
      return 0;
    }
    return left.id < right.id ? -1 : 1;
  });
}

function allocateOldestFirstGs(amountCents, receivables) {
  const open = sortOldestFirstGs(
    receivables.filter(function (item) {
      return item.remaining_cents > 0;
    }),
  );
  const total = open.reduce(function (sum, item) {
    return sum + item.remaining_cents;
  }, 0);
  if (!open.length || total <= 0) {
    throw new Error(
      'NO_OPEN_RECEIVABLES: Este aluno não tem dívida em aberto.',
    );
  }
  if (amountCents > total) {
    throw new Error(
      'PAYMENT_EXCEEDS_BALANCE: O valor é maior que a dívida escolhida.',
    );
  }
  let leftover = amountCents;
  const rows = [];
  open.forEach(function (item) {
    if (leftover <= 0) {
      return;
    }
    const applied = Math.min(item.remaining_cents, leftover);
    rows.push({
      receivable_id: item.id,
      student_id: item.charged_student_id,
      amount_cents: String(applied),
    });
    leftover -= applied;
  });
  if (leftover !== 0) {
    throw new Error(
      'PAYMENT_ALLOCATION_MISMATCH: A soma das alocações precisa ser igual ao valor recebido.',
    );
  }
  return rows;
}

function planPaymentAllocationsGs(
  amountCents,
  mode,
  receivables,
  selectedReceivableIds,
  allocations,
) {
  const parsedMode = parsePaymentModeGs(mode);
  const amount = parsePaymentAmountGs(amountCents);
  const byId = {};
  receivables.forEach(function (item) {
    byId[item.id] = item;
  });
  if (parsedMode === PAYMENT_MODE_MANUAL) {
    const lines = allocations || [];
    if (!lines.length) {
      throw new Error(
        'PAYMENT_ALLOCATION_MISMATCH: A soma das alocações precisa ser igual ao valor recebido.',
      );
    }
    const rows = [];
    let total = 0;
    lines.forEach(function (line) {
      const receivableId =
        line && line.receivableId ? String(line.receivableId) : '';
      const receivable = byId[receivableId];
      if (!receivable || receivable.remaining_cents <= 0) {
        throw new Error(
          'RECEIVABLE_NOT_FOUND: Dívida não encontrada para este aluno.',
        );
      }
      const already = rows.some(function (row) {
        return row.receivable_id === receivable.id;
      });
      if (already) {
        throw new Error(
          'PAYMENT_ALLOCATION_MISMATCH: A soma das alocações precisa ser igual ao valor recebido.',
        );
      }
      const lineAmount = parsePaymentAmountGs(
        line && line.amountCents !== undefined
          ? line.amountCents
          : line.amount_cents,
      );
      if (lineAmount > receivable.remaining_cents) {
        throw new Error(
          'PAYMENT_EXCEEDS_BALANCE: O valor é maior que a dívida escolhida.',
        );
      }
      total += lineAmount;
      rows.push({
        receivable_id: receivable.id,
        student_id: receivable.charged_student_id,
        amount_cents: String(lineAmount),
      });
    });
    if (total !== amount) {
      throw new Error(
        'PAYMENT_ALLOCATION_MISMATCH: A soma das alocações precisa ser igual ao valor recebido.',
      );
    }
    return rows;
  }
  let pool = receivables;
  if (parsedMode === PAYMENT_MODE_SELECTED) {
    const selected = selectedReceivableIds || [];
    if (!selected.length) {
      throw new Error('PAYMENT_SELECTION_REQUIRED: Selecione as dívidas.');
    }
    const picked = [];
    selected.forEach(function (id) {
      const receivable = byId[id];
      if (!receivable || receivable.remaining_cents <= 0) {
        throw new Error(
          'RECEIVABLE_NOT_FOUND: Dívida não encontrada para este aluno.',
        );
      }
      const already = picked.some(function (item) {
        return item.id === receivable.id;
      });
      if (!already) {
        picked.push(receivable);
      }
    });
    pool = picked;
  }
  return allocateOldestFirstGs(amount, pool);
}

function paymentSummaryLabelGs(studentLabel, amountLabel, method) {
  const methodLabel = method === PAYMENT_METHOD_CASH ? 'Dinheiro' : 'PIX';
  return studentLabel + ' • ' + amountLabel + ' • ' + methodLabel;
}

function toPaymentViewGs(payment) {
  const studentLabel = saleConsumerLabelGs(payment.payer_student_id);
  const amountCents = Number(payment.amount_received_cents);
  const amountLabel = formatBrlGs(amountCents);
  return {
    id: payment.id,
    payerStudentId: payment.payer_student_id,
    studentLabel: studentLabel,
    method: payment.method,
    amountCents: amountCents,
    amountLabel: amountLabel,
    status: payment.status,
    summaryLabel: paymentSummaryLabelGs(
      studentLabel,
      amountLabel,
      payment.method,
    ),
    createdAt: payment.created_at,
  };
}

function allocatableReceivablesGs(studentId) {
  return listReceivableRecords()
    .filter(function (item) {
      return item.charged_student_id === studentId;
    })
    .map(function (item) {
      return {
        id: item.id,
        charged_student_id: item.charged_student_id,
        due_date: item.due_date,
        created_at: item.created_at,
        remaining_cents: remainingCentsGs(item.id),
      };
    });
}

function createPaymentUnlocked(userId, payload) {
  const studentId =
    payload && payload.studentId ? String(payload.studentId) : '';
  if (!studentId) {
    throw new Error('PAYMENT_STUDENT_REQUIRED: Escolha o aluno da dívida.');
  }
  const student = latestStudentById(studentId);
  const method = parsePaymentMethodGs(payload && payload.method);
  const rows = planPaymentAllocationsGs(
    payload && payload.amountCents,
    payload && payload.mode,
    allocatableReceivablesGs(student.id),
    payload && payload.selectedReceivableIds,
    payload && payload.allocations,
  );
  const now = new Date().toISOString();
  const paymentId = Utilities.getUuid();
  const amountReceived = rows.reduce(function (total, row) {
    return total + Number(row.amount_cents);
  }, 0);
  openNamedSheet(PAYMENTS_SHEET, PAYMENTS_HEADERS).appendRow([
    paymentId,
    '',
    student.id,
    method,
    String(amountReceived),
    PAYMENT_STATUS_COMPLETED,
    userId,
    now,
    '',
  ]);
  const allocationsSheet = openNamedSheet(
    PAYMENT_ALLOCATIONS_SHEET,
    PAYMENT_ALLOCATIONS_HEADERS,
  );
  rows.forEach(function (row) {
    allocationsSheet.appendRow([
      paymentId,
      row.receivable_id,
      row.student_id,
      row.amount_cents,
    ]);
  });
  return toPaymentViewGs({
    id: paymentId,
    payer_guardian_id: '',
    payer_student_id: student.id,
    method: method,
    amount_received_cents: String(amountReceived),
    status: PAYMENT_STATUS_COMPLETED,
    created_by: userId,
    created_at: now,
    note: '',
  });
}

function createPayment(sessionToken, payload) {
  const session = requireAction(sessionToken, 'payments.write');
  return withScriptLock(function () {
    setupSchema();
    return createPaymentUnlocked(session.user_id, payload || {});
  });
}

function listPayments(sessionToken) {
  requireAction(sessionToken, 'receivables.read');
  return listPaymentRecords()
    .slice()
    .reverse()
    .map(function (payment) {
      return toPaymentViewGs(payment);
    });
}
