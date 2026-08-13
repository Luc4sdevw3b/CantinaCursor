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
const CURRENT_SCHEMA_VERSION = 5;
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
    applied.indexOf(STUDENTS_MIGRATION_ID) === -1;
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
    meta.appendRow(['schema_version', String(CURRENT_SCHEMA_VERSION)]);
    migrations.appendRow([
      STUDENTS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      STUDENTS_MIGRATION_CHECKSUM,
      'Cria anos letivos, turmas, alunos e matrículas',
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
  return {
    id: student.id,
    fullName: student.full_name,
    active: student.active === 'true',
    ageLabel: studentAgeLabelGs(student),
    classroomName: classroom ? classroom.name : null,
    schoolYearLabel: year ? year.label : null,
    isHomonym: false,
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
