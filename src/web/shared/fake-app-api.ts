import { APP_NAME, APP_VERSION } from '../../app-version';
import { isUserRole, type AuthAction, type UserRole } from '../../domain/auth';
import { authorize } from '../../domain/authorize';
import type { AppError } from '../../domain/result';
import { MemoryCatalog } from '../../server/products/memory-catalog';
import { MemorySales } from '../../server/sales/memory-sales';
import { MemoryStock } from '../../server/inventory/memory-stock';
import { MemoryCash } from '../../server/cash/memory-cash';
import { MemoryReservations } from '../../server/reservations/memory-reservations';
import { MemoryRoster } from '../../server/students/memory-roster';
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
  CreateFamilyPaymentInput,
  CreditAccount,
  DepositPersonalCreditInput,
  DepositGuardianCreditInput,
  RefundPersonalCreditInput,
  RefundGuardianCreditInput,
  AddReceivableInterestInput,
  RenegotiateReceivableInput,
  CashSetup,
  Product,
  ProductCategory,
  ProductFields,
  ProductPriceHistory,
  ReactivateStudentInput,
  ReceivableAgenda,
  Receivable,
  ReversalsSetup,
  ReverseCreditRefundInput,
  ReversePaymentInput,
  ReverseSaleInput,
  Sale,
  SchoolYear,
  SiblingAuthorization,
  StudentDetail,
  StudentGuardianLink,
  StudentProfileFields,
  StudentSummary,
  ReservationsSetup,
  CreateReservationSlotInput,
  CreateReservationInput,
  UpdateReservationInput,
  LinkReservationStudentInput,
  PublicReservationConfirmation,
  PublicReservationPortal,
} from './app-api';

const LOCAL_HEALTH: AppHealth = {
  appName: APP_NAME,
  version: APP_VERSION,
  environment: 'LOCAL',
  status: 'ready',
  adapter: 'fake',
  spreadsheetConfigured: false,
  schemaVersion: 0,
  backupConfigured: false,
  lastBackupAt: null,
};

function throwResult<T>(
  result: { ok: true; data: T } | { ok: false; error: AppError },
): T {
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.data;
}

export class FakeAppApi implements AppApi {
  private session: AppSession | null = null;
  private readonly roster = new MemoryRoster(() => '2026-08-13T16:00:00.000Z');
  private readonly catalog = new MemoryCatalog(
    () => '2026-08-13T16:00:00.000Z',
  );
  private readonly stock = new MemoryStock(
    this.catalog,
    () => '2026-08-13T16:00:00.000Z',
  );
  private readonly cash = new MemoryCash(() => '2026-08-13T16:00:00.000Z');
  private readonly reservations = new MemoryReservations(
    this.catalog,
    this.stock,
    this.roster,
    () => '2026-08-13T16:00:00.000Z',
  );
  private readonly sales = new MemorySales(
    this.catalog,
    this.stock,
    this.roster,
    this.cash,
    () => '2026-08-13T16:00:00.000Z',
  );

  constructor() {
    this.stock.setReservedLookup((productId, businessDate) =>
      this.reservations.reservedQuantity(productId, businessDate),
    );
    this.sales.bindReservations(this.reservations);
  }

  async getHealth(): Promise<AppHealth> {
    return { ...LOCAL_HEALTH };
  }

  async getSession(): Promise<AppSession | null> {
    return this.session ? { ...this.session } : null;
  }

  async loginE2E(role: UserRole): Promise<AppSession> {
    if (!isUserRole(role)) {
      throw new Error('INVALID_ROLE: informe dona ou funcionário.');
    }
    this.session = { role };
    this.roster.ensureDemoRoster();
    this.catalog.ensureDemoCatalog();
    this.stock.ensureDemoStock();
    this.reservations.ensureDemoSlots();
    return { role };
  }

  async logout(): Promise<void> {
    this.session = null;
  }

  async listSchoolYears(): Promise<SchoolYear[]> {
    this.assertSession();
    return throwResult(this.roster.listSchoolYears());
  }

  async createSchoolYear(input: CreateSchoolYearInput): Promise<SchoolYear> {
    this.assertSession();
    return throwResult(this.roster.createSchoolYear(input));
  }

  async listClassrooms(schoolYearId?: string): Promise<Classroom[]> {
    this.assertSession();
    return throwResult(this.roster.listClassrooms(schoolYearId));
  }

  async createClassroom(input: CreateClassroomInput): Promise<Classroom> {
    this.assertSession();
    return throwResult(this.roster.createClassroom(input));
  }

  async updateClassroom(id: string, name: string): Promise<Classroom> {
    this.assertSession();
    return throwResult(this.roster.updateClassroom(id, name));
  }

  async deactivateClassroom(id: string): Promise<Classroom> {
    this.assertSession();
    return throwResult(this.roster.deactivateClassroom(id));
  }

  async listStudents(query?: {
    includeInactive?: boolean;
  }): Promise<StudentSummary[]> {
    this.assertSession();
    return throwResult(this.roster.listStudents(query));
  }

  async getStudent(id: string): Promise<StudentDetail> {
    this.assertSession();
    return throwResult(this.roster.getStudent(id));
  }

  async createStudent(input: CreateStudentInput): Promise<StudentDetail> {
    this.assertSession();
    return throwResult(this.roster.createStudent(input));
  }

  async updateStudent(
    id: string,
    input: StudentProfileFields,
  ): Promise<StudentDetail> {
    this.assertSession();
    return throwResult(this.roster.updateStudent(id, input));
  }

  async deactivateStudent(id: string): Promise<StudentDetail> {
    this.assertSession();
    return throwResult(this.roster.deactivateStudent(id));
  }

  async reactivateStudent(
    id: string,
    input: ReactivateStudentInput,
  ): Promise<StudentDetail> {
    this.assertSession();
    return throwResult(this.roster.reactivateStudent(id, input));
  }

  async enrollStudent(
    id: string,
    input: { classroomId: string; startedOn: string },
  ): Promise<StudentDetail> {
    this.assertAction('students.write');
    return throwResult(this.roster.enrollStudent(id, input));
  }

  async listGuardians(query?: {
    includeInactive?: boolean;
  }): Promise<Guardian[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.listGuardians(query));
  }

  async createGuardian(input: GuardianProfileFields): Promise<Guardian> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.createGuardian(input));
  }

  async updateGuardian(
    id: string,
    input: GuardianProfileFields,
  ): Promise<Guardian> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.updateGuardian(id, input));
  }

  async deactivateGuardian(id: string): Promise<Guardian> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.deactivateGuardian(id));
  }

  async getStudentGuardians(studentId: string): Promise<StudentGuardianLink[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.getStudentGuardians(studentId));
  }

  async linkGuardian(
    studentId: string,
    guardianId: string,
    input?: LinkGuardianInput,
  ): Promise<StudentGuardianLink[]> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.linkGuardian(studentId, guardianId, input));
  }

  async setPrimaryGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[]> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.setPrimaryGuardian(studentId, guardianId));
  }

  async unlinkGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[]> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.unlinkGuardian(studentId, guardianId));
  }

  async listSiblings(studentId: string): Promise<StudentSummary[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.listSiblings(studentId));
  }

  async authorizeSibling(
    input: AuthorizeSiblingInput,
  ): Promise<SiblingAuthorization> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.authorizeSibling(input));
  }

  async revokeSiblingAuthorization(id: string): Promise<SiblingAuthorization> {
    this.assertAction('guardians.write');
    return throwResult(this.roster.revokeSiblingAuthorization(id));
  }

  async listSiblingAuthorizations(
    studentId?: string,
  ): Promise<SiblingAuthorization[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.listSiblingAuthorizations(studentId));
  }

  async getGuardianSettings(): Promise<GuardianSettings> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.getGuardianSettings());
  }

  async setRequireGuardianBelowAge(age: number): Promise<GuardianSettings> {
    this.assertAction('settings.manage');
    return throwResult(this.roster.setRequireGuardianBelowAge(age));
  }

  async listProductCategories(): Promise<ProductCategory[]> {
    this.assertAction('products.read');
    return throwResult(this.catalog.listCategories());
  }

  async createCategory(name: string): Promise<ProductCategory> {
    this.assertAction('products.write');
    return throwResult(this.catalog.createCategory(name));
  }

  async updateCategory(id: string, name: string): Promise<ProductCategory> {
    this.assertAction('products.write');
    return throwResult(this.catalog.updateCategory(id, name));
  }

  async deactivateCategory(id: string): Promise<ProductCategory> {
    this.assertAction('products.write');
    return throwResult(this.catalog.deactivateCategory(id));
  }

  async listProducts(query?: {
    includeInactive?: boolean;
  }): Promise<Product[]> {
    this.assertAction('products.read');
    return throwResult(this.catalog.listProducts(query));
  }

  async createProduct(input: ProductFields): Promise<Product> {
    this.assertAction('products.write');
    return throwResult(this.catalog.createProduct(input));
  }

  async updateProduct(id: string, input: ProductFields): Promise<Product> {
    this.assertAction('products.write');
    return throwResult(this.catalog.updateProduct(id, input));
  }

  async deactivateProduct(id: string): Promise<Product> {
    this.assertAction('products.write');
    return throwResult(this.catalog.deactivateProduct(id));
  }

  async listProductPriceHistory(
    productId: string,
  ): Promise<ProductPriceHistory[]> {
    this.assertAction('products.read');
    return throwResult(this.catalog.listProductPriceHistory(productId));
  }

  async createAdHocItem(input: {
    name: string;
    priceCents: number;
  }): Promise<AdHocItem> {
    this.assertAction('ad_hoc.create');
    return throwResult(this.catalog.createAdHocItem(input));
  }

  async listAdHocItems(): Promise<AdHocItem[]> {
    this.assertAction('ad_hoc.create');
    return throwResult(this.catalog.listAdHocItems());
  }

  async getInventoryDay(businessDate?: string): Promise<InventoryDay | null> {
    this.assertAction('inventory.read');
    return throwResult(this.stock.getDay(businessDate));
  }

  async openInventoryDay(
    input: OpenInventoryDayInput,
  ): Promise<InventoryBalances> {
    this.assertAction('inventory.open');
    return throwResult(this.stock.openDay(input));
  }

  async listInventoryBalances(
    businessDate?: string,
  ): Promise<InventoryBalances> {
    this.assertAction('inventory.read');
    return throwResult(this.stock.listBalances(businessDate));
  }

  async adjustInventory(
    input: AdjustInventoryInput,
  ): Promise<InventoryBalances> {
    this.assertAction('inventory.adjust');
    return throwResult(this.stock.adjust(input));
  }

  async listInventoryMovements(
    businessDate?: string,
  ): Promise<InventoryMovement[]> {
    this.assertAction('inventory.read');
    return throwResult(this.stock.listMovements(businessDate));
  }

  async createSale(input: CreateSaleInput): Promise<Sale> {
    this.assertAction('sales.write');
    return throwResult(
      this.sales.createSale({
        ...input,
        actorIsOwner: this.session?.role === 'owner',
      }),
    );
  }

  async listSales(): Promise<Sale[]> {
    this.assertAction('sales.read');
    return throwResult(this.sales.listSales());
  }

  async getPixCopyText(): Promise<{ text: string }> {
    this.assertAction('sales.read');
    return throwResult(this.sales.getPixCopyText());
  }

  async listReceivables(): Promise<ReceivableAgenda> {
    this.assertAction('receivables.read');
    return throwResult(this.sales.listReceivables());
  }

  async getDueDateShortcuts(): Promise<DueDateShortcuts> {
    this.assertAction('receivables.read');
    return throwResult(this.sales.getDueDateShortcuts());
  }

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    this.assertAction('payments.write');
    return throwResult(this.sales.createPayment(input));
  }

  async createFamilyPayment(input: CreateFamilyPaymentInput): Promise<Payment> {
    this.assertAction('payments.write');
    return throwResult(this.sales.createFamilyPayment(input));
  }

  async listPayments(): Promise<Payment[]> {
    this.assertAction('receivables.read');
    return throwResult(this.sales.listPayments());
  }

  async addReceivableInterest(
    input: AddReceivableInterestInput,
  ): Promise<Receivable> {
    this.assertAction('receivables.adjust');
    return throwResult(this.sales.addReceivableInterest(input));
  }

  async renegotiateReceivable(
    input: RenegotiateReceivableInput,
  ): Promise<Receivable> {
    this.assertAction('receivables.adjust');
    return throwResult(this.sales.renegotiateReceivable(input));
  }

  async listCreditAccounts(): Promise<CreditAccount[]> {
    this.assertAction('credits.read');
    return throwResult(this.sales.listCreditAccounts());
  }

  async depositPersonalCredit(
    input: DepositPersonalCreditInput,
  ): Promise<CreditAccount> {
    this.assertAction('credits.deposit');
    return throwResult(this.sales.depositPersonalCredit(input));
  }

  async refundPersonalCredit(
    input: RefundPersonalCreditInput,
  ): Promise<CreditAccount> {
    this.assertAction('credits.refund');
    return throwResult(this.sales.refundPersonalCredit(input));
  }

  async depositGuardianCredit(
    input: DepositGuardianCreditInput,
  ): Promise<CreditAccount> {
    this.assertAction('credits.deposit');
    return throwResult(this.sales.depositGuardianCredit(input));
  }

  async refundGuardianCredit(
    input: RefundGuardianCreditInput,
  ): Promise<CreditAccount> {
    this.assertAction('credits.refund');
    return throwResult(this.sales.refundGuardianCredit(input));
  }

  async getCashSetup(): Promise<CashSetup> {
    this.assertAction('cash.read');
    return throwResult(this.cash.getSetup());
  }

  async openCashSession(input: {
    openingFloatCents?: number;
  }): Promise<CashSetup> {
    this.assertAction('cash.open');
    return throwResult(this.cash.open(input));
  }

  async addCashForChange(input: {
    amountCents: number;
    note: string;
  }): Promise<CashSetup> {
    this.assertAction('cash.add');
    return throwResult(this.cash.addForChange(input));
  }

  async removeCash(input: {
    amountCents: number;
    note: string;
  }): Promise<CashSetup> {
    this.assertAction('cash.remove');
    return throwResult(this.cash.remove(input));
  }

  async closeCashSession(input: {
    countedCents: number;
    note?: string;
  }): Promise<CashSetup> {
    this.assertAction('cash.close');
    return throwResult(this.cash.close(input));
  }

  async getReversalsSetup(): Promise<ReversalsSetup> {
    this.assertAction('reversals.read');
    return throwResult(this.sales.getReversalsSetup());
  }

  async reverseSale(input: ReverseSaleInput): Promise<ReversalsSetup> {
    this.assertAction('reversals.write');
    return throwResult(this.sales.reverseSale(input));
  }

  async reversePayment(input: ReversePaymentInput): Promise<ReversalsSetup> {
    this.assertAction('reversals.write');
    return throwResult(this.sales.reversePayment(input));
  }

  async reverseCreditRefund(
    input: ReverseCreditRefundInput,
  ): Promise<ReversalsSetup> {
    this.assertAction('reversals.write');
    return throwResult(this.sales.reverseCreditRefund(input));
  }

  async getReservationsSetup(): Promise<ReservationsSetup> {
    this.assertAction('reservations.read');
    return throwResult(this.reservations.getSetup());
  }

  async createReservationSlot(
    input: CreateReservationSlotInput,
  ): Promise<ReservationsSetup> {
    this.assertAction('reservation_slots.write');
    return throwResult(this.reservations.createSlot(input));
  }

  async createReservation(
    input: CreateReservationInput,
  ): Promise<ReservationsSetup> {
    this.assertAction('reservations.write');
    return throwResult(this.reservations.createReservation(input));
  }

  async cancelReservation(input: {
    reservationId: string;
    reason: string;
  }): Promise<ReservationsSetup> {
    this.assertAction('reservations.write');
    return throwResult(this.reservations.cancelReservation(input));
  }

  async markReservationNoShow(input: {
    reservationId: string;
    reason: string;
  }): Promise<ReservationsSetup> {
    this.assertAction('reservations.write');
    return throwResult(this.reservations.markReservationNoShow(input));
  }

  async fulfillReservation(input: {
    reservationId: string;
  }): Promise<ReservationsSetup> {
    this.assertAction('reservations.write');
    return throwResult(this.reservations.fulfillReservation(input));
  }

  async updateReservation(
    input: UpdateReservationInput,
  ): Promise<ReservationsSetup> {
    this.assertAction('reservations.write');
    return throwResult(this.reservations.updateReservation(input));
  }

  async linkReservationStudent(
    input: LinkReservationStudentInput,
  ): Promise<ReservationsSetup> {
    this.assertAction('reservations.write');
    return throwResult(this.reservations.linkStudent(input));
  }

  async getPublicReservationPortal(): Promise<PublicReservationPortal> {
    this.ensurePublicDemo();
    return throwResult(this.reservations.getPublicPortal());
  }

  async createPublicReservation(
    input: CreateReservationInput,
  ): Promise<PublicReservationConfirmation> {
    this.ensurePublicDemo();
    throwResult(
      this.reservations.createReservation({
        ...input,
        linkedStudentId: undefined,
      }),
    );
    return throwResult(this.reservations.toPublicConfirmation(input.requestId));
  }

  private ensurePublicDemo(): void {
    this.catalog.ensureDemoCatalog();
    this.stock.ensureDemoStock();
    this.reservations.ensureDemoSlots();
  }

  private assertSession(): void {
    if (!this.session) {
      throw new Error('UNAUTHENTICATED: Entre para continuar.');
    }
  }

  private assertAction(action: AuthAction): void {
    this.assertSession();
    const allowed = authorize(this.session?.role, action);
    if (!allowed.ok) {
      throw new Error(`${allowed.error.code}: ${allowed.error.message}`);
    }
  }
}
