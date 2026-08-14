import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { formatCivilDisplay } from '../../src/domain/civil-date';

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
  doGet(e?: { parameter?: { portal?: string } }): unknown;
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
  updateClassroom(
    sessionToken: string,
    id: string,
    payload: { name: string },
  ): { id: string; schoolYearId: string; name: string; active: boolean };
  deactivateClassroom(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
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
  updateStudent(
    sessionToken: string,
    id: string,
    payload: Record<string, unknown>,
  ): {
    id: string;
    fullName: string;
    enrollments: Array<{ classroomId: string; endedOn: string | null }>;
  };
  enrollStudent(
    sessionToken: string,
    id: string,
    payload: Record<string, unknown>,
  ): { id: string; classroomName: string | null };
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
  updateGuardian(
    sessionToken: string,
    id: string,
    payload: Record<string, unknown>,
  ): { id: string; fullName: string; relationLabel: string; active: boolean };
  deactivateGuardian(
    sessionToken: string,
    id: string,
  ): { id: string; active: boolean };
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
  revokeSiblingAuthorization(
    sessionToken: string,
    id: string,
  ): { id: string; active: boolean };
  listSiblingAuthorizations(
    sessionToken: string,
    studentId?: string,
  ): Array<{
    id: string;
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
  listProductCategories(sessionToken: string): Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
  createCategory(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { id: string; name: string; active: boolean };
  updateCategory(
    sessionToken: string,
    id: string,
    payload: Record<string, unknown>,
  ): { id: string; name: string; active: boolean };
  deactivateCategory(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
  activateCategory(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
  deleteCategory(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
  listProducts(
    sessionToken: string,
    query?: { includeInactive?: boolean },
  ): Array<{
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
    priceCents: number;
    priceLabel: string;
    active: boolean;
  }>;
  createProduct(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { id: string; name: string; priceCents: number };
  updateProduct(
    sessionToken: string,
    id: string,
    payload: Record<string, unknown>,
  ): { id: string; priceCents: number };
  deactivateProduct(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
  activateProduct(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
  deleteProduct(
    sessionToken: string,
    id: string,
  ): { id: string; name: string; active: boolean };
  listProductPriceHistory(
    sessionToken: string,
    productId: string,
  ): Array<{
    id: string;
    priceCents: number;
    endedAt: string | null;
  }>;
  createAdHocItem(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { id: string; name: string; priceCents: number; priceLabel: string };
  listAdHocItems(sessionToken: string): Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
  getInventoryDay(
    sessionToken: string,
    businessDate?: string,
  ): {
    id: string;
    businessDate: string;
    status: string;
  } | null;
  listInventoryBalances(
    sessionToken: string,
    businessDate?: string,
  ): {
    businessDate: string;
    items: Array<{
      productName: string;
      physicalQuantity: number;
      quantityLabel: string;
      soldOut: boolean;
    }>;
  };
  adjustInventory(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    items: Array<{
      productName: string;
      physicalQuantity: number;
      quantityLabel: string;
    }>;
  };
  listInventoryMovements(
    sessionToken: string,
    businessDate?: string,
  ): Array<{
    productName: string;
    quantityDelta: number;
    reason: string;
    kind: string;
  }>;
  createSale(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    id: string;
    summaryLabel: string;
    paymentKind: string;
    netTotalCents: number;
    changeCents: number;
    sourceReservationId: string | null;
    settlements: Array<{ kind: string; amountCents: number }>;
    screen?: {
      products: Array<{ id: string; name: string }>;
      sales: Array<{ summaryLabel: string }>;
      inventory: {
        items: Array<{ productName: string; physicalQuantity: number }>;
      };
    };
  };
  getSaleScreenData(sessionToken: string): {
    products: Array<{ id: string; name: string; priceCents: number }>;
    students: Array<{ id: string }>;
    sales: Array<{ summaryLabel: string }>;
    pixCopyText: string;
    inventory: {
      items: Array<{ productName: string; physicalQuantity: number }>;
    };
  };
  listSales(
    sessionToken: string,
  ): Array<{ summaryLabel: string; status: string }>;
  getPixCopyText(sessionToken: string): { text: string };
  getDueDateShortcuts(sessionToken: string): {
    today: string;
    tomorrow: string;
    nextFriday: string;
    plus7: string;
  };
  listReceivables(sessionToken: string): {
    overdue: Array<{ id: string; summaryLabel: string }>;
    today: Array<{ id: string; summaryLabel: string }>;
    upcoming: Array<{ id: string; summaryLabel: string }>;
    dueDateHistory: Array<{ summaryLabel: string }>;
  };
  createPayment(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  createFamilyPayment(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  listPayments(sessionToken: string): Array<{ summaryLabel: string }>;
  addReceivableInterest(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  renegotiateReceivable(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  listCreditAccounts(sessionToken: string): Array<{ summaryLabel: string }>;
  depositPersonalCredit(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  refundPersonalCredit(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  depositGuardianCredit(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  refundGuardianCredit(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { summaryLabel: string };
  getCashSetup(sessionToken: string): {
    businessDate: string;
    openSession: {
      expectedCents: number;
      summaryLabel: string;
      movements: Array<{ kind: string; summaryLabel: string }>;
    } | null;
    recentSessions: Array<{ status: string; summaryLabel: string }>;
  };
  openCashSession(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    openSession: {
      expectedCents: number;
      movements: Array<{ kind: string; summaryLabel: string }>;
    } | null;
  };
  addCashForChange(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { openSession: { expectedCents: number } | null };
  removeCash(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): { openSession: { expectedCents: number } | null };
  closeCashSession(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    openSession: { expectedCents: number } | null;
    recentSessions: Array<{
      status: string;
      expectedCents: number;
      countedCents: number | null;
      differenceCents: number | null;
      closeNote: string;
    }>;
  };
  getReversalsSetup(sessionToken: string): {
    sales: Array<{
      id: string;
      displayName: string;
      status: string;
      hasTrackedItems: boolean;
    }>;
    recentReversals: Array<{
      reason: string;
      effects: Array<{ type: string; summaryLabel: string }>;
    }>;
  };
  reverseSale(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    recentReversals: Array<{
      reason: string;
      effects: Array<{ type: string; summaryLabel: string }>;
    }>;
  };
  getReservationsSetup(sessionToken: string): {
    slots: Array<{ id: string; label: string; openForReservations: boolean }>;
    reservableProducts: Array<{ id: string; name: string }>;
    reservations: Array<{
      id: string;
      summaryLabel: string;
      status: string;
      classroomText: string;
      linkedStudentLabel: string;
    }>;
    availability: Array<{
      productName: string;
      summaryLabel: string;
      reservedQuantity: number;
    }>;
    production: Array<{ summaryLabel: string }>;
  };
  createReservationSlot(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    slots: Array<{ id: string; label: string }>;
  };
  createReservation(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    reservations: Array<{ id: string; summaryLabel: string }>;
    availability: Array<{ productName: string; reservedQuantity: number }>;
    production: Array<{ summaryLabel: string }>;
  };
  getPublicReservationPortal(): {
    slots: Array<{ id: string; label: string; summaryLabel: string }>;
    products: Array<{
      id: string;
      name: string;
      summaryLabel: string;
      soldOut: boolean;
    }>;
  };
  createPublicReservation(payload: Record<string, unknown>): {
    publicCode: string;
    publicCodeLabel: string;
    summaryLabel: string;
  };
  updateReservation(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    reservations: Array<{
      id: string;
      summaryLabel: string;
      status: string;
      classroomText: string;
      contactOptional: string;
      linkedStudentLabel: string;
    }>;
    production: Array<{ summaryLabel: string }>;
    availability: Array<{ productName: string; reservedQuantity: number }>;
  };
  linkReservationStudent(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    reservations: Array<{
      studentNameText: string;
      linkedStudentLabel: string;
    }>;
  };
  fulfillReservation(
    sessionToken: string,
    payload: Record<string, unknown>,
  ): {
    reservations: Array<{ status: string; summaryLabel: string }>;
    production: Array<{ summaryLabel: string }>;
    availability: Array<{ productName: string; reservedQuantity: number }>;
  };
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

function createSheet(rows: unknown[][] = [[]], sheetId = 1, name = '') {
  const sheet = {
    rows,
    getSheetId: () => sheetId,
    getName: () => name,
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
      const sheet = createSheet([[]], nextSheetId, name);
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
    getContent: vi.fn(() => '<html><head></head><body id="app"></body></html>'),
  };
  const portalOutput = {
    setTitle: vi.fn(() => portalOutput),
    addMetaTag: vi.fn(() => portalOutput),
    setXFrameOptionsMode: vi.fn(() => portalOutput),
    getContent: vi.fn(() => ''),
    html: '',
  };
  const createHtmlOutput = vi.fn((html: string) => {
    portalOutput.html = html;
    portalOutput.getContent = vi.fn(() => html);
    return portalOutput;
  });
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

  const scriptCache = new Map<string, string>();
  const context = {
    Date,
    String,
    Number,
    Object,
    Array,
    Math,
    JSON,
    Boolean,
    Error,
    parseInt,
    HtmlService: {
      createHtmlOutputFromFile: vi.fn(() => output),
      createHtmlOutput,
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
    },
    Logger: {
      log: () => {},
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key: string) => scriptCache.get(key) ?? null,
        put: (key: string, value: string) => {
          scriptCache.set(key, value);
        },
        remove: (key: string) => {
          scriptCache.delete(key);
        },
      }),
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
      formatDate: (date: Date, timeZone: string, format: string) => {
        if (format === 'HH:mm') {
          const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timeZone || 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          }).formatToParts(date);
          const hour =
            parts.find((part) => part.type === 'hour')?.value ?? '00';
          const minute =
            parts.find((part) => part.type === 'minute')?.value ?? '00';
          return `${hour}:${minute}`;
        }
        if (format !== 'yyyy-MM-dd') {
          return String(date);
        }
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timeZone || 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).formatToParts(date);
        const year = parts.find((part) => part.type === 'year')?.value;
        const month = parts.find((part) => part.type === 'month')?.value;
        const day = parts.find((part) => part.type === 'day')?.value;
        return `${year}-${month}-${day}`;
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
    scriptCache,
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
    expect(health.schemaVersion).toBe(15);
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
    expect(first.schemaVersion).toBe(15);
    expect(first.appliedMigrations).toEqual([
      '001_foundation',
      '002_operation_requests',
      '003_backups',
      '004_users',
      '005_students',
      '006_guardians',
      '007_products',
      '008_inventory',
      '009_sales',
      '010_receivables',
      '011_payments',
      '012_credits',
      '013_cash',
      '014_reversals',
      '015_reservations',
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
    expect(sheets.get('_sales')?.rows[0]).toEqual([
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
    ]);
    expect(sheets.get('_sale_items')?.rows[0]?.[0]).toBe('id');
    expect(sheets.get('_sale_settlements')?.rows[0]).toEqual([
      'id',
      'sale_id',
      'kind',
      'amount_cents',
      'related_entity_id',
      'created_at',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '009_sales'),
    ).toHaveLength(1);
    expect(sheets.get('_receivables')?.rows[0]).toEqual([
      'id',
      'charged_student_id',
      'source_sale_id',
      'due_date',
      'status',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_receivable_charges')?.rows[0]).toEqual([
      'id',
      'receivable_id',
      'kind',
      'amount_cents',
      'reason_code',
      'note',
      'created_by',
      'created_at',
      'reversal_id',
    ]);
    expect(sheets.get('_receivable_due_date_history')?.rows[0]).toEqual([
      'receivable_id',
      'old_due_date',
      'new_due_date',
      'reason',
      'changed_by',
      'changed_at',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '010_receivables'),
    ).toHaveLength(1);
    expect(sheets.get('_payments')?.rows[0]).toEqual([
      'id',
      'payer_guardian_id',
      'payer_student_id',
      'method',
      'amount_received_cents',
      'status',
      'created_by',
      'created_at',
      'note',
    ]);
    expect(sheets.get('_payment_allocations')?.rows[0]).toEqual([
      'payment_id',
      'receivable_id',
      'student_id',
      'amount_cents',
    ]);
    expect(sheets.get('_credit_accounts')?.rows[0]).toEqual([
      'id',
      'owner_type',
      'owner_student_id',
      'owner_guardian_id',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_credit_account_students')?.rows[0]).toEqual([
      'credit_account_id',
      'student_id',
      'can_use',
      'active',
    ]);
    expect(sheets.get('_credit_movements')?.rows[0]).toEqual([
      'credit_account_id',
      'kind',
      'amount_delta_cents',
      'source_type',
      'source_id',
      'student_id',
      'created_by',
      'created_at',
      'note',
    ]);
    expect(sheets.get('_payment_credit_allocations')?.rows[0]).toEqual([
      'payment_id',
      'credit_account_id',
      'amount_cents',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '011_payments'),
    ).toHaveLength(1);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '012_credits'),
    ).toHaveLength(1);
    expect(sheets.get('_cash_sessions')?.rows[0]).toEqual([
      'id',
      'business_date',
      'status',
      'opening_float_cents',
      'opened_by',
      'opened_at',
      'closed_by',
      'closed_at',
      'expected_close_cents',
      'counted_close_cents',
      'difference_cents',
      'close_note',
    ]);
    expect(sheets.get('_cash_movements')?.rows[0]).toEqual([
      'id',
      'cash_session_id',
      'kind',
      'amount_delta_cents',
      'source_type',
      'source_id',
      'created_by',
      'created_at',
      'note',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '013_cash'),
    ).toHaveLength(1);
    expect(sheets.get('_operation_reversals')?.rows[0]).toEqual([
      'id',
      'operation_type',
      'operation_id',
      'reason',
      'original_methods',
      'refund_method',
      'different_method_confirmed',
      'returned_to_stock',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_reversal_effects')?.rows[0]).toEqual([
      'id',
      'reversal_id',
      'effect_type',
      'entity_type',
      'entity_id',
      'amount_delta_cents',
      'quantity_delta',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '014_reversals'),
    ).toHaveLength(1);
    expect(sheets.get('_reservation_slots')?.rows[0]).toEqual([
      'id',
      'business_date',
      'label',
      'pickup_starts_at',
      'pickup_ends_at',
      'cutoff_at',
      'active',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_reservations')?.rows[0]).toEqual([
      'id',
      'public_code',
      'request_id',
      'requester_name',
      'student_name_text',
      'classroom_text',
      'contact_optional',
      'slot_id',
      'status',
      'payment_status',
      'linked_student_id',
      'total_cents',
      'created_at',
      'updated_at',
      'note',
    ]);
    expect(sheets.get('_reservation_items')?.rows[0]).toEqual([
      'id',
      'reservation_id',
      'product_id',
      'description_snapshot',
      'quantity',
      'unit_price_cents',
      'line_total_cents',
    ]);
    expect(sheets.get('_reservation_status_history')?.rows[0]).toEqual([
      'id',
      'reservation_id',
      'from_status',
      'to_status',
      'actor_id',
      'created_at',
      'reason',
    ]);
    expect(
      sheets
        .get('_schema_migrations')
        ?.rows.filter((row) => row[0] === '015_reservations'),
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
      createSheet(
        [
          ['id', 'value'],
          ['schema_version', '1'],
        ],
        1,
        '_meta',
      ),
    );
    expect(() => server.setupSchema()).toThrow('HEADER_MISMATCH');
  });

  it('refuses unknown applied migrations', () => {
    const { server, sheets } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    sheets.set('_meta', createSheet([['key', 'value']], 1, '_meta'));
    sheets.set(
      '_schema_migrations',
      createSheet(
        [
          [
            'migration_id',
            'applied_at',
            'app_version',
            'checksum',
            'description',
          ],
          ['999_unknown', '', '', '', ''],
        ],
        1,
        '_schema_migrations',
      ),
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
    expect(backup.schemaVersion).toBe(15);
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
    expect(
      server.updateStudent(staff, created.id, {
        fullName: 'Carla Nunes Silva',
        approximateAge: 7,
        approximateAgeReferenceYear: 2026,
      }).fullName,
    ).toBe('Carla Nunes Silva');
    expect(
      server.updateClassroom(staff, classroom.id, { name: '1º A manhã' }).name,
    ).toBe('1º A manhã');
    expect(() => server.deactivateClassroom(staff, classroom.id)).toThrow(
      'CLASSROOM_HAS_ACTIVE_STUDENTS',
    );
    const emptyRoom = server.createClassroom(staff, {
      schoolYearId: year.id,
      name: '6º D',
    });
    expect(server.deactivateClassroom(staff, emptyRoom.id).active).toBe(false);
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
    const carla = server
      .listGuardians(staff)
      .find((item) => item.fullName === 'Carla Mendes');
    if (!carla) {
      throw new Error('Carla Mendes ausente');
    }
    expect(
      server.updateGuardian(staff, carla.id, {
        fullName: 'Carla Mendes',
        phone: '11999990003',
        whatsappEnabled: false,
        relationLabel: 'madrinha',
      }).relationLabel,
    ).toBe('madrinha');
    expect(server.deactivateGuardian(staff, carla.id).active).toBe(false);
    expect(() => server.deactivateGuardian(staff, carla.id)).toThrow(
      'GUARDIAN_ALREADY_INACTIVE',
    );
    expect(() => server.setRequireGuardianBelowAge(staff, 16)).toThrow(
      'FORBIDDEN',
    );
    expect(server.setRequireGuardianBelowAge(owner, 16)).toEqual({
      requireGuardianBelowAge: 16,
    });
    expect(() => server.listGuardians('')).toThrow('UNAUTHENTICATED');
  });

  it('seeds catalog products, keeps ad-hoc to the owner and refuses anonymous access', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const products = server.listProducts(owner);
    const coxinha = products.find((item) => item.name === 'Coxinha');
    const suco = products.find((item) => item.name === 'Suco de uva');

    if (!coxinha || !suco) {
      throw new Error('cardápio E2E incompleto');
    }
    expect(coxinha.categoryName).toBe('Salgados');
    expect(coxinha.priceCents).toBe(550);
    expect(coxinha.priceLabel).toBe('R$ 5,50');
    expect(suco.priceCents).toBe(400);

    const history = server.listProductPriceHistory(owner, coxinha.id);
    expect(
      history.some((item) => item.priceCents === 550 && !item.endedAt),
    ).toBe(true);
    expect(
      server.updateProduct(owner, coxinha.id, {
        name: 'Coxinha',
        categoryId: coxinha.categoryId,
        priceCents: 600,
      }).priceCents,
    ).toBe(600);

    const staff = server.loginE2E('staff').token;
    expect(
      server.createProduct(staff, {
        name: 'Pão de queijo',
        categoryId: server
          .listProductCategories(staff)
          .find((item) => item.name === 'Salgados')?.id,
        priceCents: 450,
      }).name,
    ).toBe('Pão de queijo');
    expect(() =>
      server.createAdHocItem(staff, {
        name: 'Pastel da hora',
        priceCents: 600,
      }),
    ).toThrow('FORBIDDEN');

    const adHoc = server.createAdHocItem(owner, {
      name: 'Pastel da hora',
      priceCents: 600,
    });
    expect(adHoc.priceLabel).toBe('R$ 6,00');
    expect(server.listAdHocItems(owner).map((item) => item.name)).toContain(
      'Pastel da hora',
    );
    expect(
      server.listProducts(owner).some((item) => item.name === 'Pastel da hora'),
    ).toBe(false);
    const lanches = server.createCategory(owner, { name: 'Lanches' });
    expect(lanches.name).toBe('Lanches');
    expect(
      server.updateCategory(owner, lanches.id, { name: 'Lanche da tarde' })
        .name,
    ).toBe('Lanche da tarde');
    expect(
      server
        .listProductCategories(owner)
        .some((item) => item.name === 'Lanche da tarde'),
    ).toBe(true);
    expect(server.deactivateCategory(owner, lanches.id).active).toBe(false);
    expect(server.activateCategory(owner, lanches.id).active).toBe(true);
    server.deleteCategory(owner, lanches.id);
    expect(
      server
        .listProductCategories(owner)
        .some((item) => item.name === 'Lanche da tarde'),
    ).toBe(false);
    const salgados = server
      .listProductCategories(owner)
      .find((item) => item.name === 'Salgados');
    if (!salgados) {
      throw new Error('categoria Salgados ausente');
    }
    expect(() => server.deleteCategory(owner, salgados.id)).toThrow(
      'CATEGORY_HAS_PRODUCTS',
    );
    expect(() => server.deactivateCategory(owner, salgados.id)).toThrow(
      'CATEGORY_HAS_ACTIVE_PRODUCTS',
    );
    const extra = server.createProduct(owner, {
      name: 'Produto e2e excluir',
      categoryId: salgados.id,
      priceCents: 100,
    });
    server.deleteProduct(owner, extra.id);
    expect(
      server
        .listProducts(owner, { includeInactive: true })
        .some((item) => item.name === 'Produto e2e excluir'),
    ).toBe(false);
    expect(() => server.deleteProduct(owner, coxinha.id)).toThrow(
      'PRODUCT_IN_USE',
    );
    const inactive = server.createProduct(owner, {
      name: 'Produto e2e inativar',
      categoryId: salgados.id,
      priceCents: 100,
    });
    expect(server.deactivateProduct(owner, inactive.id).active).toBe(false);
    expect(server.activateProduct(owner, inactive.id).active).toBe(true);
    expect(() => server.listProducts('')).toThrow('UNAUTHENTICATED');
  });

  it('opens daily stock, shows ACABOU at zero and keeps adjustments to the owner', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const balances = server.listInventoryBalances(owner);
    const coxinha = balances.items.find(
      (item) => item.productName === 'Coxinha',
    );
    const suco = balances.items.find(
      (item) => item.productName === 'Suco de uva',
    );

    if (!coxinha || !suco) {
      throw new Error('estoque E2E incompleto');
    }
    expect(coxinha.physicalQuantity).toBe(10);
    expect(coxinha.quantityLabel).toBe('10');
    expect(suco.soldOut).toBe(true);
    expect(suco.quantityLabel).toBe('ACABOU');
    expect(
      balances.items.some((item) => item.productName === 'Brigadeiro'),
    ).toBe(false);

    const staff = server.loginE2E('staff').token;
    expect(server.listInventoryBalances(staff).items).toHaveLength(2);
    expect(() =>
      server.adjustInventory(staff, {
        productId: server
          .listProducts(staff)
          .find((item) => item.name === 'Coxinha')?.id,
        quantityDelta: -1,
        reason: 'quebra',
      }),
    ).toThrow('FORBIDDEN');

    const coxinhaId = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha')?.id;
    const adjusted = server.adjustInventory(owner, {
      productId: coxinhaId,
      quantityDelta: -3,
      reason: 'quebra',
    });
    expect(
      adjusted.items.find((item) => item.productName === 'Coxinha')
        ?.physicalQuantity,
    ).toBe(7);
    expect(
      server
        .listInventoryMovements(owner)
        .some(
          (item) =>
            item.productName === 'Coxinha' &&
            item.quantityDelta === -3 &&
            item.reason === 'quebra' &&
            item.kind === 'adjustment',
        ),
    ).toBe(true);
    expect(() => server.listInventoryBalances('')).toThrow('UNAUTHENTICATED');
  });

  it('records an anonymous PIX sale, lowers stock and refuses staff discount', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const products = server.listProducts(owner);
    const coxinha = products.find((item) => item.name === 'Coxinha');
    const suco = products.find((item) => item.name === 'Suco de uva');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );

    if (!coxinha || !suco || !ana) {
      throw new Error('venda E2E incompleta');
    }

    expect(server.getPixCopyText(owner).text).toBe(
      'Chave PIX de teste: cantina-e2e@example.test',
    );
    const sale = server.createSale(owner, {
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(sale.summaryLabel).toBe('Anônima • Coxinha • R$ 5,50');
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(9);
    expect(
      server
        .listInventoryMovements(owner)
        .some(
          (item) =>
            item.productName === 'Coxinha' &&
            item.kind === 'sale' &&
            item.quantityDelta === -1,
        ),
    ).toBe(true);

    expect(() =>
      server.createSale(owner, {
        items: [{ productId: suco.id, quantity: 1 }],
        paymentKind: 'pix',
      }),
    ).toThrow('INSUFFICIENT_STOCK');

    const named = server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(named.summaryLabel).toBe('Ana Souza • ~8 • Coxinha • R$ 5,50');

    const staff = server.loginE2E('staff').token;
    expect(server.listSales(staff)[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50',
    );
    expect(() =>
      server.createSale(staff, {
        items: [
          {
            productId: coxinha.id,
            quantity: 1,
            discountKind: 'amount',
            discountInput: 50,
          },
        ],
        paymentKind: 'pix',
      }),
    ).toThrow('FORBIDDEN');
    expect(() => server.listSales('')).toThrow('UNAUTHENTICATED');
  });

  it('records cash with change and mixed PIX plus cash', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    if (!coxinha) {
      throw new Error('venda E2E incompleta');
    }

    expect(() =>
      server.createSale(owner, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'cash',
        cashTenderedCents: 400,
      }),
    ).toThrow('INSUFFICIENT_CASH');

    expect(() =>
      server.createSale(owner, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'cash',
        cashTenderedCents: 1000,
      }),
    ).toThrow('CASH_SESSION_REQUIRED');

    server.openCashSession(owner, { openingFloatCents: 0 });

    const cash = server.createSale(owner, {
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'cash',
      cashTenderedCents: 1000,
    });
    expect(cash.summaryLabel).toBe(
      'Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50',
    );
    expect(cash.changeCents).toBe(450);
    expect(
      cash.settlements.some(
        (item) => item.kind === 'change' && item.amountCents === -450,
      ),
    ).toBe(true);
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(9);

    const mixed = server.createSale(owner, {
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'mixed',
      pixAmountCents: 300,
      cashTenderedCents: 300,
    });
    expect(mixed.summaryLabel).toBe(
      'Anônima • Coxinha • R$ 5,50 • PIX + dinheiro • Troco R$ 0,50',
    );
    expect(mixed.paymentKind).toBe('mixed');
  });

  it('records student fiado with due date and refuses anonymous fiado', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('venda E2E incompleta');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    expect(() =>
      server.createSale(owner, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'fiado',
        installments: [{ dueDate: shortcuts.tomorrow }],
      }),
    ).toThrow('FIADO_STUDENT_REQUIRED');

    const dueLabel = formatCivilDisplay(shortcuts.tomorrow);
    const sale = server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(sale.summaryLabel).toBe(
      `Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • ${dueLabel}`,
    );
    expect(sale.paymentKind).toBe('fiado');
    expect(sale.settlements.some((item) => item.kind === 'fiado')).toBe(true);
    expect(server.listReceivables(owner).upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 5,50 • ${dueLabel}`,
    );
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(9);

    const split = server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [
        { dueDate: shortcuts.tomorrow, amountCents: 300 },
        { dueDate: shortcuts.plus7, amountCents: 250 },
      ],
    });
    expect(split.summaryLabel).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • 2 vencimentos',
    );
    expect(server.listReceivables(owner).upcoming).toHaveLength(3);
  });

  it('pays oldest fiado first and keeps the remaining receivable', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('pagamento E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const overdueLabel = formatCivilDisplay('2026-01-01');
    const upcomingLabel = formatCivilDisplay(shortcuts.plus7);

    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-01-01' }],
    });
    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.plus7 }],
    });

    const payment = server.createPayment(owner, {
      studentId: ana.id,
      amountCents: 550,
      method: 'pix',
      mode: 'oldest_first',
    });
    expect(payment.summaryLabel).toBe('Ana Souza • ~8 • R$ 5,50 • PIX');
    expect(server.listReceivables(owner).overdue).toHaveLength(0);
    expect(server.listReceivables(owner).upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 5,50 • ${upcomingLabel}`,
    );
    expect(server.listPayments(owner)[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 5,50 • PIX',
    );
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(8);
    expect(overdueLabel).toContain('01/01/26');
  });

  it('allocates a manual partial onto the later due date', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('pagamento E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const overdueLabel = formatCivilDisplay('2026-01-01');
    const upcomingLabel = formatCivilDisplay(shortcuts.plus7);

    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: '2026-01-01' }],
    });
    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.plus7 }],
    });
    const upcoming = server.listReceivables(owner).upcoming[0];
    if (!upcoming) {
      throw new Error('recebível futuro ausente');
    }

    const payment = server.createPayment(owner, {
      studentId: ana.id,
      amountCents: 250,
      method: 'pix',
      mode: 'manual',
      allocations: [{ receivableId: upcoming.id, amountCents: 250 }],
    });
    expect(payment.summaryLabel).toBe('Ana Souza • ~8 • R$ 2,50 • PIX');
    expect(server.listReceivables(owner).overdue[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 5,50 • ${overdueLabel}`,
    );
    expect(server.listReceivables(owner).upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 3,00 • ${upcomingLabel}`,
    );
  });

  it('adds owner-only interest and renegotiates the due date', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('juros E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const firstLabel = formatCivilDisplay(shortcuts.tomorrow);
    const nextLabel = formatCivilDisplay(shortcuts.plus7);

    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    const receivable = server.listReceivables(owner).upcoming[0];
    if (!receivable) {
      throw new Error('recebível futuro ausente');
    }

    expect(() =>
      server.addReceivableInterest(staff, {
        receivableId: receivable.id,
        kind: 'amount',
        amountCents: 100,
        reason: 'Combinado na cantina',
      }),
    ).toThrow('FORBIDDEN');

    server.addReceivableInterest(owner, {
      receivableId: receivable.id,
      kind: 'amount',
      amountCents: 100,
      reason: 'Combinado na cantina',
    });
    expect(server.listReceivables(owner).upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 6,50 • ${firstLabel}`,
    );

    server.renegotiateReceivable(owner, {
      receivableId: receivable.id,
      dueDate: shortcuts.plus7,
      reason: 'Pedido da responsável',
    });
    const agenda = server.listReceivables(owner);
    expect(agenda.upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 6,50 • ${nextLabel}`,
    );
    expect(agenda.dueDateHistory[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • ${firstLabel} → ${nextLabel} • Pedido da responsável`,
    );
  });

  it('uses personal credit on fiado and deposits leftover after paying debt', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('crédito E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const dueLabel = formatCivilDisplay(shortcuts.tomorrow);

    expect(
      server.depositPersonalCredit(owner, {
        studentId: ana.id,
        amountCents: 200,
        method: 'pix',
      }).summaryLabel,
    ).toBe('Ana Souza • ~8 • R$ 2,00');

    const sale = server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(sale.summaryLabel).toBe(
      `Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito R$ 2,00 • ${dueLabel}`,
    );
    expect(server.listCreditAccounts(owner)[0]?.summaryLabel).toBe(
      'Ana Souza • ~8 • R$ 0,00',
    );
    expect(server.listReceivables(owner).upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 3,50 • ${dueLabel}`,
    );
  });

  it('pays personal debt first when depositing leftover credit', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('crédito E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);

    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(
      server.depositPersonalCredit(owner, {
        studentId: ana.id,
        amountCents: 800,
        method: 'pix',
      }).summaryLabel,
    ).toBe('Ana Souza • ~8 • R$ 2,50');
    expect(server.listReceivables(owner).upcoming).toHaveLength(0);
  });

  it('lets the owner refund personal credit and blocks staff', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!ana) {
      throw new Error('crédito E2E incompleto');
    }

    server.depositPersonalCredit(owner, {
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    expect(() =>
      server.refundPersonalCredit(staff, {
        studentId: ana.id,
        amountCents: 200,
        reason: 'Devolução pedida',
      }),
    ).toThrow('FORBIDDEN');
    expect(
      server.refundPersonalCredit(owner, {
        studentId: ana.id,
        amountCents: 200,
        reason: 'Devolução pedida',
      }).summaryLabel,
    ).toBe('Ana Souza • ~8 • R$ 0,00');
  });

  it('uses authorized guardian credit on fiado and keeps sibling and other parent separate', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const students = server.listStudents(owner);
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    const maria = server
      .listGuardians(owner)
      .find((item) => item.fullName === 'Maria Souza');
    const paulo = server
      .listGuardians(owner)
      .find((item) => item.fullName === 'Paulo Nunes');
    if (!coxinha || !ana || !bruno || !maria || !paulo) {
      throw new Error('crédito de responsável E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const dueLabel = formatCivilDisplay(shortcuts.tomorrow);

    server.linkGuardian(owner, ana.id, maria.id, {
      isPrimary: true,
      canUseGuardianCredit: true,
    });
    expect(
      server.depositGuardianCredit(owner, {
        guardianId: maria.id,
        amountCents: 200,
        method: 'pix',
      }).summaryLabel,
    ).toBe('Maria Souza • mãe • R$ 2,00');
    expect(
      server.depositGuardianCredit(owner, {
        guardianId: paulo.id,
        amountCents: 200,
        method: 'pix',
      }).summaryLabel,
    ).toBe('Paulo Nunes • pai • R$ 2,00');

    const sale = server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(sale.summaryLabel).toBe(
      `Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • crédito resp. R$ 2,00 • ${dueLabel}`,
    );
    expect(
      server.listCreditAccounts(owner).map((item) => item.summaryLabel),
    ).toEqual(
      expect.arrayContaining([
        'Maria Souza • mãe • R$ 0,00',
        'Paulo Nunes • pai • R$ 2,00',
      ]),
    );

    server.createSale(owner, {
      consumerStudentId: bruno.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(
      server.listCreditAccounts(owner).map((item) => item.summaryLabel),
    ).toContain('Maria Souza • mãe • R$ 0,00');
  });

  it('auto-settles authorized child debt when depositing guardian credit', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    const maria = server
      .listGuardians(owner)
      .find((item) => item.fullName === 'Maria Souza');
    if (!coxinha || !ana || !maria) {
      throw new Error('crédito de responsável E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    server.linkGuardian(owner, ana.id, maria.id, {
      isPrimary: true,
      autoSettle: true,
    });
    expect(
      server.depositGuardianCredit(owner, {
        guardianId: maria.id,
        amountCents: 800,
        method: 'pix',
      }).summaryLabel,
    ).toBe('Maria Souza • mãe • R$ 2,50');
    expect(server.listReceivables(owner).upcoming).toHaveLength(0);
  });

  it('records a family payment as debt plus leftover guardian credit', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const students = server.listStudents(owner);
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    const maria = server
      .listGuardians(owner)
      .find((item) => item.fullName === 'Maria Souza');
    const paulo = server
      .listGuardians(owner)
      .find((item) => item.fullName === 'Paulo Nunes');
    if (!coxinha || !ana || !bruno || !maria || !paulo) {
      throw new Error('pagamento familiar E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const upcomingLabel = formatCivilDisplay(shortcuts.tomorrow);

    server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    server.createSale(owner, {
      consumerStudentId: bruno.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    const upcoming = server.listReceivables(owner).upcoming;
    const anaDebt = upcoming.find((item) =>
      item.summaryLabel.startsWith('Ana Souza • ~8'),
    );
    const brunoDebt = upcoming.find((item) =>
      item.summaryLabel.startsWith('Bruno Lima • 11'),
    );
    if (!anaDebt || !brunoDebt) {
      throw new Error('dívidas familiares E2E ausentes');
    }

    expect(() =>
      server.createFamilyPayment(owner, {
        guardianId: paulo.id,
        studentId: ana.id,
        amountCents: 550,
        method: 'pix',
        mode: 'oldest_first',
      }),
    ).toThrow('PAYMENT_CHILD_NOT_LINKED');
    expect(() =>
      server.createFamilyPayment(owner, {
        guardianId: maria.id,
        studentId: ana.id,
        amountCents: 600,
        method: 'pix',
        mode: 'oldest_first',
      }),
    ).toThrow('PAYMENT_LEFTOVER_UNEXPLAINED');

    const payment = server.createFamilyPayment(owner, {
      guardianId: maria.id,
      amountCents: 200,
      method: 'pix',
      mode: 'credit_remainder',
      allocations: [
        { receivableId: anaDebt.id, amountCents: 20 },
        { receivableId: brunoDebt.id, amountCents: 15 },
      ],
    });
    expect(payment.summaryLabel).toBe(
      `Maria Souza • mãe • R$ 2,00 • PIX • Ana Souza • ~8 R$ 0,20 • Bruno Lima • 11 R$ 0,15 • crédito R$ 1,65`,
    );
    expect(server.listPayments(owner)[0]?.summaryLabel).toBe(
      payment.summaryLabel,
    );
    expect(
      server.listReceivables(owner).upcoming.map((item) => item.summaryLabel),
    ).toEqual(
      expect.arrayContaining([
        `Ana Souza • ~8 • R$ 5,30 • ${upcomingLabel}`,
        `Bruno Lima • 11 • R$ 5,35 • ${upcomingLabel}`,
      ]),
    );
    expect(
      server.listCreditAccounts(owner).map((item) => item.summaryLabel),
    ).toContain('Maria Souza • mãe • R$ 1,65');
  });

  it('lets staff send a family payment entirely to guardian credit', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const maria = server
      .listGuardians(owner)
      .find((item) => item.fullName === 'Maria Souza');
    if (!maria) {
      throw new Error('pagamento familiar E2E incompleto');
    }
    expect(
      server.createFamilyPayment(staff, {
        guardianId: maria.id,
        amountCents: 200,
        method: 'pix',
        mode: 'all_credit',
      }).summaryLabel,
    ).toBe('Maria Souza • mãe • R$ 2,00 • PIX • crédito R$ 2,00');
    expect(
      server.listCreditAccounts(owner).map((item) => item.summaryLabel),
    ).toContain('Maria Souza • mãe • R$ 2,00');
  });

  it('charges a sibling account without using the sibling personal credit', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const students = server.listStudents(owner);
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    if (!coxinha || !ana || !bruno) {
      throw new Error('conta de irmão E2E incompleta');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const upcomingLabel = formatCivilDisplay(shortcuts.tomorrow);

    server.depositPersonalCredit(owner, {
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    const sale = server.createSale(owner, {
      consumerStudentId: bruno.id,
      chargedStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(sale.summaryLabel).toBe(
      `Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • ${upcomingLabel}`,
    );
    expect(
      server.listReceivables(owner).upcoming.map((item) => item.summaryLabel),
    ).toEqual([`Ana Souza • ~8 • R$ 5,50 • ${upcomingLabel}`]);
    expect(
      server.listCreditAccounts(owner).map((item) => item.summaryLabel),
    ).toContain('Ana Souza • ~8 • R$ 2,00');
    expect(() =>
      server.createSale(owner, {
        consumerStudentId: ana.id,
        chargedStudentId: bruno.id,
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'fiado',
        installments: [{ dueDate: shortcuts.tomorrow }],
      }),
    ).toThrow('SALE_ACCOUNT_UNAUTHORIZED');
  });

  it('uses sibling personal credit only when that permission is on', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const students = server.listStudents(owner);
    const ana = students.find(
      (student) =>
        student.fullName === 'Ana Souza' && student.ageLabel === '~8',
    );
    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    if (!coxinha || !ana || !bruno) {
      throw new Error('crédito de irmão E2E incompleto');
    }
    const seeded = server
      .listSiblingAuthorizations(owner, bruno.id)
      .find(
        (item) =>
          item.consumerStudentId === bruno.id &&
          item.accountStudentId === ana.id &&
          item.active,
      );
    if (!seeded) {
      throw new Error('autorização Bruno→Ana E2E ausente');
    }
    server.revokeSiblingAuthorization(owner, seeded.id);
    server.authorizeSibling(owner, {
      consumerStudentId: bruno.id,
      accountStudentId: ana.id,
      canChargeAccount: true,
      canUseAccountCredit: true,
    });
    server.depositPersonalCredit(owner, {
      studentId: ana.id,
      amountCents: 200,
      method: 'pix',
    });
    const shortcuts = server.getDueDateShortcuts(owner);
    const upcomingLabel = formatCivilDisplay(shortcuts.tomorrow);
    expect(
      server.createSale(owner, {
        consumerStudentId: bruno.id,
        chargedStudentId: ana.id,
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'fiado',
        installments: [{ dueDate: shortcuts.tomorrow }],
      }).summaryLabel,
    ).toBe(
      `Bruno Lima • 11 • Coxinha • R$ 5,50 • Fiado • conta Ana Souza • ~8 • crédito R$ 2,00 • ${upcomingLabel}`,
    );
    expect(server.listReceivables(owner).upcoming[0]?.summaryLabel).toBe(
      `Ana Souza • ~8 • R$ 3,50 • ${upcomingLabel}`,
    );
    expect(
      server.listCreditAccounts(owner).map((item) => item.summaryLabel),
    ).toContain('Ana Souza • ~8 • R$ 0,00');
  });

  it('records R$ 8,00 cash with R$ 10,00 tendered as +10/-2 and keeps PIX without a drawer', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const brigadeiro = server
      .listProducts(owner)
      .find((item) => item.name === 'Brigadeiro');
    if (!coxinha || !brigadeiro) {
      throw new Error('caixa E2E incompleto');
    }

    expect(
      server.createSale(owner, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'pix',
      }).summaryLabel,
    ).toBe('Anônima • Coxinha • R$ 5,50');
    expect(server.getCashSetup(owner).openSession).toBeNull();

    expect(() =>
      server.openCashSession(staff, { openingFloatCents: 0 }),
    ).toThrow('FORBIDDEN');
    server.openCashSession(owner, { openingFloatCents: 0 });
    const sale = server.createSale(owner, {
      items: [
        { productId: coxinha.id, quantity: 1 },
        { productId: brigadeiro.id, quantity: 1 },
      ],
      paymentKind: 'cash',
      cashTenderedCents: 1000,
    });
    expect(sale.summaryLabel).toBe(
      'Anônima • Coxinha, Brigadeiro • R$ 8,00 • Dinheiro • Troco R$ 2,00',
    );
    const setup = server.getCashSetup(owner);
    expect(setup.openSession?.expectedCents).toBe(800);
    expect(
      setup.openSession?.movements.map((item) => item.summaryLabel),
    ).toEqual(['troco R$ 2,00', 'entrada R$ 10,00']);
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(8);

    expect(() => server.closeCashSession(staff, { countedCents: 800 })).toThrow(
      'FORBIDDEN',
    );
    const closed = server.closeCashSession(owner, { countedCents: 800 });
    expect(closed.openSession).toBeNull();
    expect(closed.recentSessions[0]).toMatchObject({
      status: 'closed',
      expectedCents: 800,
      countedCents: 800,
      differenceCents: 0,
    });
  });

  it('reverses a PIX sale with stock return and keeps the original sale', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    if (!coxinha) {
      throw new Error('coxinha E2E ausente');
    }
    expect(
      server.createSale(owner, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'pix',
      }).summaryLabel,
    ).toBe('Anônima • Coxinha • R$ 5,50');
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(9);
    const sale = server
      .getReversalsSetup(owner)
      .sales.find((item) => item.status !== 'reversed');
    if (!sale) {
      throw new Error('venda para estorno ausente');
    }
    expect(() =>
      server.reverseSale(staff, {
        saleId: sale.id,
        refundMethod: 'pix',
        confirmDifferentMethod: false,
        returnItemsToStock: true,
        reason: 'Venda lançada em duplicidade',
      }),
    ).toThrow('FORBIDDEN');
    const reversed = server.reverseSale(owner, {
      saleId: sale.id,
      refundMethod: 'pix',
      confirmDifferentMethod: false,
      returnItemsToStock: true,
      reason: 'Venda lançada em duplicidade',
    });
    expect(
      reversed.recentReversals[0]?.effects.map((item) => item.summaryLabel),
    ).toContain('Produto retornado ao estoque: +1');
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(10);
    expect(server.listSales(owner)[0]?.status).toBe('reversed');
  });

  it('creates a recreio reservation that holds availability without changing physical stock', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    expect(() =>
      server.createReservationSlot(staff, {
        label: 'Recreio extra',
        cutoffTime: '23:00',
        pickupStartTime: '23:10',
        pickupEndTime: '23:30',
      }),
    ).toThrow('FORBIDDEN');
    const slots = server.createReservationSlot(owner, {
      label: 'Recreio teste',
      cutoffTime: '23:00',
      pickupStartTime: '23:10',
      pickupEndTime: '23:30',
    });
    const slot = slots.slots.find((item) => item.label === 'Recreio teste');
    const coxinha = server
      .getReservationsSetup(owner)
      .reservableProducts.find((item) => item.name === 'Coxinha');
    if (!slot || !coxinha) {
      throw new Error('recreio ou coxinha ausente');
    }
    const created = server.createReservation(owner, {
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee22',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(created.reservations[0]?.summaryLabel).toBe(
      'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio teste • reservada',
    );
    expect(
      created.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(1);
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(10);
  });

  it('serves the public portal without login and hides private roster data', () => {
    const { server, output } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    expect(server.doGet()).toBe(output);
    const portalPage = server.doGet({
      parameter: { portal: 'reservas' },
    }) as { getContent: () => string };
    expect(portalPage.getContent()).toContain(
      'window.__CANTINA_PUBLIC_PORTAL__=true',
    );
    const portal = server.getPublicReservationPortal();
    expect(portal.slots.length).toBeGreaterThan(0);
    expect(
      portal.products.find((item) => item.name === 'Suco de uva')?.summaryLabel,
    ).toBe('Suco de uva • R$ 4,00 • ACABOU');
    expect(
      portal.products.find((item) => item.name === 'Coxinha')?.soldOut,
    ).toBe(false);
    expect(JSON.stringify(portal)).not.toContain('Ana Souza');
    expect(JSON.stringify(portal)).not.toContain('Maria Souza');
    expect(JSON.stringify(portal)).not.toContain('physicalQuantity');
    expect(JSON.stringify(portal)).not.toContain('reservedQuantity');
    const coxinha = portal.products.find((item) => item.name === 'Coxinha');
    const slot = portal.slots[0];
    if (!coxinha || !slot) {
      throw new Error('portal público incompleto');
    }
    expect(() =>
      server.createReservation('missing-token', {
        requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee24',
        slotId: slot.id,
        studentNameText: 'Ana Souza',
        classroomText: '3º A',
        items: [{ productId: coxinha.id, quantity: 1 }],
      }),
    ).toThrow('UNAUTHENTICATED');
    const created = server.createPublicReservation({
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee24',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      contactOptional: '11999990000',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(created.publicCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(created.publicCodeLabel).toBe(`Código ${created.publicCode}`);
    expect(created.summaryLabel).toContain(
      'Ana Souza • 3º A • Coxinha • R$ 5,50',
    );
    expect(created.summaryLabel).toContain('reservada');
    expect(JSON.stringify(created)).not.toContain('linked_student_id');
    expect(() =>
      server.createPublicReservation({
        requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee25',
        slotId: slot.id,
        studentNameText: 'Ana Souza',
        classroomText: '3º A',
        website: 'https://spam.example',
        items: [{ productId: coxinha.id, quantity: 1 }],
      }),
    ).toThrow('RESERVATION_REJECTED');
  });

  it('lets the owner update, link and fulfill a recreio reservation without changing physical stock', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const slots = server.createReservationSlot(owner, {
      label: 'Recreio teste',
      cutoffTime: '23:00',
      pickupStartTime: '23:10',
      pickupEndTime: '23:30',
    });
    const slot = slots.slots.find((item) => item.label === 'Recreio teste');
    const coxinha = server
      .getReservationsSetup(owner)
      .reservableProducts.find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find((item) => item.fullName === 'Ana Souza' && item.ageLabel === '~8');
    if (!slot || !coxinha || !ana) {
      throw new Error('fila da dona E2E incompleta');
    }
    const created = server.createReservation(owner, {
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee29',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const reservationId = created.reservations[0]?.id;
    if (!reservationId) {
      throw new Error('reserva ausente');
    }
    expect(server.getReservationsSetup(owner).production[0]?.summaryLabel).toBe(
      'Coxinha • 1',
    );
    const updated = server.updateReservation(owner, {
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee30',
      reservationId,
      studentNameText: 'Ana Souza',
      classroomText: '4º B',
      contactOptional: '11999990000',
    });
    expect(updated.reservations[0]?.summaryLabel).toBe(
      'Ana Souza • 4º B • Coxinha • R$ 5,50 • Recreio teste • reservada',
    );
    const replay = server.updateReservation(owner, {
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee30',
      reservationId,
      studentNameText: 'Ana Souza',
      classroomText: '5º C',
    });
    expect(replay.reservations[0]?.classroomText).toBe('4º B');
    const linked = server.linkReservationStudent(staff, {
      reservationId,
      studentId: ana.id,
    });
    expect(linked.reservations[0]?.studentNameText).toBe('Ana Souza');
    expect(linked.reservations[0]?.linkedStudentLabel).toBe(
      'vinculada a Ana Souza • ~8',
    );
    const fulfilled = server.fulfillReservation(staff, { reservationId });
    expect(fulfilled.reservations[0]?.status).toBe('fulfilled');
    expect(fulfilled.reservations[0]?.summaryLabel).toContain('retirada');
    expect(fulfilled.production).toEqual([]);
    expect(
      fulfilled.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(0);
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(10);
  });

  it('converts a recreio reservation into a sale without double-counting stock', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const slots = server.createReservationSlot(owner, {
      label: 'Recreio teste',
      cutoffTime: '23:00',
      pickupStartTime: '23:10',
      pickupEndTime: '23:30',
    });
    const slot = slots.slots.find((item) => item.label === 'Recreio teste');
    const coxinha = server
      .getReservationsSetup(owner)
      .reservableProducts.find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find((item) => item.fullName === 'Ana Souza' && item.ageLabel === '~8');
    if (!slot || !coxinha || !ana) {
      throw new Error('reserva→venda E2E incompleta');
    }
    const created = server.createReservation(owner, {
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee31',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 2 }],
    });
    const reservationId = created.reservations[0]?.id ?? '';
    server.linkReservationStudent(owner, {
      reservationId,
      studentId: ana.id,
    });
    expect(() =>
      server.createSale(owner, {
        sourceReservationId: reservationId,
        items: [{ productId: coxinha.id, quantity: 3 }],
        paymentKind: 'pix',
      }),
    ).toThrow('RESERVATION_PICKUP_EXCEEDS');
    const sale = server.createSale(owner, {
      sourceReservationId: reservationId,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(sale.summaryLabel).toBe('Ana Souza • ~8 • Coxinha • R$ 5,50');
    expect(sale.sourceReservationId).toBe(reservationId);
    const after = server.getReservationsSetup(owner);
    expect(after.reservations[0]?.status).toBe('fulfilled');
    expect(
      after.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(0);
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(9);
  });

  it('lets the owner override a reserved unit in a walk-in sale', () => {
    const { server } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const staff = server.loginE2E('staff').token;
    const slots = server.createReservationSlot(owner, {
      label: 'Recreio teste',
      cutoffTime: '23:00',
      pickupStartTime: '23:10',
      pickupEndTime: '23:30',
    });
    const slot = slots.slots.find((item) => item.label === 'Recreio teste');
    const coxinha = server
      .getReservationsSetup(owner)
      .reservableProducts.find((item) => item.name === 'Coxinha');
    if (!slot || !coxinha) {
      throw new Error('override E2E incompleto');
    }
    const reserved = server.createReservation(owner, {
      requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee32',
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 10 }],
    });
    const reservationId = reserved.reservations[0]?.id ?? '';
    expect(() =>
      server.createSale(owner, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'pix',
      }),
    ).toThrow('RESERVED_OVERRIDE_REQUIRED');
    expect(() =>
      server.createSale(staff, {
        items: [{ productId: coxinha.id, quantity: 1 }],
        paymentKind: 'pix',
        overrideReservationId: reservationId,
      }),
    ).toThrow('RESERVED_OVERRIDE_FORBIDDEN');
    const sale = server.createSale(owner, {
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
      overrideReservationId: reservationId,
    });
    expect(sale.summaryLabel).toBe('Anônima • Coxinha • R$ 5,50');
    expect(server.getReservationsSetup(owner).reservations[0]?.status).toBe(
      'cancelled',
    );
    expect(
      server
        .listInventoryBalances(owner)
        .items.find((item) => item.productName === 'Coxinha')?.physicalQuantity,
    ).toBe(9);
  });

  it('returns sale screen data on createSale and after a catalog cache miss', () => {
    const { server, scriptCache } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const products = server.listProducts(owner);
    const coxinha = products.find((item) => item.name === 'Coxinha');
    if (!coxinha) {
      throw new Error('cardápio E2E incompleto');
    }
    const firstNames = products.map((item) => item.name).sort();
    const sale = server.createSale(owner, {
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(sale.netTotalCents).toBe(550);
    expect(
      sale.screen?.sales.some(
        (item) => item.summaryLabel === sale.summaryLabel,
      ),
    ).toBe(true);
    expect(
      sale.screen?.inventory.items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(9);

    for (const key of [...scriptCache.keys()]) {
      if (key.startsWith('catalog:')) {
        scriptCache.delete(key);
      }
    }
    const afterMiss = server
      .listProducts(owner)
      .map((item) => item.name)
      .sort();
    expect(afterMiss).toEqual(firstNames);

    const second = server.createSale(owner, {
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'pix',
    });
    expect(second.netTotalCents).toBe(550);
    expect(second.summaryLabel).toBe('Anônima • Coxinha • R$ 5,50');
  });

  it('does not let catalog cache change fiado remaining cents', () => {
    const { server, scriptCache } = loadServer({
      ENVIRONMENT: 'E2E',
      SPREADSHEET_ID: 'e2e-sheet-id',
      APP_VERSION: '0.1.0-dev',
    });
    server.seedE2E(ownerToken(server));
    const owner = ownerToken(server);
    const coxinha = server
      .listProducts(owner)
      .find((item) => item.name === 'Coxinha');
    const ana = server
      .listStudents(owner)
      .find(
        (student) =>
          student.fullName === 'Ana Souza' && student.ageLabel === '~8',
      );
    if (!coxinha || !ana) {
      throw new Error('fiado E2E incompleto');
    }
    const shortcuts = server.getDueDateShortcuts(owner);
    const withCache = server.createSale(owner, {
      consumerStudentId: ana.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(withCache.netTotalCents).toBe(550);
    const remainingWithCache = [...server.listReceivables(owner).upcoming].find(
      (item) => item.summaryLabel.includes('R$ 5,50'),
    );
    expect(remainingWithCache).toBeTruthy();

    for (const key of [...scriptCache.keys()]) {
      if (key.startsWith('catalog:')) {
        scriptCache.delete(key);
      }
    }
    const bruno = server
      .listStudents(owner)
      .find((student) => student.fullName === 'Bruno Lima');
    if (!bruno) {
      throw new Error('aluno E2E incompleto');
    }
    const withoutCache = server.createSale(owner, {
      consumerStudentId: bruno.id,
      items: [{ productId: coxinha.id, quantity: 1 }],
      paymentKind: 'fiado',
      installments: [{ dueDate: shortcuts.tomorrow }],
    });
    expect(withoutCache.netTotalCents).toBe(550);
  });
});
