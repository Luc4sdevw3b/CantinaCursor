import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/app-version';
import { createAppApi } from '../../src/web/shared/create-app-api';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';
import {
  GoogleScriptAppApi,
  SESSION_TOKEN_STORAGE_KEY,
  type GoogleScriptRunner,
} from '../../src/web/shared/google-script-app-api';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = { ...initial };
  return {
    getItem(key: string) {
      return values[key] ?? null;
    },
    setItem(key: string, value: string) {
      values[key] = value;
    },
    removeItem(key: string) {
      delete values[key];
    },
    values,
  };
}

function runnerWith(
  successValue: unknown,
  extra: Partial<GoogleScriptRunner> = {},
): GoogleScriptRunner {
  const runner: GoogleScriptRunner = {
    withSuccessHandler(handler: (value: unknown) => void) {
      handler(successValue);
      return runner;
    },
    withFailureHandler() {
      return runner;
    },
    getHealth() {},
    loginE2E() {},
    logout() {},
    getSession() {},
    listSchoolYears() {},
    createSchoolYear() {},
    listClassrooms() {},
    createClassroom() {},
    listStudents() {},
    getStudent() {},
    createStudent() {},
    updateStudent() {},
    deactivateStudent() {},
    reactivateStudent() {},
    enrollStudent() {},
    listGuardians() {},
    createGuardian() {},
    updateGuardian() {},
    getStudentGuardians() {},
    linkGuardian() {},
    setPrimaryGuardian() {},
    unlinkGuardian() {},
    listSiblings() {},
    authorizeSibling() {},
    revokeSiblingAuthorization() {},
    listSiblingAuthorizations() {},
    getGuardianSettings() {},
    setRequireGuardianBelowAge() {},
    listProductCategories() {},
    listProducts() {},
    createProduct() {},
    updateProduct() {},
    deactivateProduct() {},
    listProductPriceHistory() {},
    createAdHocItem() {},
    listAdHocItems() {},
    getInventoryDay() {},
    openInventoryDay() {},
    listInventoryBalances() {},
    adjustInventory() {},
    listInventoryMovements() {},
    createSale() {},
    listSales() {},
    getPixCopyText() {},
    listReceivables() {},
    getDueDateShortcuts() {},
    createPayment() {},
    listPayments() {},
    addReceivableInterest() {},
    renegotiateReceivable() {},
    listCreditAccounts() {},
    depositPersonalCredit() {},
    refundPersonalCredit() {},
    ...extra,
  };
  return runner;
}

describe('createAppApi', () => {
  it('uses FakeAppApi in local preview', () => {
    expect(createAppApi(undefined)).toBeInstanceOf(FakeAppApi);
  });

  it('uses GoogleScriptAppApi when google.script.run exists', () => {
    expect(createAppApi({ script: { run: runnerWith(null) } })).toBeInstanceOf(
      GoogleScriptAppApi,
    );
  });
});

describe('GoogleScriptAppApi', () => {
  it('returns typed health from Apps Script without leaking extra fields', async () => {
    const health = await new GoogleScriptAppApi(
      runnerWith({
        appName: APP_NAME,
        version: APP_VERSION,
        environment: 'E2E',
        status: 'ready',
        adapter: 'google-script',
        spreadsheetConfigured: true,
        schemaVersion: 4,
        backupConfigured: true,
        lastBackupAt: '2026-08-13T16:00:00.000Z',
        spreadsheetId: 'should-not-be-required',
      }),
    ).getHealth();
    expect(health.environment).toBe('E2E');
    expect(health.adapter).toBe('google-script');
    expect(health.schemaVersion).toBe(4);
    expect(health.lastBackupAt).toBe('2026-08-13T16:00:00.000Z');
    expect(health).not.toHaveProperty('spreadsheetId');
  });

  it('stores the session token privately and returns only the role', async () => {
    const storage = memoryStorage();
    const session = await new GoogleScriptAppApi(
      runnerWith({
        token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        role: 'owner',
        email: 'should-not-leak@example.test',
      }),
      storage,
    ).loginE2E('owner');

    expect(session).toEqual({ role: 'owner' });
    expect(session).not.toHaveProperty('token');
    expect(session).not.toHaveProperty('email');
    expect(storage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBe(
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    );
  });
});
