const CANTINA_APP_NAME = 'Cantina V2 AppScript';
const CANTINA_APP_VERSION = '0.1.0-dev';
const CANTINA_ENVIRONMENT = 'E2E';
const E2E_META_SHEET = '_e2e_meta';
const E2E_SEED_MARKER = 'cantina-e2e-fictitious';
const META_SHEET = '_meta';
const MIGRATIONS_SHEET = '_schema_migrations';
const META_HEADERS = ['key', 'value'];
const MIGRATION_HEADERS = [
  'migration_id',
  'applied_at',
  'app_version',
  'checksum',
  'description',
];
const FOUNDATION_MIGRATION_ID = '001_foundation';
const FOUNDATION_MIGRATION_CHECKSUM = 'meta|schema_migrations';

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

function buildHealth() {
  const properties = PropertiesService.getScriptProperties();
  const environment = properties.getProperty('ENVIRONMENT');
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const version = properties.getProperty('APP_VERSION');

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

  return {
    appName: CANTINA_APP_NAME,
    version: version,
    environment: environment,
    status: 'ready',
    adapter: 'google-script',
    spreadsheetConfigured: true,
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

function resetE2E() {
  assertE2EEnvironment();
  const spreadsheet = openConfiguredSpreadsheet();
  const sheet = getOrCreateE2EMetaSheet(spreadsheet);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  return { reset: true, environment: CANTINA_ENVIRONMENT };
}

function seedE2E() {
  assertE2EEnvironment();
  resetE2E();
  const spreadsheet = openConfiguredSpreadsheet();
  const sheet = getOrCreateE2EMetaSheet(spreadsheet);
  sheet.appendRow(['marker', E2E_SEED_MARKER]);
  sheet.appendRow(['seeded', 'true']);
  return {
    marker: E2E_SEED_MARKER,
    seeded: true,
    environment: CANTINA_ENVIRONMENT,
  };
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
  const catalog = [FOUNDATION_MIGRATION_ID];
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
  if (applied.indexOf(FOUNDATION_MIGRATION_ID) === -1) {
    const createdAt = new Date().toISOString();
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
  return {
    schemaVersion: 1,
    appliedMigrations: listAppliedMigrationIds(migrations),
    environment: CANTINA_ENVIRONMENT,
  };
}
