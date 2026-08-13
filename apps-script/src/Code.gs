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
const CURRENT_SCHEMA_VERSION = 3;
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
  return { reset: true, environment: CANTINA_ENVIRONMENT };
}

function resetE2E() {
  assertE2EEnvironment();
  return withScriptLock(function () {
    return resetE2EUnlocked();
  });
}

function seedE2E() {
  assertE2EEnvironment();
  return withScriptLock(function () {
    resetE2EUnlocked();
    const spreadsheet = openConfiguredSpreadsheet();
    const sheet = getOrCreateE2EMetaSheet(spreadsheet);
    sheet.appendRow(['marker', E2E_SEED_MARKER]);
    sheet.appendRow(['seeded', 'true']);
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
    applied.indexOf(BACKUPS_MIGRATION_ID) === -1;
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
    meta.appendRow(['schema_version', String(CURRENT_SCHEMA_VERSION)]);
    migrations.appendRow([
      BACKUPS_MIGRATION_ID,
      createdAt,
      CANTINA_APP_VERSION,
      BACKUPS_MIGRATION_CHECKSUM,
      'Cria _backups',
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

function probeIdempotentOperation(requestId) {
  assertE2EEnvironment();
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

function runBackup(reason) {
  assertE2EEnvironment();
  return withScriptLock(function () {
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
  });
}

function runScheduledBackup() {
  return runBackup('scheduled');
}

function prepareRestore(backupId, confirmed) {
  assertE2EEnvironment();
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
