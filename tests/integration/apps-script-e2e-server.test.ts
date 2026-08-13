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
  setupSchema(): {
    schemaVersion: number;
    appliedMigrations: string[];
    environment: string;
  };
  probeIdempotentOperation(requestId: string): {
    requestId: string;
    resultEntityId: string;
    replayed: boolean;
    status: string;
  };
}

function createSheet(rows: unknown[][] = [[]], sheetId = 1) {
  const sheet = {
    rows,
    getSheetId: () => sheetId,
    getLastRow: () => rows.length,
    getLastColumn: () =>
      rows.reduce((max, row) => Math.max(max, row.length), 0) || 1,
    appendRow: (row: unknown[]) => {
      rows.push(row);
    },
    getRange: (row: number, column: number, numRows = 1, numColumns = 1) => ({
      getValues: () =>
        Array.from({ length: numRows }, (_, rowIndex) =>
          Array.from(
            { length: numColumns },
            (_, columnIndex) =>
              rows[row - 1 + rowIndex]?.[column - 1 + columnIndex] ?? '',
          ),
        ),
      setValues: (values: unknown[][]) => {
        values.forEach((valueRow, rowIndex) => {
          const targetRow = row - 1 + rowIndex;
          const target = rows[targetRow] ?? [];
          rows[targetRow] = target;
          valueRow.forEach((value, columnIndex) => {
            target[column - 1 + columnIndex] = value;
          });
        });
      },
      clearContent: () => {
        rows.splice(row - 1, numRows);
      },
    }),
  };
  return sheet;
}

function loadServer(
  properties: Record<string, string> = {},
  options: { hasSpreadsheet?: boolean; lockAcquired?: boolean } = {},
) {
  const hasSpreadsheet = options.hasSpreadsheet ?? true;
  const lockAcquired = options.lockAcquired ?? true;
  const sheets = new Map<string, ReturnType<typeof createSheet>>();
  let nextSheetId = 1;
  const setProperties = vi.fn((values: Record<string, string>) =>
    Object.assign(properties, values),
  );
  const spreadsheet = {
    getSheetByName: (name: string) => sheets.get(name) ?? null,
    insertSheet: (name: string) => {
      const sheet = createSheet([[]], nextSheetId);
      nextSheetId += 1;
      sheets.set(name, sheet);
      return sheet;
    },
  };
  const openById = vi.fn(() => spreadsheet);
  const releaseLock = vi.fn();
  const output = {
    setTitle: vi.fn(() => output),
    addMetaTag: vi.fn(() => output),
    setXFrameOptionsMode: vi.fn(() => output),
  };
  const batchUpdate = vi.fn(
    (resource: {
      requests: Array<{
        appendCells: {
          sheetId: number;
          rows: Array<{
            values: Array<{ userEnteredValue: { stringValue: string } }>;
          }>;
        };
      }>;
    }) => {
      for (const request of resource.requests) {
        const target = [...sheets.values()].find(
          (sheet) => sheet.getSheetId() === request.appendCells.sheetId,
        );
        for (const row of request.appendCells.rows) {
          target?.appendRow(
            row.values.map((cell) => cell.userEnteredValue.stringValue),
          );
        }
      }
    },
  );
  let uuidCount = 0;
  const context = {
    Date,
    String,
    Array,
    Math,
    JSON,
    Boolean,
    Error,
    parseInt,
    HtmlService: {
      createHtmlOutputFromFile: vi.fn(() => output),
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
    },
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
    LockService: {
      getScriptLock: () => ({
        tryLock: () => lockAcquired,
        releaseLock,
      }),
    },
    Sheets: {
      Spreadsheets: {
        batchUpdate,
      },
    },
    Utilities: {
      getUuid: () => {
        uuidCount += 1;
        return `aaaaaaaa-bbbb-4ccc-8ddd-${String(uuidCount).padStart(12, '0')}`;
      },
    },
  };

  runInNewContext(source, context);
  return {
    server: context as unknown as ServerContext,
    output,
    openById,
    properties,
    setProperties,
    sheets,
    releaseLock,
    batchUpdate,
  };
}

describe('Apps Script E2E server', () => {
  it('serves Index through HTML Service', () => {
    const { server, output } = loadServer();
    expect(server.doGet()).toBe(output);
    expect(output.setTitle).toHaveBeenCalledWith('Cantina V2 AppScript');
    expect(output.setXFrameOptionsMode).toHaveBeenCalledWith('ALLOWALL');
  });

  it('auto-configures E2E from the bound spreadsheet', () => {
    const { server, properties } = loadServer();
    const health = server.getHealth();
    expect(properties.ENVIRONMENT).toBe('E2E');
    expect(properties.SPREADSHEET_ID).toBe('e2e-sheet-id');
    expect(health.environment).toBe('E2E');
    expect(JSON.stringify(health)).not.toContain('e2e-sheet-id');
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
    expect(() => server.getHealth()).toThrow('RESET_PROD_FORBIDDEN');
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

  it('refuses reset, seed and schema setup on DEV', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'DEV',
      SPREADSHEET_ID: 'dev-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.resetE2E()).toThrow('E2E_ONLY');
    expect(() => server.seedE2E()).toThrow('E2E_ONLY');
    expect(() => server.setupSchema()).toThrow('E2E_ONLY');
  });

  it('resets and seeds only fictitious E2E data', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    expect(server.resetE2E()).toEqual({ reset: true, environment: 'E2E' });
    expect(server.seedE2E()).toEqual({
      marker: 'cantina-e2e-fictitious',
      seeded: true,
      environment: 'E2E',
    });
    expect(sheets.get('_e2e_meta')?.rows).toEqual([
      ['key', 'value'],
      ['marker', 'cantina-e2e-fictitious'],
      ['seeded', 'true'],
    ]);
  });

  it('applies foundation schema idempotently', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    const first = server.setupSchema();
    const second = server.setupSchema();

    expect(first).toEqual(second);
    expect(first.schemaVersion).toBe(2);
    expect(first.appliedMigrations).toEqual([
      '001_foundation',
      '002_operation_requests',
    ]);
    expect(sheets.get('_meta')?.rows[0]).toEqual(['key', 'value']);
    expect(sheets.get('_schema_migrations')?.rows[0]).toEqual([
      'migration_id',
      'applied_at',
      'app_version',
      'checksum',
      'description',
    ]);
    expect(sheets.get('_operation_requests')?.rows[0]).toEqual([
      'request_id',
      'operation_type',
      'result_entity_id',
      'status',
      'created_at',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '001_foundation'),
    ).toHaveLength(1);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '002_operation_requests'),
    ).toHaveLength(1);
  });

  it('refuses schema setup on PROD', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'PROD',
      SPREADSHEET_ID: 'prod-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.setupSchema()).toThrow('RESET_PROD_FORBIDDEN');
  });

  it('refuses unexpected headers when the sheet already has data', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    sheets.set(
      '_meta',
      createSheet([
        ['id', 'value'],
        ['schema_version', '1'],
      ]),
    );
    expect(() => server.setupSchema()).toThrow('HEADER_MISMATCH');
  });

  it('refuses unknown applied migrations', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    sheets.set('_meta', createSheet([['key', 'value']]));
    sheets.set(
      '_schema_migrations',
      createSheet([
        [
          'migration_id',
          'applied_at',
          'app_version',
          'checksum',
          'description',
        ],
        ['999_unknown', '', '', '', ''],
      ]),
    );
    expect(() => server.setupSchema()).toThrow('UNKNOWN_MIGRATION');
  });

  it('replays the same probe result on retry and double submit', () => {
    const { server, sheets, batchUpdate, releaseLock } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    const requestId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

    const first = server.probeIdempotentOperation(requestId);
    const retry = server.probeIdempotentOperation(requestId);
    const doubleSubmit = server.probeIdempotentOperation(requestId);

    expect(first.replayed).toBe(false);
    expect(retry).toEqual({ ...first, replayed: true });
    expect(doubleSubmit).toEqual(retry);
    expect(batchUpdate).toHaveBeenCalledTimes(1);
    expect(releaseLock).toHaveBeenCalled();
    expect(
      sheets
        .get('_operation_requests')
        ?.rows.filter((row) => row[0] === requestId),
    ).toHaveLength(1);
  });

  it('clears fictitious operation requests on E2E reset', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.probeIdempotentOperation('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    expect(server.resetE2E()).toEqual({ reset: true, environment: 'E2E' });
    expect(sheets.get('_operation_requests')?.rows).toEqual([
      [
        'request_id',
        'operation_type',
        'result_entity_id',
        'status',
        'created_at',
      ],
    ]);
  });

  it('rejects a row number as probe request_id and still releases the lock', () => {
    const { server, releaseLock } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.probeIdempotentOperation('2')).toThrow(
      'INVALID_REQUEST_ID',
    );
    expect(releaseLock).toHaveBeenCalled();
  });

  it('times out when the script lock is busy', () => {
    const { server, releaseLock } = loadServer(
      {
        ENVIRONMENT: 'E2E',
        SPREADSHEET_ID: 'e2e-sheet-id',
        APP_VERSION: '0.1.0-dev',
      },
      { lockAcquired: false },
    );
    expect(() =>
      server.probeIdempotentOperation('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
    ).toThrow('LOCK_TIMEOUT');
    expect(releaseLock).not.toHaveBeenCalled();
  });
});
