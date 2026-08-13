const CANTINA_APP_NAME = 'Cantina V2 AppScript';
const CANTINA_APP_VERSION = '0.1.0-dev';
const CANTINA_ENVIRONMENT = 'E2E';
const E2E_META_SHEET = '_e2e_meta';
const E2E_SEED_MARKER = 'cantina-e2e-fictitious';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CANTINA_APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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

function openConfiguredSpreadsheet() {
  const spreadsheetId = getConfiguredSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error('CONFIGURATION_ERROR: SPREADSHEET_ID não configurado.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getHealth() {
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

  return getHealth();
}

function getOrCreateE2EMetaSheet(spreadsheet) {
  const existing = spreadsheet.getSheetByName(E2E_META_SHEET);
  if (existing) {
    return existing;
  }
  const sheet = spreadsheet.insertSheet(E2E_META_SHEET);
  sheet.appendRow(['key', 'value']);
  return sheet;
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
