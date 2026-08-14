import type { Environment } from '../../domain/environment';
import type { UserRole } from '../../domain/auth';

export type { Environment, UserRole };

export type AppApiAdapter = 'fake' | 'google-script';

export interface AppHealth {
  appName: string;
  version: string;
  environment: Environment;
  status: 'ready';
  adapter: AppApiAdapter;
  spreadsheetConfigured: boolean;
  schemaVersion: number;
  backupConfigured: boolean;
  lastBackupAt: string | null;
}

export interface AppSession {
  role: UserRole;
  screen?: SaleScreenData;
  roster?: StudentsScreenData;
}

export interface SchoolYear {
  id: string;
  label: string;
  startedOn: string;
  endedOn: string | null;
  active: boolean;
}

export interface Classroom {
  id: string;
  schoolYearId: string;
  name: string;
  active: boolean;
}

export interface Enrollment {
  id: string;
  classroomId: string;
  classroomName: string;
  schoolYearLabel: string;
  startedOn: string;
  endedOn: string | null;
}

export interface StudentSummary {
  id: string;
  fullName: string;
  active: boolean;
  ageLabel: string;
  classroomName: string | null;
  schoolYearLabel: string | null;
  isHomonym: boolean;
  primaryGuardianName: string | null;
  needsGuardian: boolean;
}

export interface StudentDetail extends StudentSummary {
  birthDate: string | null;
  approximateAge: number | null;
  approximateAgeReferenceYear: number | null;
  enrollments: Enrollment[];
}

export interface StudentProfileFields {
  fullName: string;
  birthDate?: string | null;
  approximateAge?: number | null;
  approximateAgeReferenceYear?: number | null;
}

export interface CreateSchoolYearInput {
  label: string;
  startedOn: string;
  endedOn?: string | null;
}

export interface CreateClassroomInput {
  schoolYearId: string;
  name: string;
}

export interface CreateStudentInput extends StudentProfileFields {
  classroomId?: string | null;
  startedOn?: string | null;
}

export type UpdateStudentInput = StudentProfileFields & {
  classroomId?: string | null;
  startedOn?: string | null;
};

export interface ReactivateStudentInput extends StudentProfileFields {
  reviewed: boolean;
  classroomId?: string | null;
  startedOn?: string | null;
}

export interface Guardian {
  id: string;
  fullName: string;
  phone: string;
  whatsappEnabled: boolean;
  relationLabel: string;
  active: boolean;
}

export interface StudentGuardianLink {
  id: string;
  studentId: string;
  guardianId: string;
  guardianName: string;
  isPrimary: boolean;
  canUseGuardianCredit: boolean;
  autoSettleDebtFromGuardianCredit: boolean;
  active: boolean;
  startedAt: string;
  endedAt: string | null;
  note: string;
}

export interface SiblingAuthorization {
  id: string;
  consumerStudentId: string;
  accountStudentId: string;
  consumerName: string;
  accountName: string;
  canChargeAccount: boolean;
  canUseAccountCredit: boolean;
  active: boolean;
  authorizedAt: string;
  revokedAt: string | null;
  note: string;
}

export interface GuardianSettings {
  requireGuardianBelowAge: number;
}

export interface GuardianProfileFields {
  fullName: string;
  phone?: string | null;
  whatsappEnabled?: boolean;
  relationLabel?: string | null;
}

export interface LinkGuardianInput {
  isPrimary?: boolean;
  canUseGuardianCredit?: boolean;
  autoSettle?: boolean;
  note?: string;
}

export interface AuthorizeSiblingInput {
  consumerStudentId: string;
  accountStudentId: string;
  canChargeAccount?: boolean;
  canUseAccountCredit?: boolean;
  note?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  discountAllowed: boolean;
  stockTracked: boolean;
  reservable: boolean;
  active: boolean;
}

export interface ProductFields {
  name: string;
  categoryId: string;
  priceCents: number;
  discountAllowed?: boolean;
  stockTracked?: boolean;
  reservable?: boolean;
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  priceCents: number;
  priceLabel: string;
  startedAt: string;
  endedAt: string | null;
}

export interface AdHocItem {
  id: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  createdAt: string;
}

export interface InventoryDay {
  id: string;
  businessDate: string;
  status: 'open';
  openedAt: string;
}

export interface InventoryBalanceItem {
  productId: string;
  productName: string;
  openingQuantity: number;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  soldOut: boolean;
  quantityLabel: string;
}

export interface InventoryBalances {
  businessDate: string;
  status: 'open';
  items: InventoryBalanceItem[];
}

export interface OpenInventoryDayInput {
  businessDate: string;
  items: Array<{ productId: string; openingQuantity: number }>;
}

export interface AdjustInventoryInput {
  productId: string;
  quantityDelta: number;
  reason: string;
  businessDate?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  kind: string;
  quantityDelta: number;
  reason: string;
  createdAt: string;
}

export interface CreateSaleInput {
  consumerStudentId?: string | null;
  chargedStudentId?: string | null;
  items: Array<{
    productId?: string | null;
    adHocName?: string | null;
    adHocPriceCents?: number | null;
    quantity: number;
    discountKind?: string | null;
    discountInput?: unknown;
  }>;
  paymentKind: 'pix' | 'cash' | 'mixed' | 'fiado';
  pixAmountCents?: number;
  cashTenderedCents?: number;
  installments?: Array<{ dueDate: string; amountCents?: number }>;
  sourceReservationId?: string | null;
  overrideReservationId?: string | null;
}

export interface SaleSettlement {
  kind: string;
  amountCents: number;
}

export interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountAmountCents: number;
  lineNetCents: number;
}

export interface Sale {
  id: string;
  consumerStudentId: string | null;
  consumerLabel: string;
  status: 'paid' | 'reversed';
  paymentKind: 'pix' | 'cash' | 'mixed' | 'fiado';
  grossTotalCents: number;
  discountTotalCents: number;
  netTotalCents: number;
  netLabel: string;
  cashTenderedCents: number;
  changeCents: number;
  changeLabel: string | null;
  dueDateLabel: string | null;
  settlements: SaleSettlement[];
  items: SaleItem[];
  summaryLabel: string;
  sourceReservationId: string | null;
  createdAt: string;
}

export interface DueDateShortcuts {
  today: string;
  tomorrow: string;
  nextFriday: string;
  plus7: string;
}

export interface Receivable {
  id: string;
  chargedStudentId: string;
  studentLabel: string;
  sourceSaleId: string;
  dueDate: string;
  dueDateLabel: string;
  amountCents: number;
  amountLabel: string;
  remainingCents: number;
  remainingLabel: string;
  status: 'open';
  bucket: 'overdue' | 'today' | 'upcoming';
  summaryLabel: string;
}

export interface ReceivableAgenda {
  overdue: Receivable[];
  today: Receivable[];
  upcoming: Receivable[];
  dueDateHistory: DueDateHistoryEntry[];
}

export interface DueDateHistoryEntry {
  receivableId: string;
  studentLabel: string;
  oldDueDate: string;
  oldDueDateLabel: string;
  newDueDate: string;
  newDueDateLabel: string;
  reason: string;
  summaryLabel: string;
}

export interface AddReceivableInterestInput {
  receivableId: string;
  kind: 'amount' | 'percent';
  amountCents?: number;
  percent?: number;
  reason: string;
}

export interface RenegotiateReceivableInput {
  receivableId: string;
  dueDate: string;
  reason: string;
}

export interface CreatePaymentInput {
  studentId: string;
  amountCents: number;
  method: 'pix' | 'cash';
  mode: 'oldest_first' | 'selected' | 'manual';
  selectedReceivableIds?: string[];
  allocations?: Array<{ receivableId: string; amountCents: number }>;
}

export interface CreateFamilyPaymentInput {
  guardianId: string;
  amountCents: number;
  method: 'pix' | 'cash';
  mode:
    'oldest_first' | 'selected' | 'manual' | 'credit_remainder' | 'all_credit';
  studentId?: string;
  selectedReceivableIds?: string[];
  allocations?: Array<{ receivableId: string; amountCents: number }>;
}

export interface Payment {
  id: string;
  payerStudentId: string;
  studentLabel: string;
  method: 'pix' | 'cash';
  amountCents: number;
  amountLabel: string;
  status: 'completed' | 'reversed';
  summaryLabel: string;
  createdAt: string;
}

export interface CreditAccount {
  id: string;
  ownerType: 'student' | 'guardian';
  studentId: string | null;
  guardianId: string | null;
  ownerLabel: string;
  balanceCents: number;
  balanceLabel: string;
  summaryLabel: string;
}

export interface DepositPersonalCreditInput {
  studentId: string;
  amountCents: number;
  method: 'pix' | 'cash';
}

export interface RefundPersonalCreditInput {
  studentId: string;
  amountCents: number;
  reason: string;
}

export interface DepositGuardianCreditInput {
  guardianId: string;
  amountCents: number;
  method: 'pix' | 'cash';
}

export interface RefundGuardianCreditInput {
  guardianId: string;
  amountCents: number;
  reason: string;
}

export interface CashMovement {
  id: string;
  kind: string;
  amountDeltaCents: number;
  amountLabel: string;
  summaryLabel: string;
  note: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  businessDate: string;
  status: 'open' | 'closed';
  stale: boolean;
  openingFloatCents: number;
  openingFloatLabel: string;
  expectedCents: number;
  expectedLabel: string;
  countedCents: number | null;
  countedLabel: string | null;
  differenceCents: number | null;
  differenceLabel: string | null;
  closeNote: string;
  summaryLabel: string;
  movements: CashMovement[];
}

export interface CashSetup {
  businessDate: string;
  openSession: CashSession | null;
  recentSessions: CashSession[];
}

export interface ReversibleSale {
  id: string;
  displayName: string;
  amountCents: number;
  externalAmountCents: number;
  originalMethods: Array<'pix' | 'cash'>;
  hasTrackedItems: boolean;
  status: 'paid' | 'reversed';
  createdAt: string;
}

export interface ReversiblePayment {
  id: string;
  payerName: string;
  amountCents: number;
  method: 'pix' | 'cash';
  destinationLabel: string;
  status: 'completed' | 'reversed';
  createdAt: string;
}

export interface ReversibleCreditRefund {
  id: string;
  ownerName: string;
  amountCents: number;
  method: 'pix' | 'cash';
  ownerType: 'student' | 'guardian';
  reversed: boolean;
  createdAt: string;
}

export interface ReversalEffect {
  type: string;
  amountDeltaCents: number | null;
  quantityDelta: number | null;
  summaryLabel: string;
}

export interface ReversalRecord {
  id: string;
  operationType: 'sale' | 'payment' | 'credit_refund';
  operationId: string;
  reason: string;
  refundMethod: 'pix' | 'cash' | null;
  differentMethodConfirmed: boolean;
  returnedToStock: boolean | null;
  createdByName: string;
  createdAt: string;
  effects: ReversalEffect[];
}

export interface ReversalsSetup {
  sales: ReversibleSale[];
  payments: ReversiblePayment[];
  creditRefunds: ReversibleCreditRefund[];
  recentReversals: ReversalRecord[];
}

export interface ReverseSaleInput {
  saleId: string;
  refundMethod?: 'pix' | 'cash' | null;
  confirmDifferentMethod: boolean;
  returnItemsToStock: boolean;
  reason: string;
}

export interface ReversePaymentInput {
  paymentId: string;
  refundMethod: 'pix' | 'cash';
  confirmDifferentMethod: boolean;
  reason: string;
}

export interface ReverseCreditRefundInput {
  creditMovementId: string;
  recoveryMethod: 'pix' | 'cash';
  confirmDifferentMethod: boolean;
  reason: string;
}

export interface ReservationSlot {
  id: string;
  businessDate: string;
  label: string;
  cutoffAt: string;
  pickupStartsAt: string;
  pickupEndsAt: string;
  active: boolean;
  openForReservations: boolean;
  summaryLabel: string;
}

export interface ReservationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Reservation {
  id: string;
  publicCode: string;
  publicCodeLabel: string;
  slotId: string;
  slotLabel: string;
  studentNameText: string;
  classroomText: string;
  contactOptional: string;
  linkedStudentId: string | null;
  linkedStudentLabel: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  summaryLabel: string;
  items: ReservationItem[];
  createdAt: string;
}

export interface ReservationProduction {
  productId: string;
  productName: string;
  quantity: number;
  summaryLabel: string;
}

export interface ReservationAvailability {
  productId: string;
  productName: string;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  summaryLabel: string;
}

export interface ReservableProduct {
  id: string;
  name: string;
  priceCents: number;
}

export interface ReservationsSetup {
  slots: ReservationSlot[];
  reservations: Reservation[];
  availability: ReservationAvailability[];
  reservableProducts: ReservableProduct[];
  production: ReservationProduction[];
}

export interface CreateReservationSlotInput {
  label: string;
  businessDate?: string;
  cutoffTime: string;
  pickupStartTime: string;
  pickupEndTime: string;
}

export interface CreateReservationInput {
  requestId: string;
  slotId: string;
  studentNameText: string;
  classroomText: string;
  contactOptional?: string;
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
  website?: string;
  linkedStudentId?: string;
}

export interface UpdateReservationInput {
  requestId: string;
  reservationId: string;
  studentNameText: string;
  classroomText: string;
  contactOptional?: string;
}

export interface LinkReservationStudentInput {
  reservationId: string;
  studentId: string;
}

export interface PublicReservationProduct {
  id: string;
  name: string;
  priceCents: number;
  availableQuantity: number;
  soldOut: boolean;
  summaryLabel: string;
}

export interface PublicReservationPortal {
  slots: Array<{
    id: string;
    label: string;
    summaryLabel: string;
  }>;
  products: PublicReservationProduct[];
}

export interface PublicReservationConfirmation {
  publicCode: string;
  publicCodeLabel: string;
  summaryLabel: string;
}

export interface SaleScreenData {
  products: Product[];
  students: StudentSummary[];
  sales: Sale[];
  pixCopyText: string;
  dueDateShortcuts: DueDateShortcuts;
  siblingAuthorizations: SiblingAuthorization[];
  reservations: ReservationsSetup;
  inventory: InventoryBalances;
  receivables: ReceivableAgenda;
  cash: CashSetup;
}

export interface SaleResult extends Sale {
  screen?: SaleScreenData;
}

export interface StudentsScreenData {
  students: StudentSummary[];
  classrooms: Classroom[];
  guardians: Guardian[];
  siblingAuthorizations: SiblingAuthorization[];
  settings: GuardianSettings;
  links: StudentGuardianLink[];
}

export type FamilyScreenData = StudentsScreenData;

export interface CatalogScreenData {
  categories: ProductCategory[];
  products: Product[];
  adHocItems: AdHocItem[];
}

export interface ProductResult extends Product {
  screen?: CatalogScreenData;
}

export interface CategoryResult extends ProductCategory {
  screen?: CatalogScreenData;
}

export interface AdHocItemResult extends AdHocItem {
  screen?: CatalogScreenData;
}

export interface PaymentsScreenData {
  students: StudentSummary[];
  payments: Payment[];
  guardians: Guardian[];
  links: StudentGuardianLink[];
  receivables: ReceivableAgenda;
}

export interface CreditsScreenData {
  students: StudentSummary[];
  guardians: Guardian[];
  accounts: CreditAccount[];
}

export interface ReservationScreenData {
  setup: ReservationsSetup;
  students: StudentSummary[];
}

export interface StudentResult extends StudentDetail {
  screen?: StudentsScreenData;
}

export interface ClassroomResult extends Classroom {
  screen?: StudentsScreenData;
}

export interface GuardianResult extends Guardian {
  screen?: FamilyScreenData;
}

export interface SiblingAuthorizationResult extends SiblingAuthorization {
  screen?: FamilyScreenData;
}

export interface GuardianSettingsResult extends GuardianSettings {
  screen?: FamilyScreenData;
}

export interface PaymentResult extends Payment {
  screen?: PaymentsScreenData;
}

export interface CreditAccountResult extends CreditAccount {
  screen?: CreditsScreenData;
}

export interface ReceivableResult extends Receivable {
  screen?: ReceivableAgenda;
}

export interface ReservationsSetupResult extends ReservationsSetup {
  screen?: ReservationScreenData;
}

/**
 * Contrato técnico da Fase 26.
 * Portal público não expõe cadastro privado. Sem envio de WhatsApp.
 */
export interface AppApi {
  getHealth(): Promise<AppHealth>;
  getSession(): Promise<AppSession | null>;
  loginE2E(role: UserRole): Promise<AppSession>;
  logout(): Promise<void>;
  listSchoolYears(): Promise<SchoolYear[]>;
  createSchoolYear(input: CreateSchoolYearInput): Promise<SchoolYear>;
  listClassrooms(schoolYearId?: string): Promise<Classroom[]>;
  createClassroom(input: CreateClassroomInput): Promise<ClassroomResult>;
  updateClassroom(id: string, name: string): Promise<ClassroomResult>;
  deactivateClassroom(id: string): Promise<ClassroomResult>;
  listStudents(query?: {
    includeInactive?: boolean;
  }): Promise<StudentSummary[]>;
  getStudent(id: string): Promise<StudentDetail>;
  createStudent(input: CreateStudentInput): Promise<StudentResult>;
  updateStudent(
    id: string,
    input: UpdateStudentInput,
  ): Promise<StudentResult>;
  deactivateStudent(id: string): Promise<StudentResult>;
  reactivateStudent(
    id: string,
    input: ReactivateStudentInput,
  ): Promise<StudentResult>;
  enrollStudent(
    id: string,
    input: { classroomId: string; startedOn: string },
  ): Promise<StudentResult>;
  listGuardians(query?: { includeInactive?: boolean }): Promise<Guardian[]>;
  createGuardian(input: GuardianProfileFields): Promise<GuardianResult>;
  updateGuardian(
    id: string,
    input: GuardianProfileFields,
  ): Promise<GuardianResult>;
  deactivateGuardian(id: string): Promise<GuardianResult>;
  getStudentGuardians(studentId: string): Promise<StudentGuardianLink[]>;
  linkGuardian(
    studentId: string,
    guardianId: string,
    input?: LinkGuardianInput,
  ): Promise<StudentGuardianLink[] & { screen?: FamilyScreenData }>;
  setPrimaryGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[] & { screen?: FamilyScreenData }>;
  unlinkGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[] & { screen?: FamilyScreenData }>;
  listSiblings(studentId: string): Promise<StudentSummary[]>;
  authorizeSibling(
    input: AuthorizeSiblingInput,
  ): Promise<SiblingAuthorizationResult>;
  revokeSiblingAuthorization(id: string): Promise<SiblingAuthorizationResult>;
  listSiblingAuthorizations(
    studentId?: string,
  ): Promise<SiblingAuthorization[]>;
  getGuardianSettings(): Promise<GuardianSettings>;
  setRequireGuardianBelowAge(age: number): Promise<GuardianSettingsResult>;
  listProductCategories(): Promise<ProductCategory[]>;
  createCategory(name: string): Promise<CategoryResult>;
  updateCategory(id: string, name: string): Promise<CategoryResult>;
  deactivateCategory(id: string): Promise<CategoryResult>;
  activateCategory(id: string): Promise<CategoryResult>;
  deleteCategory(id: string): Promise<CategoryResult>;
  listProducts(query?: { includeInactive?: boolean }): Promise<Product[]>;
  createProduct(input: ProductFields): Promise<ProductResult>;
  updateProduct(id: string, input: ProductFields): Promise<ProductResult>;
  deactivateProduct(id: string): Promise<ProductResult>;
  activateProduct(id: string): Promise<ProductResult>;
  deleteProduct(id: string): Promise<ProductResult>;
  listProductPriceHistory(productId: string): Promise<ProductPriceHistory[]>;
  createAdHocItem(input: {
    name: string;
    priceCents: number;
  }): Promise<AdHocItemResult>;
  listAdHocItems(): Promise<AdHocItem[]>;
  getInventoryDay(businessDate?: string): Promise<InventoryDay | null>;
  openInventoryDay(input: OpenInventoryDayInput): Promise<InventoryBalances>;
  listInventoryBalances(businessDate?: string): Promise<InventoryBalances>;
  adjustInventory(input: AdjustInventoryInput): Promise<InventoryBalances>;
  listInventoryMovements(businessDate?: string): Promise<InventoryMovement[]>;
  getSaleScreenData(): Promise<SaleScreenData>;
  getStudentsScreenData(): Promise<StudentsScreenData>;
  getFamilyScreenData(): Promise<FamilyScreenData>;
  getCatalogScreenData(): Promise<CatalogScreenData>;
  getPaymentsScreenData(): Promise<PaymentsScreenData>;
  getCreditsScreenData(): Promise<CreditsScreenData>;
  getReservationScreenData(): Promise<ReservationScreenData>;
  createSale(input: CreateSaleInput): Promise<SaleResult>;
  listSales(): Promise<Sale[]>;
  getPixCopyText(): Promise<{ text: string }>;
  listReceivables(): Promise<ReceivableAgenda>;
  getDueDateShortcuts(): Promise<DueDateShortcuts>;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  createFamilyPayment(input: CreateFamilyPaymentInput): Promise<PaymentResult>;
  listPayments(): Promise<Payment[]>;
  addReceivableInterest(
    input: AddReceivableInterestInput,
  ): Promise<ReceivableResult>;
  renegotiateReceivable(
    input: RenegotiateReceivableInput,
  ): Promise<ReceivableResult>;
  listCreditAccounts(): Promise<CreditAccount[]>;
  depositPersonalCredit(
    input: DepositPersonalCreditInput,
  ): Promise<CreditAccountResult>;
  refundPersonalCredit(
    input: RefundPersonalCreditInput,
  ): Promise<CreditAccountResult>;
  depositGuardianCredit(
    input: DepositGuardianCreditInput,
  ): Promise<CreditAccountResult>;
  refundGuardianCredit(
    input: RefundGuardianCreditInput,
  ): Promise<CreditAccountResult>;
  getCashSetup(): Promise<CashSetup>;
  openCashSession(input: { openingFloatCents?: number }): Promise<CashSetup>;
  addCashForChange(input: {
    amountCents: number;
    note: string;
  }): Promise<CashSetup>;
  removeCash(input: { amountCents: number; note: string }): Promise<CashSetup>;
  closeCashSession(input: {
    countedCents: number;
    note?: string;
  }): Promise<CashSetup>;
  getReversalsSetup(): Promise<ReversalsSetup>;
  reverseSale(input: ReverseSaleInput): Promise<ReversalsSetup>;
  reversePayment(input: ReversePaymentInput): Promise<ReversalsSetup>;
  reverseCreditRefund(input: ReverseCreditRefundInput): Promise<ReversalsSetup>;
  getReservationsSetup(): Promise<ReservationsSetup>;
  createReservationSlot(
    input: CreateReservationSlotInput,
  ): Promise<ReservationsSetupResult>;
  createReservation(
    input: CreateReservationInput,
  ): Promise<ReservationsSetupResult>;
  cancelReservation(input: {
    reservationId: string;
    reason: string;
  }): Promise<ReservationsSetupResult>;
  markReservationNoShow(input: {
    reservationId: string;
    reason: string;
  }): Promise<ReservationsSetupResult>;
  fulfillReservation(input: {
    reservationId: string;
  }): Promise<ReservationsSetupResult>;
  updateReservation(
    input: UpdateReservationInput,
  ): Promise<ReservationsSetupResult>;
  linkReservationStudent(
    input: LinkReservationStudentInput,
  ): Promise<ReservationsSetupResult>;
  getPublicReservationPortal(): Promise<PublicReservationPortal>;
  createPublicReservation(
    input: CreateReservationInput,
  ): Promise<PublicReservationConfirmation>;
}
