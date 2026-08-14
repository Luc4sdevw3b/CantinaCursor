import { APP_NAME, APP_VERSION } from '../../app-version';
import { isUserRole, type AuthAction, type UserRole } from '../../domain/auth';
import { authorize } from '../../domain/authorize';
import type { AppError } from '../../domain/result';
import { PRODUCT_IN_USE_ERROR } from '../../domain/product-category';
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
  ReversalsSetup,
  ReverseCreditRefundInput,
  ReversePaymentInput,
  ReverseSaleInput,
  Sale,
  SchoolYear,
  SiblingAuthorization,
  StudentDetail,
  StudentGuardianLink,
  StudentSummary,
  UpdateStudentInput,
  ReservationsSetup,
  CreateReservationSlotInput,
  CreateReservationInput,
  UpdateReservationInput,
  LinkReservationStudentInput,
  PublicReservationConfirmation,
  PublicReservationPortal,
  SaleResult,
  SaleScreenData,
  StudentsScreenData,
  FamilyScreenData,
  CatalogScreenData,
  PaymentsScreenData,
  CreditsScreenData,
  ReservationScreenData,
  ProductResult,
  CategoryResult,
  AdHocItemResult,
  StudentResult,
  ClassroomResult,
  GuardianResult,
  SiblingAuthorizationResult,
  GuardianSettingsResult,
  PaymentResult,
  CreditAccountResult,
  ReceivableResult,
  ReservationsSetupResult,
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
    return {
      role,
      screen: this.saleScreenUnlocked(),
      roster: this.rosterScreenUnlocked(),
    };
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

  async createClassroom(input: CreateClassroomInput): Promise<ClassroomResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.createClassroom(input)),
    );
  }

  async updateClassroom(id: string, name: string): Promise<ClassroomResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.updateClassroom(id, name)),
    );
  }

  async deactivateClassroom(id: string): Promise<ClassroomResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.deactivateClassroom(id)),
    );
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

  async createStudent(input: CreateStudentInput): Promise<StudentResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.createStudent(input)),
    );
  }

  async updateStudent(
    id: string,
    input: UpdateStudentInput,
  ): Promise<StudentResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.updateStudent(id, input)),
    );
  }

  async deactivateStudent(id: string): Promise<StudentResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.deactivateStudent(id)),
    );
  }

  async reactivateStudent(
    id: string,
    input: ReactivateStudentInput,
  ): Promise<StudentResult> {
    this.assertSession();
    return this.withStudentsScreen(
      throwResult(this.roster.reactivateStudent(id, input)),
    );
  }

  async enrollStudent(
    id: string,
    input: { classroomId: string; startedOn: string },
  ): Promise<StudentResult> {
    this.assertAction('students.write');
    return this.withStudentsScreen(
      throwResult(this.roster.enrollStudent(id, input)),
    );
  }

  async listGuardians(query?: {
    includeInactive?: boolean;
  }): Promise<Guardian[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.listGuardians(query));
  }

  async createGuardian(input: GuardianProfileFields): Promise<GuardianResult> {
    this.assertAction('guardians.write');
    return this.withFamilyScreen(
      throwResult(this.roster.createGuardian(input)),
    );
  }

  async updateGuardian(
    id: string,
    input: GuardianProfileFields,
  ): Promise<GuardianResult> {
    this.assertAction('guardians.write');
    return this.withFamilyScreen(
      throwResult(this.roster.updateGuardian(id, input)),
    );
  }

  async deactivateGuardian(id: string): Promise<GuardianResult> {
    this.assertAction('guardians.write');
    return this.withFamilyScreen(
      throwResult(this.roster.deactivateGuardian(id)),
    );
  }

  async getStudentGuardians(studentId: string): Promise<StudentGuardianLink[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.getStudentGuardians(studentId));
  }

  async linkGuardian(
    studentId: string,
    guardianId: string,
    input?: LinkGuardianInput,
  ): Promise<StudentGuardianLink[] & { screen?: FamilyScreenData }> {
    this.assertAction('guardians.write');
    return this.withFamilyLinksScreen(
      throwResult(this.roster.linkGuardian(studentId, guardianId, input)),
    );
  }

  async setPrimaryGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[] & { screen?: FamilyScreenData }> {
    this.assertAction('guardians.write');
    return this.withFamilyLinksScreen(
      throwResult(this.roster.setPrimaryGuardian(studentId, guardianId)),
    );
  }

  async unlinkGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[] & { screen?: FamilyScreenData }> {
    this.assertAction('guardians.write');
    return this.withFamilyLinksScreen(
      throwResult(this.roster.unlinkGuardian(studentId, guardianId)),
    );
  }

  async listSiblings(studentId: string): Promise<StudentSummary[]> {
    this.assertAction('guardians.read');
    return throwResult(this.roster.listSiblings(studentId));
  }

  async authorizeSibling(
    input: AuthorizeSiblingInput,
  ): Promise<SiblingAuthorizationResult> {
    this.assertAction('guardians.write');
    return this.withFamilyScreen(
      throwResult(this.roster.authorizeSibling(input)),
    );
  }

  async revokeSiblingAuthorization(
    id: string,
  ): Promise<SiblingAuthorizationResult> {
    this.assertAction('guardians.write');
    return this.withFamilyScreen(
      throwResult(this.roster.revokeSiblingAuthorization(id)),
    );
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

  async setRequireGuardianBelowAge(
    age: number,
  ): Promise<GuardianSettingsResult> {
    this.assertAction('settings.manage');
    return this.withFamilyScreen(
      throwResult(this.roster.setRequireGuardianBelowAge(age)),
    );
  }

  async listProductCategories(): Promise<ProductCategory[]> {
    this.assertAction('products.read');
    return throwResult(this.catalog.listCategories());
  }

  async createCategory(name: string): Promise<CategoryResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.createCategory(name)),
    );
  }

  async updateCategory(id: string, name: string): Promise<CategoryResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.updateCategory(id, name)),
    );
  }

  async deactivateCategory(id: string): Promise<CategoryResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.deactivateCategory(id)),
    );
  }

  async activateCategory(id: string): Promise<CategoryResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.activateCategory(id)),
    );
  }

  async deleteCategory(id: string): Promise<CategoryResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(throwResult(this.catalog.deleteCategory(id)));
  }

  async listProducts(query?: {
    includeInactive?: boolean;
  }): Promise<Product[]> {
    this.assertAction('products.read');
    return throwResult(this.catalog.listProducts(query));
  }

  async createProduct(input: ProductFields): Promise<ProductResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.createProduct(input)),
    );
  }

  async updateProduct(
    id: string,
    input: ProductFields,
  ): Promise<ProductResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.updateProduct(id, input)),
    );
  }

  async deactivateProduct(id: string): Promise<ProductResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.deactivateProduct(id)),
    );
  }

  async activateProduct(id: string): Promise<ProductResult> {
    this.assertAction('products.write');
    return this.withCatalogScreen(
      throwResult(this.catalog.activateProduct(id)),
    );
  }

  async deleteProduct(id: string): Promise<ProductResult> {
    this.assertAction('products.write');
    if (
      this.sales.productIsReferenced(id) ||
      this.stock.productIsReferenced(id) ||
      this.reservations.productIsReferenced(id)
    ) {
      throw new Error(
        `${PRODUCT_IN_USE_ERROR.code}: ${PRODUCT_IN_USE_ERROR.message}`,
      );
    }
    return this.withCatalogScreen(throwResult(this.catalog.deleteProduct(id)));
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
  }): Promise<AdHocItemResult> {
    this.assertAction('ad_hoc.create');
    return this.withCatalogScreen(
      throwResult(this.catalog.createAdHocItem(input)),
    );
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

  async createSale(input: CreateSaleInput): Promise<SaleResult> {
    this.assertAction('sales.write');
    const sale = throwResult(
      this.sales.createSale({
        ...input,
        actorIsOwner: this.session?.role === 'owner',
      }),
    );
    return { ...sale, screen: this.saleScreenUnlocked() };
  }

  async getSaleScreenData(): Promise<SaleScreenData> {
    this.assertAction('sales.read');
    return this.saleScreenUnlocked();
  }

  async getStudentsScreenData(): Promise<StudentsScreenData> {
    this.assertAction('students.read');
    return this.studentsScreenUnlocked();
  }

  async getFamilyScreenData(): Promise<FamilyScreenData> {
    this.assertAction('guardians.read');
    return this.familyScreenUnlocked();
  }

  async getCatalogScreenData(): Promise<CatalogScreenData> {
    this.assertAction('products.read');
    return this.catalogScreenUnlocked();
  }

  async getPaymentsScreenData(): Promise<PaymentsScreenData> {
    this.assertAction('receivables.read');
    return this.paymentsScreenUnlocked();
  }

  async getCreditsScreenData(): Promise<CreditsScreenData> {
    this.assertAction('credits.read');
    return this.creditsScreenUnlocked();
  }

  async getReservationScreenData(): Promise<ReservationScreenData> {
    this.assertAction('reservations.read');
    return {
      setup: throwResult(this.reservations.getSetup()),
      students: throwResult(this.roster.listStudents()),
    };
  }

  private saleScreenUnlocked(): SaleScreenData {
    return {
      products: throwResult(this.catalog.listProducts()),
      students: throwResult(this.roster.listStudents()),
      sales: throwResult(this.sales.listSales()),
      pixCopyText: throwResult(this.sales.getPixCopyText()).text,
      dueDateShortcuts: throwResult(this.sales.getDueDateShortcuts()),
      siblingAuthorizations: throwResult(
        this.roster.listSiblingAuthorizations(),
      ),
      reservations: throwResult(this.reservations.getSetup()),
      inventory: throwResult(this.stock.listBalances()),
      receivables: throwResult(this.sales.listReceivables()),
      cash: throwResult(this.cash.getSetup()),
    };
  }

  private catalogScreenUnlocked(): CatalogScreenData {
    return {
      categories: throwResult(this.catalog.listCategories()),
      products: throwResult(
        this.catalog.listProducts({ includeInactive: true }),
      ),
      adHocItems:
        this.session?.role === 'owner'
          ? throwResult(this.catalog.listAdHocItems())
          : [],
    };
  }

  private withCatalogScreen<T extends object>(
    value: T,
  ): T & { screen: CatalogScreenData } {
    return { ...value, screen: this.catalogScreenUnlocked() };
  }

  private rosterScreenUnlocked(): StudentsScreenData {
    const students = throwResult(
      this.roster.listStudents({ includeInactive: true }),
    );
    const links: StudentGuardianLink[] = [];
    for (const student of students) {
      links.push(...throwResult(this.roster.getStudentGuardians(student.id)));
    }
    return {
      students,
      classrooms: throwResult(this.roster.listClassrooms()),
      guardians: throwResult(
        this.roster.listGuardians({ includeInactive: true }),
      ),
      siblingAuthorizations: throwResult(
        this.roster.listSiblingAuthorizations(),
      ),
      settings: throwResult(this.roster.getGuardianSettings()),
      links,
    };
  }

  private studentsScreenUnlocked(): StudentsScreenData {
    return this.rosterScreenUnlocked();
  }

  private withStudentsScreen<T extends object>(
    value: T,
  ): T & { screen: StudentsScreenData } {
    return { ...value, screen: this.studentsScreenUnlocked() };
  }

  private familyScreenUnlocked(): FamilyScreenData {
    return this.rosterScreenUnlocked();
  }

  private withFamilyScreen<T extends object>(
    value: T,
  ): T & { screen: FamilyScreenData } {
    return { ...value, screen: this.familyScreenUnlocked() };
  }

  private withFamilyLinksScreen(
    links: StudentGuardianLink[],
  ): StudentGuardianLink[] & { screen: FamilyScreenData } {
    return Object.assign(links.slice(), {
      screen: this.familyScreenUnlocked(),
    });
  }

  private paymentsScreenUnlocked(): PaymentsScreenData {
    const roster = this.rosterScreenUnlocked();
    return {
      students: roster.students,
      payments: throwResult(this.sales.listPayments()),
      guardians: roster.guardians,
      links: roster.links,
      receivables: throwResult(this.sales.listReceivables()),
    };
  }

  private withPaymentsScreen<T extends object>(
    value: T,
  ): T & { screen: PaymentsScreenData } {
    return { ...value, screen: this.paymentsScreenUnlocked() };
  }

  private creditsScreenUnlocked(): CreditsScreenData {
    const roster = this.rosterScreenUnlocked();
    return {
      students: roster.students,
      guardians: roster.guardians,
      accounts: throwResult(this.sales.listCreditAccounts()),
    };
  }

  private withCreditsScreen<T extends object>(
    value: T,
  ): T & { screen: CreditsScreenData } {
    return { ...value, screen: this.creditsScreenUnlocked() };
  }

  private withAgendaScreen<T extends object>(
    value: T,
  ): T & { screen: ReceivableAgenda } {
    return { ...value, screen: throwResult(this.sales.listReceivables()) };
  }

  private withReservationScreen(
    setup: ReservationsSetup,
  ): ReservationsSetupResult {
    return {
      ...setup,
      screen: {
        setup,
        students: throwResult(this.roster.listStudents()),
      },
    };
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

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.assertAction('payments.write');
    return this.withPaymentsScreen(
      throwResult(this.sales.createPayment(input)),
    );
  }

  async createFamilyPayment(
    input: CreateFamilyPaymentInput,
  ): Promise<PaymentResult> {
    this.assertAction('payments.write');
    return this.withPaymentsScreen(
      throwResult(this.sales.createFamilyPayment(input)),
    );
  }

  async listPayments(): Promise<Payment[]> {
    this.assertAction('receivables.read');
    return throwResult(this.sales.listPayments());
  }

  async addReceivableInterest(
    input: AddReceivableInterestInput,
  ): Promise<ReceivableResult> {
    this.assertAction('receivables.adjust');
    return this.withAgendaScreen(
      throwResult(this.sales.addReceivableInterest(input)),
    );
  }

  async renegotiateReceivable(
    input: RenegotiateReceivableInput,
  ): Promise<ReceivableResult> {
    this.assertAction('receivables.adjust');
    return this.withAgendaScreen(
      throwResult(this.sales.renegotiateReceivable(input)),
    );
  }

  async listCreditAccounts(): Promise<CreditAccount[]> {
    this.assertAction('credits.read');
    return throwResult(this.sales.listCreditAccounts());
  }

  async depositPersonalCredit(
    input: DepositPersonalCreditInput,
  ): Promise<CreditAccountResult> {
    this.assertAction('credits.deposit');
    return this.withCreditsScreen(
      throwResult(this.sales.depositPersonalCredit(input)),
    );
  }

  async refundPersonalCredit(
    input: RefundPersonalCreditInput,
  ): Promise<CreditAccountResult> {
    this.assertAction('credits.refund');
    return this.withCreditsScreen(
      throwResult(this.sales.refundPersonalCredit(input)),
    );
  }

  async depositGuardianCredit(
    input: DepositGuardianCreditInput,
  ): Promise<CreditAccountResult> {
    this.assertAction('credits.deposit');
    return this.withCreditsScreen(
      throwResult(this.sales.depositGuardianCredit(input)),
    );
  }

  async refundGuardianCredit(
    input: RefundGuardianCreditInput,
  ): Promise<CreditAccountResult> {
    this.assertAction('credits.refund');
    return this.withCreditsScreen(
      throwResult(this.sales.refundGuardianCredit(input)),
    );
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
  ): Promise<ReservationsSetupResult> {
    this.assertAction('reservation_slots.write');
    return this.withReservationScreen(
      throwResult(this.reservations.createSlot(input)),
    );
  }

  async createReservation(
    input: CreateReservationInput,
  ): Promise<ReservationsSetupResult> {
    this.assertAction('reservations.write');
    return this.withReservationScreen(
      throwResult(this.reservations.createReservation(input)),
    );
  }

  async cancelReservation(input: {
    reservationId: string;
    reason: string;
  }): Promise<ReservationsSetupResult> {
    this.assertAction('reservations.write');
    return this.withReservationScreen(
      throwResult(this.reservations.cancelReservation(input)),
    );
  }

  async markReservationNoShow(input: {
    reservationId: string;
    reason: string;
  }): Promise<ReservationsSetupResult> {
    this.assertAction('reservations.write');
    return this.withReservationScreen(
      throwResult(this.reservations.markReservationNoShow(input)),
    );
  }

  async fulfillReservation(input: {
    reservationId: string;
  }): Promise<ReservationsSetupResult> {
    this.assertAction('reservations.write');
    return this.withReservationScreen(
      throwResult(this.reservations.fulfillReservation(input)),
    );
  }

  async updateReservation(
    input: UpdateReservationInput,
  ): Promise<ReservationsSetupResult> {
    this.assertAction('reservations.write');
    return this.withReservationScreen(
      throwResult(this.reservations.updateReservation(input)),
    );
  }

  async linkReservationStudent(
    input: LinkReservationStudentInput,
  ): Promise<ReservationsSetupResult> {
    this.assertAction('reservations.write');
    return this.withReservationScreen(
      throwResult(this.reservations.linkStudent(input)),
    );
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
