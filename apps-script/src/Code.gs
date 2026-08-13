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
const CURRENT_SCHEMA_VERSION = 7;
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
    applied.indexOf(PRODUCTS_MIGRATION_ID) === -1;
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
    meta.appendRow(['schema_version', String(CURRENT_SCHEMA_VERSION)]);
    migrations.appendRow([
      PRODUCTS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      PRODUCTS_MIGRATION_CHECKSUM,
      'Cria categorias, produtos, histórico de preço e itens avulsos',
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
  return new Date().toISOString().slice(0, 10);
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
