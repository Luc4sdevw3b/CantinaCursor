import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = await readFile(
  new URL('../../apps-script/src/Code.gs', import.meta.url),
  'utf8',
);

interface E2EHealth {
  appName: string;
  version: string;
  environment: string;
  status: string;
  adapter: string;
  spreadsheetConfigured: boolean;
}

interface ServerContext {
  doGet(): unknown;
  getHealth(): E2EHealth;
  configureE2EEnvironment(spreadsheetId?: string): E2EHealth;
  resetE2E(): { reset: true; environment: string };
  seedE2E(): { marker: string; seeded: true; environment: string };
}

function createMetaSheet(rows: string[][] = [['key', 'value']]) {
  return {
    rows,
    getLastRow: () => rows.length,
    getLastColumn: () => 2,
    appendRow: (row: string[]) => {
      rows.push(row);
    },
    getRange: () => ({
      clearContent: () => {
        rows.splice(1);
      },
    }),
  };
}

function loadServer(
  properties: Record<string, string> = {},
  options: {
    hasSpreadsheet?: boolean;
    metaSheet?: ReturnType<typeof createMetaSheet> | null;
  } = {},
) {
  const hasSpreadsheet = options.hasSpreadsheet ?? true;
  const metaSheet = options.metaSheet ?? createMetaSheet();
  const setProperties = vi.fn((values: Record<string, string>) =>
    Object.assign(properties, values),
  );
  const openById = vi.fn(() => ({
    getSheetByName: (name: string) => (name === '_e2e_meta' ? metaSheet : null),
    insertSheet: () => metaSheet,
  }));
  const output = {
    setTitle: vi.fn(() => output),
    addMetaTag: vi.fn(() => output),
  };
  const context = {
    HtmlService: { createHtmlOutputFromFile: vi.fn(() => output) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => properties[key] ?? null,
        setProperties,
      }),
    },
    SpreadsheetApp: {
      openById,
      getActiveSpreadsheet: () =>
        hasSpreadsheet ? { getId: () => 'e2e-sheet-id' } : null,
    },
  };

  runInNewContext(source, context);
  return {
    server: context as unknown as ServerContext,
    output,
    openById,
    properties,
    setProperties,
    metaSheet,
  };
}

describe('Apps Script E2E server', () => {
  it('serves Index through HTML Service', () => {
    const { server, output } = loadServer();
    expect(server.doGet()).toBe(output);
    expect(output.setTitle).toHaveBeenCalledWith('Cantina V2 AppScript');
  });

  it('returns health metadata without exposing the spreadsheet id', () => {
    const { server, openById } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'private-e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    const health = server.getHealth();
    expect(health).toEqual({
      appName: 'Cantina V2 AppScript',
      version: '0.1.0-dev',
      environment: 'E2E',
      status: 'ready',
      adapter: 'google-script',
      spreadsheetConfigured: true,
    });
    expect(JSON.stringify(health)).not.toContain('private-e2e-sheet-id');
    expect(openById).toHaveBeenCalledWith('private-e2e-sheet-id');
  });

  it('rejects health when environment is PROD', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'PROD',
      SPREADSHEET_ID: 'private-e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.getHealth()).toThrow('ENVIRONMENT deve ser E2E');
  });

  it('configures Script Properties for the E2E spreadsheet only', () => {
    const { server, properties } = loadServer();
    server.configureE2EEnvironment();
    expect(properties).toEqual({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
  });

  it('refuses reset and seed on PROD', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'PROD',
      SPREADSHEET_ID: 'prod-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.resetE2E()).toThrow('RESET_PROD_FORBIDDEN');
    expect(() => server.seedE2E()).toThrow('RESET_PROD_FORBIDDEN');
  });

  it('refuses reset and seed on DEV', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'DEV',
      SPREADSHEET_ID: 'dev-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.resetE2E()).toThrow('E2E_ONLY');
    expect(() => server.seedE2E()).toThrow('E2E_ONLY');
  });

  it('resets and seeds only fictitious E2E data', () => {
    const metaSheet = createMetaSheet([
      ['key', 'value'],
      ['stale', 'old'],
    ]);
    const { server } = loadServer(
      {
        ENVIRONMENT: 'E2E',
        SPREADSHEET_ID: 'e2e-sheet-id',
        APP_VERSION: '0.1.0-dev',
      },
      { metaSheet },
    );

    expect(server.resetE2E()).toEqual({ reset: true, environment: 'E2E' });
    expect(metaSheet.rows).toEqual([['key', 'value']]);

    expect(server.seedE2E()).toEqual({
      marker: 'cantina-e2e-fictitious',
      seeded: true,
      environment: 'E2E',
    });
    expect(metaSheet.rows).toEqual([
      ['key', 'value'],
      ['marker', 'cantina-e2e-fictitious'],
      ['seeded', 'true'],
    ]);
  });
});
