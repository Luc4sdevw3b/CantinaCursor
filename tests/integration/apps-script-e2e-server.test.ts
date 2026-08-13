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
  schemaVersion: number;
  backupConfigured: boolean;
  lastBackupAt: string | null;
}

interface ServerContext {
  doGet(): unknown;
  getHealth(): E2EHealth;
  configureE2EEnvironment(spreadsheetId?: string): E2EHealth;
  resetE2E(sessionToken: string): { reset: true; environment: string };
  seedE2E(sessionToken: string): {
    marker: string;
    seeded: true;
    environment: string;
  };
  setupSchema(): {
    schemaVersion: number;
    appliedMigrations: string[];
    environment: string;
  };
  probeIdempotentOperation(
    sessionToken: string,
    requestId: string,
  ): {
    requestId: string;
    resultEntityId: string;
    replayed: boolean;
    status: string;
  };
  runBackup(
    sessionToken: string,
    reason?: string,
  ): {
    createdAt: string;
    reason: string;
    schemaVersion: number;
  };
  prepareRestore(
    sessionToken: string,
    backupId: string,
    confirmed: boolean,
  ): {
    prepared: true;
    merge: false;
    snapshotValid: true;
    currentBackupCreated: true;
  };
  loginE2E(role: 'owner' | 'staff'): { token: string; role: 'owner' | 'staff' };
  loginWithGoogle(): { token: string; role: 'owner' | 'staff' };
  getSession(sessionToken: string): { role: 'owner' | 'staff' };
  logout(sessionToken: string): { loggedOut: true };
  listSchoolYears(sessionToken: string): Array<{
    id: string;
    label: string;
    startedOn: string;
    endedOn: string | null;
    active: boolean;
  }>;
  createSchoolYear(
    sessionToken: string,
    payload: { label: string; startedOn: string },
  ): { id: string; label: string; startedOn: string; active: boolean };
  listClassrooms(
    sessionToken: string,
    schoolYearId?: string,
  ): Array<{
    id: string;
    schoolYearId: string;
    name: string;
    active: boolean;
  }>;
  createClassroom(
    sessionToken: string,
    payload: { schoolYearId: string; name: string },
  ): { id: string; schoolYearId: string; name: string; active: boolean };
  listStudents(
    sessionToken: string,
    query?: { includeInactive?: boolean },
  ): Array<{
    id: string;
    fullName: string;
    active: boolean;
    ageLabel: string;
    classroomName: string | null;
    schoolYearLabel: string | null;
    isHomonym: boolean;
    primaryGuardianName: string | null;
    needsGuardian: boolean;
  }>;
  getStudent(
    sessionToken: string,
    id: string,
  ): {
    id: string;
    fullName: string;
    active: boolean;
    ageLabel: string;
    enrollments: Array<{ classroomName: string; endedOn: string | null }>;
  };
  createStudent(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { id: string; fullName: string; active: boolean; ageLabel: string };
  deactivateStudent(
    sessionToken: string,
    id: string,
  ): { id: string; active: boolean };
  reactivateStudent(
    sessionToken: string,
    id: string,
    payload: Record<string, unknown>,
  ): { id: string; active: boolean };
  listGuardians(sessionToken: string): Array<{
    id: string;
    fullName: string;
    whatsappEnabled: boolean;
    relationLabel: string;
  }>;
  createGuardian(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { id: string; fullName: string };
  linkGuardian(
    sessionToken: string,
    studentId: string,
    guardianId: string,
    payload?: Record<string, unknown>,
  ): Array<{ guardianName: string; isPrimary: boolean }>;
  listSiblings(
    sessionToken: string,
    studentId: string,
  ): Array<{ id: string; fullName: string }>;
  authorizeSibling(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { id: string; canChargeAccount: boolean };
  listSiblingAuthorizations(
    sessionToken: string,
    studentId?: string,
  ): Array<{
    consumerStudentId: string;
    accountStudentId: string;
    canChargeAccount: boolean;
    canUseAccountCredit: boolean;
    active: boolean;
  }>;
  getGuardianSettings(sessionToken: string): {
    requireGuardianBelowAge: number;
  };
  setRequireGuardianBelowAge(
    sessionToken: string,
    age: number,
  ): { requireGuardianBelowAge: number };
}

interface DriveMockFile {
  id: string;
  name: string;
  created: Date;
  trashed: boolean;
  getId: () => string;
  getName: () => string;
  getDateCreated: () => Date;
  isTrashed: () => boolean;
  setDescription: (value: string) => DriveMockFile;
  setTrashed: (value: boolean) => void;
  makeCopy: (copyName: string, folder: { id: string }) => DriveMockFile;
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
  options: {
    hasSpreadsheet?: boolean;
    lockAcquired?: boolean;
    googleEmail?: string;
  } = {},
) {
  const hasSpreadsheet = options.hasSpreadsheet ?? true;
  const lockState = { acquired: options.lockAcquired ?? true };
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
  const driveFolders = new Map<
    string,
    { id: string; files: DriveMockFile[] }
  >();
  const driveFiles = new Map<string, DriveMockFile>();
  const projectTriggers: string[] = [];

  function createDriveFile(id: string, name: string, created = new Date()) {
    const file = {
      id,
      name,
      created,
      trashed: false,
      getId: () => file.id,
      getName: () => file.name,
      getDateCreated: () => file.created,
      isTrashed: () => file.trashed,
      setDescription: (value: string) => {
        void value;
        return file;
      },
      setTrashed: (value: boolean) => {
        file.trashed = value;
      },
      makeCopy: (copyName: string, folder: { id: string }) => {
        const copy = createDriveFile(
          `backup-file-${driveFiles.size + 1}`,
          copyName,
        );
        driveFiles.set(copy.id, copy);
        const target = driveFolders.get(folder.id);
        target?.files.push(copy);
        return copy;
      },
    };
    return file;
  }

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
        setProperty: (key: string, value: string) => {
          properties[key] = value;
        },
      }),
    },
    SpreadsheetApp: {
      openById,
      getActiveSpreadsheet: () =>
        hasSpreadsheet ? { getId: () => 'e2e-sheet-id' } : null,
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => lockState.acquired,
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
    DriveApp: {
      createFolder: (name: string) => {
        const folder = {
          id: 'e2e-backup-folder',
          name,
          files: [] as DriveMockFile[],
        };
        driveFolders.set(folder.id, folder);
        return {
          getId: () => folder.id,
          getFiles: () => {
            const remaining = folder.files.filter((file) => !file.trashed);
            let index = 0;
            return {
              hasNext: () => index < remaining.length,
              next: () => remaining[index++],
            };
          },
        };
      },
      getFolderById: (id: string) => {
        const folder = driveFolders.get(id);
        if (!folder) {
          throw new Error('BACKUP_FOLDER_MISSING');
        }
        return {
          id: folder.id,
          getId: () => folder.id,
          getFiles: () => {
            const remaining = folder.files.filter((file) => !file.trashed);
            let index = 0;
            return {
              hasNext: () => index < remaining.length,
              next: () => remaining[index++],
            };
          },
        };
      },
      getFileById: (id: string) =>
        driveFiles.get(id) ?? createDriveFile(id, 'spreadsheet'),
    },
    ScriptApp: {
      getProjectTriggers: () =>
        projectTriggers.map((handler) => ({
          getHandlerFunction: () => handler,
        })),
      newTrigger: (handler: string) => ({
        timeBased: () => ({
          everyDays: () => ({
            atHour: () => ({
              create: () => {
                projectTriggers.push(handler);
              },
            }),
          }),
        }),
      }),
    },
    Session: {
      getActiveUser: () => ({
        getEmail: () => options.googleEmail ?? '',
      }),
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
    driveFolders,
    projectTriggers,
    lockState,
  };
}

function ownerToken(server: ServerContext): string {
  return server.loginE2E('owner').token;
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
    expect(JSON.stringify(health)).not.toContain('e2e-backup-folder');
  });

  it('returns health metadata without exposing the spreadsheet id', () => {
    const { server, openById } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'private-e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    const health = server.getHealth();
    expect(health.appName).toBe('Cantina V2 AppScript');
    expect(health.version).toBe('0.1.0-dev');
    expect(health.environment).toBe('E2E');
    expect(health.status).toBe('ready');
    expect(health.adapter).toBe('google-script');
    expect(health.spreadsheetConfigured).toBe(true);
    expect(health.schemaVersion).toBe(6);
    expect(health.backupConfigured).toBe(true);
    expect(health.lastBackupAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(JSON.stringify(health)).not.toContain('private-e2e-sheet-id');
    expect(JSON.stringify(health)).not.toContain('e2e-backup-folder');
    expect(JSON.stringify(health)).not.toContain('backup-file-');
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
    expect(() => server.resetE2E('token')).toThrow('RESET_PROD_FORBIDDEN');
    expect(() => server.seedE2E('token')).toThrow('RESET_PROD_FORBIDDEN');
  });

  it('refuses reset, seed and schema setup on DEV', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'DEV',
      SPREADSHEET_ID: 'dev-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.resetE2E('token')).toThrow('E2E_ONLY');
    expect(() => server.seedE2E('token')).toThrow('E2E_ONLY');
    expect(() => server.setupSchema()).toThrow('E2E_ONLY');
  });

  it('resets and seeds only fictitious E2E data', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    expect(server.resetE2E(ownerToken(server))).toEqual({
      reset: true,
      environment: 'E2E',
    });
    expect(server.seedE2E(ownerToken(server))).toEqual({
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
    expect(first.schemaVersion).toBe(6);
    expect(first.appliedMigrations).toEqual([
      '001_foundation',
      '002_operation_requests',
      '003_backups',
      '004_users',
      '005_students',
      '006_guardians',
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
    expect(sheets.get('_backups')?.rows[0]).toEqual([
      'id',
      'created_at',
      'app_version',
      'schema_version',
      'reason',
      'status',
      'drive_file_id',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '003_backups'),
    ).toHaveLength(1);
    expect(sheets.get('_users')?.rows[0]).toEqual([
      'id',
      'google_subject',
      'role',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_sessions')?.rows[0]).toEqual([
      'id',
      'user_id',
      'role',
      'created_at',
      'expires_at',
      'revoked',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '004_users'),
    ).toHaveLength(1);
    expect(sheets.get('_students')?.rows[0]?.[0]).toBe('id');
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '005_students'),
    ).toHaveLength(1);
    expect(sheets.get('_guardians')?.rows[0]?.[0]).toBe('id');
    expect(sheets.get('_settings')?.rows[0]).toEqual(['key', 'value']);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '006_guardians'),
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
    const token = ownerToken(server);
    const requestId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

    const first = server.probeIdempotentOperation(token, requestId);
    const retry = server.probeIdempotentOperation(token, requestId);
    const doubleSubmit = server.probeIdempotentOperation(token, requestId);

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
    const token = ownerToken(server);
    server.probeIdempotentOperation(
      token,
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    );
    expect(server.resetE2E(token)).toEqual({ reset: true, environment: 'E2E' });
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
    expect(() =>
      server.probeIdempotentOperation(ownerToken(server), '2'),
    ).toThrow('INVALID_REQUEST_ID');
    expect(releaseLock).toHaveBeenCalled();
  });

  it('times out when the script lock is busy', () => {
    const { server, releaseLock, lockState } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    const token = ownerToken(server);
    releaseLock.mockClear();
    lockState.acquired = false;
    expect(() =>
      server.probeIdempotentOperation(
        token,
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      ),
    ).toThrow('LOCK_TIMEOUT');
    expect(releaseLock).not.toHaveBeenCalled();
  });

  it('backs up before pending migrations and schedules a daily trigger once', () => {
    const { server, sheets, projectTriggers, driveFolders } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    server.setupSchema();
    const token = ownerToken(server);
    server.setupSchema();
    const backup = server.runBackup(token, 'manual');

    expect(backup.reason).toBe('manual');
    expect(backup.schemaVersion).toBe(6);
    expect(JSON.stringify(backup)).not.toContain('e2e-sheet-id');
    expect(JSON.stringify(backup)).not.toContain('e2e-backup-folder');
    expect(projectTriggers).toEqual(['runScheduledBackup']);
    expect(sheets.get('_backups')?.rows.length).toBeGreaterThan(1);
    expect(driveFolders.get('e2e-backup-folder')?.files.length).toBeGreaterThan(
      0,
    );
  });

  it('prepares restore only with confirmation and never merges', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.setupSchema();
    const token = ownerToken(server);
    const backupId = String(sheets.get('_backups')?.rows[1]?.[0] || '');

    expect(() => server.prepareRestore(token, backupId, false)).toThrow(
      'RESTORE_NOT_CONFIRMED',
    );
    expect(() => server.prepareRestore(token, '2', true)).toThrow(
      'INVALID_BACKUP_ID',
    );
    expect(server.prepareRestore(token, backupId, true)).toEqual({
      prepared: true,
      merge: false,
      snapshotValid: true,
      currentBackupCreated: true,
    });
  });

  it('refuses backup and restore on PROD', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'PROD',
      SPREADSHEET_ID: 'prod-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(() => server.runBackup('token', 'manual')).toThrow(
      'RESET_PROD_FORBIDDEN',
    );
    expect(() =>
      server.prepareRestore(
        'token',
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        true,
      ),
    ).toThrow('RESET_PROD_FORBIDDEN');
  });

  it('creates E2E sessions without exposing email or a master password', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    const owner = server.loginE2E('owner');
    const staff = server.loginE2E('staff');

    expect(owner.role).toBe('owner');
    expect(staff.role).toBe('staff');
    expect(owner.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(owner).not.toHaveProperty('email');
    expect(JSON.stringify(owner)).not.toContain('@');
    expect(server.getSession(owner.token)).toEqual({ role: 'owner' });
    expect(server.getHealth()).not.toHaveProperty('email');
  });

  it('refuses loginE2E on PROD and anonymous private actions on E2E', () => {
    const prod = loadServer({
      ENVIRONMENT: 'PROD',
      SPREADSHEET_ID: 'prod-sheet-id',
      APP_VERSION: '0.1.0-dev',
    }).server;
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });

    expect(() => prod.loginE2E('owner')).toThrow('RESET_PROD_FORBIDDEN');
    expect(() => server.resetE2E('')).toThrow('UNAUTHENTICATED');
    expect(() => server.resetE2E('2')).toThrow('UNAUTHENTICATED');
    expect(() =>
      server.probeIdempotentOperation(
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      ),
    ).toThrow('UNAUTHENTICATED');
  });

  it('lets staff probe but not reset, backup or restore', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    const staff = server.loginE2E('staff').token;

    expect(
      server.probeIdempotentOperation(
        staff,
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      ).replayed,
    ).toBe(false);
    expect(() => server.resetE2E(staff)).toThrow('FORBIDDEN');
    expect(() => server.runBackup(staff, 'manual')).toThrow('FORBIDDEN');
    expect(() =>
      server.prepareRestore(
        staff,
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        true,
      ),
    ).toThrow('FORBIDDEN');
  });

  it('expires and revokes sessions', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    const owner = server.loginE2E('owner');
    const sessionRows = sheets.get('_sessions')?.rows ?? [];
    const sessionRow = sessionRows[sessionRows.length - 1];
    if (!sessionRow) {
      throw new Error('sessão E2E não foi gravada');
    }
    sessionRow[4] = '2000-01-01T00:00:00.000Z';

    expect(() => server.getSession(owner.token)).toThrow('SESSION_EXPIRED');

    const fresh = server.loginE2E('owner');
    expect(server.logout(fresh.token)).toEqual({ loggedOut: true });
    expect(() => server.resetE2E(fresh.token)).toThrow('UNAUTHENTICATED');
  });

  it('does not auto-promote an unknown Google identity', () => {
    const unknown = loadServer(
      {
        ENVIRONMENT: 'E2E',
        SPREADSHEET_ID: 'e2e-sheet-id',
        APP_VERSION: '0.1.0-dev',
      },
      { googleEmail: 'someone@example.test' },
    ).server;
    const empty = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    }).server;
    const matching = loadServer(
      {
        ENVIRONMENT: 'E2E',
        SPREADSHEET_ID: 'e2e-sheet-id',
        APP_VERSION: '0.1.0-dev',
      },
      { googleEmail: 'e2e-owner' },
    ).server;

    expect(() => unknown.loginWithGoogle()).toThrow('FORBIDDEN');
    expect(() => empty.loginWithGoogle()).toThrow('UNAUTHENTICATED');
    matching.loginE2E('owner');
    expect(matching.loginWithGoogle().role).toBe('owner');
    expect(matching.loginWithGoogle()).not.toHaveProperty('email');
  });

  it('keeps homonyms separate and requires review to reactivate', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    const token = ownerToken(server);
    server.seedE2E(token);
    const afterSeed = ownerToken(server);
    const listed = server.listStudents(afterSeed);
    const anas = listed.filter((student) => student.fullName === 'Ana Souza');

    expect(anas).toHaveLength(2);
    expect(anas.every((student) => student.isHomonym)).toBe(true);
    expect(new Set(anas.map((student) => student.id)).size).toBe(2);
    expect(anas.map((student) => student.ageLabel).sort()).toEqual([
      '10',
      '~8',
    ]);

    const bruno = listed.find((student) => student.fullName === 'Bruno Lima');
    if (!bruno) {
      throw new Error('Bruno Lima não foi semeado');
    }
    expect(server.deactivateStudent(afterSeed, bruno.id).active).toBe(false);
    expect(() =>
      server.reactivateStudent(afterSeed, bruno.id, { reviewed: false }),
    ).toThrow('REACTIVATION_REVIEW_REQUIRED');
    expect(
      server.reactivateStudent(afterSeed, bruno.id, {
        reviewed: true,
        fullName: 'Bruno Lima',
        birthDate: '2015-06-01',
      }).active,
    ).toBe(true);
    expect(() => server.getStudent(afterSeed, '2')).toThrow('INVALID_ID');
  });

  it('lets staff register a student and refuses anonymous access', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    const staff = server.loginE2E('staff').token;
    const year = server.createSchoolYear(staff, {
      label: '2026',
      startedOn: '2026-02-01',
    });
    const classroom = server.createClassroom(staff, {
      schoolYearId: year.id,
      name: '1º A',
    });
    const created = server.createStudent(staff, {
      fullName: 'Carla Nunes',
      approximateAge: 7,
      approximateAgeReferenceYear: 2026,
      classroomId: classroom.id,
      startedOn: '2026-02-01',
    });

    expect(created.fullName).toBe('Carla Nunes');
    expect(created.ageLabel).toBe('~7');
    expect(() => server.listStudents('')).toThrow('UNAUTHENTICATED');
  });

  it('links siblings through a shared guardian and keeps the age setting to the owner', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const listed = server.listStudents(owner);
    const anaApprox = listed.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const anaBirth = listed.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '10',
    );
    const bruno = listed.find((student) => student.fullName === 'Bruno Lima');
    const guardians = server.listGuardians(owner);
    const maria = guardians.find((item) => item.fullName === 'Maria Souza');
    const paulo = guardians.find((item) => item.fullName === 'Paulo Nunes');

    if (!anaApprox || !anaBirth || !bruno || !maria || !paulo) {
      throw new Error('família E2E incompleta');
    }

    expect(anaApprox.primaryGuardianName).toBe('Maria Souza');
    expect(anaBirth.primaryGuardianName).toBe('Paulo Nunes');
    expect(bruno.primaryGuardianName).toBe('Maria Souza');
    expect(maria.whatsappEnabled).toBe(true);
    expect(paulo.whatsappEnabled).toBe(false);
    expect(
      server.listSiblings(owner, anaApprox.id).map((item) => item.id),
    ).toEqual([bruno.id]);
    expect(
      server
        .listSiblingAuthorizations(owner, bruno.id)
        .some(
          (item) =>
            item.consumerStudentId === bruno.id &&
            item.accountStudentId === anaApprox.id &&
            item.canChargeAccount &&
            !item.canUseAccountCredit,
        ),
    ).toBe(true);
    expect(() =>
      server.authorizeSibling(owner, {
        consumerStudentId: anaBirth.id,
        accountStudentId: anaApprox.id,
        canChargeAccount: true,
      }),
    ).toThrow('NOT_SIBLINGS');

    const staff = server.loginE2E('staff').token;
    expect(
      server.createGuardian(staff, {
        fullName: 'Carla Mendes',
        phone: '11999990003',
        whatsappEnabled: false,
        relationLabel: 'tia',
      }).fullName,
    ).toBe('Carla Mendes');
    expect(() => server.setRequireGuardianBelowAge(staff, 16)).toThrow(
      'FORBIDDEN',
    );
    expect(server.setRequireGuardianBelowAge(owner, 16)).toEqual({
      requireGuardianBelowAge: 16,
    });
    expect(() => server.listGuardians('')).toThrow('UNAUTHENTICATED');
  });
});
