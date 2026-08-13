import { APP_NAME, APP_VERSION } from '../../app-version';
import { isUserRole, type UserRole } from '../../domain/auth';
import { isEnvironment } from '../../domain/environment';
import type {
  AdHocItem,
  AppApi,
  AppHealth,
  AppSession,
  AuthorizeSiblingInput,
  Classroom,
  CreateClassroomInput,
  CreateSchoolYearInput,
  CreateSaleInput,
  CreateStudentInput,
  DueDateShortcuts,
  Guardian,
  GuardianProfileFields,
  GuardianSettings,
  InventoryBalances,
  InventoryDay,
  InventoryMovement,
  LinkGuardianInput,
  OpenInventoryDayInput,
  AdjustInventoryInput,
  Payment,
  CreatePaymentInput,
  CreditAccount,
  DepositPersonalCreditInput,
  DepositGuardianCreditInput,
  RefundPersonalCreditInput,
  RefundGuardianCreditInput,
  AddReceivableInterestInput,
  RenegotiateReceivableInput,
  Product,
  ProductCategory,
  ProductFields,
  ProductPriceHistory,
  ReactivateStudentInput,
  ReceivableAgenda,
  Receivable,
  Sale,
  SchoolYear,
  SiblingAuthorization,
  StudentDetail,
  StudentGuardianLink,
  StudentProfileFields,
  StudentSummary,
} from './app-api';

export const SESSION_TOKEN_STORAGE_KEY = 'cantina.sessionToken';

export interface GoogleScriptRunner {
  withSuccessHandler(handler: (value: unknown) => void): GoogleScriptRunner;
  withFailureHandler(handler: (error: unknown) => void): GoogleScriptRunner;
  getHealth(): void;
  loginE2E(role: string): void;
  logout(token: string): void;
  getSession(token: string): void;
  listSchoolYears(token: string): void;
  createSchoolYear(token: string, payload: unknown): void;
  listClassrooms(token: string, schoolYearId?: string): void;
  createClassroom(token: string, payload: unknown): void;
  listStudents(token: string, query?: unknown): void;
  getStudent(token: string, id: string): void;
  createStudent(token: string, payload: unknown): void;
  updateStudent(token: string, id: string, payload: unknown): void;
  deactivateStudent(token: string, id: string): void;
  reactivateStudent(token: string, id: string, payload: unknown): void;
  enrollStudent(token: string, id: string, payload: unknown): void;
  listGuardians(token: string, query?: unknown): void;
  createGuardian(token: string, payload: unknown): void;
  updateGuardian(token: string, id: string, payload: unknown): void;
  getStudentGuardians(token: string, studentId: string): void;
  linkGuardian(
    token: string,
    studentId: string,
    guardianId: string,
    payload?: unknown,
  ): void;
  setPrimaryGuardian(
    token: string,
    studentId: string,
    guardianId: string,
  ): void;
  unlinkGuardian(token: string, studentId: string, guardianId: string): void;
  listSiblings(token: string, studentId: string): void;
  authorizeSibling(token: string, payload: unknown): void;
  revokeSiblingAuthorization(token: string, id: string): void;
  listSiblingAuthorizations(token: string, studentId?: string): void;
  getGuardianSettings(token: string): void;
  setRequireGuardianBelowAge(token: string, age: number): void;
  listProductCategories(token: string): void;
  listProducts(token: string, query?: unknown): void;
  createProduct(token: string, payload: unknown): void;
  updateProduct(token: string, id: string, payload: unknown): void;
  deactivateProduct(token: string, id: string): void;
  listProductPriceHistory(token: string, productId: string): void;
  createAdHocItem(token: string, payload: unknown): void;
  listAdHocItems(token: string): void;
  getInventoryDay(token: string, businessDate?: string): void;
  openInventoryDay(token: string, payload: unknown): void;
  listInventoryBalances(token: string, businessDate?: string): void;
  adjustInventory(token: string, payload: unknown): void;
  listInventoryMovements(token: string, businessDate?: string): void;
  createSale(token: string, payload: unknown): void;
  listSales(token: string): void;
  getPixCopyText(token: string): void;
  listReceivables(token: string): void;
  getDueDateShortcuts(token: string): void;
  createPayment(token: string, payload: unknown): void;
  listPayments(token: string): void;
  addReceivableInterest(token: string, payload: unknown): void;
  renegotiateReceivable(token: string, payload: unknown): void;
  listCreditAccounts(token: string): void;
  depositPersonalCredit(token: string, payload: unknown): void;
  refundPersonalCredit(token: string, payload: unknown): void;
  depositGuardianCredit(token: string, payload: unknown): void;
  refundGuardianCredit(token: string, payload: unknown): void;
}

export type SessionTokenStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;

function isAppHealth(value: unknown): value is AppHealth {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const health = value as Partial<AppHealth>;
  return (
    typeof health.appName === 'string' &&
    typeof health.version === 'string' &&
    isEnvironment(health.environment) &&
    health.status === 'ready' &&
    health.adapter === 'google-script' &&
    typeof health.spreadsheetConfigured === 'boolean' &&
    typeof health.schemaVersion === 'number' &&
    typeof health.backupConfigured === 'boolean' &&
    (health.lastBackupAt === null || typeof health.lastBackupAt === 'string')
  );
}

function isAppSession(value: unknown): value is AppSession {
  return Boolean(
    value &&
    typeof value === 'object' &&
    isUserRole((value as AppSession).role),
  );
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('Não foi possível consultar o ambiente Apps Script.');
}

function browserSessionStorage(): SessionTokenStorage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export class GoogleScriptAppApi implements AppApi {
  constructor(
    private readonly runner: GoogleScriptRunner,
    private readonly storage: SessionTokenStorage | null = browserSessionStorage(),
  ) {}

  getHealth(): Promise<AppHealth> {
    return this.call(
      (runner) => runner.getHealth(),
      (value) => {
        if (!isAppHealth(value)) {
          throw new Error('Resposta inválida do healthcheck Apps Script.');
        }

        if (value.appName !== APP_NAME || value.version !== APP_VERSION) {
          throw new Error('Healthcheck Apps Script incompatível.');
        }

        return {
          appName: value.appName,
          version: value.version,
          environment: value.environment,
          status: value.status,
          adapter: value.adapter,
          spreadsheetConfigured: value.spreadsheetConfigured,
          schemaVersion: value.schemaVersion,
          backupConfigured: value.backupConfigured,
          lastBackupAt: value.lastBackupAt,
        };
      },
    );
  }

  async getSession(): Promise<AppSession | null> {
    const token = this.readToken();
    if (!token) {
      return null;
    }

    try {
      return await this.call(
        (runner) => runner.getSession(token),
        (value) => {
          if (!isAppSession(value)) {
            throw new Error('Sessão inválida.');
          }
          return { role: value.role };
        },
      );
    } catch {
      this.clearToken();
      return null;
    }
  }

  loginE2E(role: UserRole): Promise<AppSession> {
    return this.call(
      (runner) => runner.loginE2E(role),
      (value) => {
        if (!value || typeof value !== 'object') {
          throw new Error('Login E2E inválido.');
        }
        const payload = value as { token?: unknown; role?: unknown };
        if (typeof payload.token !== 'string' || !isUserRole(payload.role)) {
          throw new Error('Login E2E inválido.');
        }
        this.storage?.setItem(SESSION_TOKEN_STORAGE_KEY, payload.token);
        return { role: payload.role };
      },
    );
  }

  async logout(): Promise<void> {
    const token = this.readToken();
    this.clearToken();
    if (!token) {
      return;
    }

    try {
      await this.call(
        (runner) => runner.logout(token),
        () => undefined,
      );
    } catch {
      return;
    }
  }

  listSchoolYears(): Promise<SchoolYear[]> {
    return this.callWithToken((runner, token) => runner.listSchoolYears(token));
  }

  createSchoolYear(input: CreateSchoolYearInput): Promise<SchoolYear> {
    return this.callWithToken((runner, token) =>
      runner.createSchoolYear(token, input),
    );
  }

  listClassrooms(schoolYearId?: string): Promise<Classroom[]> {
    return this.callWithToken((runner, token) =>
      runner.listClassrooms(token, schoolYearId),
    );
  }

  createClassroom(input: CreateClassroomInput): Promise<Classroom> {
    return this.callWithToken((runner, token) =>
      runner.createClassroom(token, input),
    );
  }

  listStudents(query?: {
    includeInactive?: boolean;
  }): Promise<StudentSummary[]> {
    return this.callWithToken((runner, token) =>
      runner.listStudents(token, query),
    );
  }

  getStudent(id: string): Promise<StudentDetail> {
    return this.callWithToken((runner, token) => runner.getStudent(token, id));
  }

  createStudent(input: CreateStudentInput): Promise<StudentDetail> {
    return this.callWithToken((runner, token) =>
      runner.createStudent(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  updateStudent(
    id: string,
    input: StudentProfileFields,
  ): Promise<StudentDetail> {
    return this.callWithToken((runner, token) =>
      runner.updateStudent(token, id, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  deactivateStudent(id: string): Promise<StudentDetail> {
    return this.callWithToken((runner, token) =>
      runner.deactivateStudent(token, id),
    );
  }

  reactivateStudent(
    id: string,
    input: ReactivateStudentInput,
  ): Promise<StudentDetail> {
    return this.callWithToken((runner, token) =>
      runner.reactivateStudent(token, id, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  enrollStudent(
    id: string,
    input: { classroomId: string; startedOn: string },
  ): Promise<StudentDetail> {
    return this.callWithToken((runner, token) =>
      runner.enrollStudent(token, id, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  listGuardians(query?: { includeInactive?: boolean }): Promise<Guardian[]> {
    return this.callWithToken((runner, token) =>
      runner.listGuardians(token, query),
    );
  }

  createGuardian(input: GuardianProfileFields): Promise<Guardian> {
    return this.callWithToken((runner, token) =>
      runner.createGuardian(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  updateGuardian(id: string, input: GuardianProfileFields): Promise<Guardian> {
    return this.callWithToken((runner, token) =>
      runner.updateGuardian(token, id, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  getStudentGuardians(studentId: string): Promise<StudentGuardianLink[]> {
    return this.callWithToken((runner, token) =>
      runner.getStudentGuardians(token, studentId),
    );
  }

  linkGuardian(
    studentId: string,
    guardianId: string,
    input?: LinkGuardianInput,
  ): Promise<StudentGuardianLink[]> {
    return this.callWithToken((runner, token) =>
      runner.linkGuardian(token, studentId, guardianId, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  setPrimaryGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[]> {
    return this.callWithToken((runner, token) =>
      runner.setPrimaryGuardian(token, studentId, guardianId),
    );
  }

  unlinkGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[]> {
    return this.callWithToken((runner, token) =>
      runner.unlinkGuardian(token, studentId, guardianId),
    );
  }

  listSiblings(studentId: string): Promise<StudentSummary[]> {
    return this.callWithToken((runner, token) =>
      runner.listSiblings(token, studentId),
    );
  }

  authorizeSibling(
    input: AuthorizeSiblingInput,
  ): Promise<SiblingAuthorization> {
    return this.callWithToken((runner, token) =>
      runner.authorizeSibling(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  revokeSiblingAuthorization(id: string): Promise<SiblingAuthorization> {
    return this.callWithToken((runner, token) =>
      runner.revokeSiblingAuthorization(token, id),
    );
  }

  listSiblingAuthorizations(
    studentId?: string,
  ): Promise<SiblingAuthorization[]> {
    return this.callWithToken((runner, token) =>
      runner.listSiblingAuthorizations(token, studentId),
    );
  }

  getGuardianSettings(): Promise<GuardianSettings> {
    return this.callWithToken((runner, token) =>
      runner.getGuardianSettings(token),
    );
  }

  setRequireGuardianBelowAge(age: number): Promise<GuardianSettings> {
    return this.callWithToken((runner, token) =>
      runner.setRequireGuardianBelowAge(token, age),
    );
  }

  listProductCategories(): Promise<ProductCategory[]> {
    return this.callWithToken((runner, token) =>
      runner.listProductCategories(token),
    );
  }

  listProducts(query?: { includeInactive?: boolean }): Promise<Product[]> {
    return this.callWithToken((runner, token) =>
      runner.listProducts(token, query),
    );
  }

  createProduct(input: ProductFields): Promise<Product> {
    return this.callWithToken((runner, token) =>
      runner.createProduct(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  updateProduct(id: string, input: ProductFields): Promise<Product> {
    return this.callWithToken((runner, token) =>
      runner.updateProduct(token, id, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  deactivateProduct(id: string): Promise<Product> {
    return this.callWithToken((runner, token) =>
      runner.deactivateProduct(token, id),
    );
  }

  listProductPriceHistory(productId: string): Promise<ProductPriceHistory[]> {
    return this.callWithToken((runner, token) =>
      runner.listProductPriceHistory(token, productId),
    );
  }

  createAdHocItem(input: {
    name: string;
    priceCents: number;
  }): Promise<AdHocItem> {
    return this.callWithToken((runner, token) =>
      runner.createAdHocItem(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  listAdHocItems(): Promise<AdHocItem[]> {
    return this.callWithToken((runner, token) => runner.listAdHocItems(token));
  }

  getInventoryDay(businessDate?: string): Promise<InventoryDay | null> {
    return this.callWithToken((runner, token) =>
      runner.getInventoryDay(token, businessDate),
    );
  }

  openInventoryDay(input: OpenInventoryDayInput): Promise<InventoryBalances> {
    return this.callWithToken((runner, token) =>
      runner.openInventoryDay(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  listInventoryBalances(businessDate?: string): Promise<InventoryBalances> {
    return this.callWithToken((runner, token) =>
      runner.listInventoryBalances(token, businessDate),
    );
  }

  adjustInventory(input: AdjustInventoryInput): Promise<InventoryBalances> {
    return this.callWithToken((runner, token) =>
      runner.adjustInventory(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  listInventoryMovements(businessDate?: string): Promise<InventoryMovement[]> {
    return this.callWithToken((runner, token) =>
      runner.listInventoryMovements(token, businessDate),
    );
  }

  createSale(input: CreateSaleInput): Promise<Sale> {
    return this.callWithToken((runner, token) =>
      runner.createSale(token, {
        ...input,
        requestId: crypto.randomUUID(),
      }),
    );
  }

  listSales(): Promise<Sale[]> {
    return this.callWithToken((runner, token) => runner.listSales(token));
  }

  getPixCopyText(): Promise<{ text: string }> {
    return this.callWithToken((runner, token) => runner.getPixCopyText(token));
  }

  listReceivables(): Promise<ReceivableAgenda> {
    return this.callWithToken((runner, token) => runner.listReceivables(token));
  }

  getDueDateShortcuts(): Promise<DueDateShortcuts> {
    return this.callWithToken((runner, token) =>
      runner.getDueDateShortcuts(token),
    );
  }

  createPayment(input: CreatePaymentInput): Promise<Payment> {
    return this.callWithToken((runner, token) =>
      runner.createPayment(token, input),
    );
  }

  listPayments(): Promise<Payment[]> {
    return this.callWithToken((runner, token) => runner.listPayments(token));
  }

  addReceivableInterest(
    input: AddReceivableInterestInput,
  ): Promise<Receivable> {
    return this.callWithToken((runner, token) =>
      runner.addReceivableInterest(token, input),
    );
  }

  renegotiateReceivable(
    input: RenegotiateReceivableInput,
  ): Promise<Receivable> {
    return this.callWithToken((runner, token) =>
      runner.renegotiateReceivable(token, input),
    );
  }

  listCreditAccounts(): Promise<CreditAccount[]> {
    return this.callWithToken((runner, token) =>
      runner.listCreditAccounts(token),
    );
  }

  depositPersonalCredit(
    input: DepositPersonalCreditInput,
  ): Promise<CreditAccount> {
    return this.callWithToken((runner, token) =>
      runner.depositPersonalCredit(token, input),
    );
  }

  refundPersonalCredit(
    input: RefundPersonalCreditInput,
  ): Promise<CreditAccount> {
    return this.callWithToken((runner, token) =>
      runner.refundPersonalCredit(token, input),
    );
  }

  depositGuardianCredit(
    input: DepositGuardianCreditInput,
  ): Promise<CreditAccount> {
    return this.callWithToken((runner, token) =>
      runner.depositGuardianCredit(token, input),
    );
  }

  refundGuardianCredit(
    input: RefundGuardianCreditInput,
  ): Promise<CreditAccount> {
    return this.callWithToken((runner, token) =>
      runner.refundGuardianCredit(token, input),
    );
  }

  private callWithToken<T>(
    execute: (runner: GoogleScriptRunner, token: string) => void,
  ): Promise<T> {
    const token = this.readToken();
    if (!token) {
      return Promise.reject(
        new Error('UNAUTHENTICATED: Entre para continuar.'),
      );
    }
    return this.call(
      (runner) => execute(runner, token),
      (value) => value as T,
    );
  }

  private readToken(): string | null {
    return this.storage?.getItem(SESSION_TOKEN_STORAGE_KEY) ?? null;
  }

  private clearToken(): void {
    this.storage?.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }

  private call<T>(
    execute: (runner: GoogleScriptRunner) => void,
    parse: (value: unknown) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const runner = this.runner
        .withSuccessHandler((value) => {
          try {
            resolve(parse(value));
          } catch (error) {
            reject(toError(error));
          }
        })
        .withFailureHandler((error) => reject(toError(error)));
      execute(runner);
    });
  }
}
