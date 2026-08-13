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

/**
 * Contrato técnico da Fase 10.
 * Sem vendas, estoque diário, fiado, crédito como movimento, caixa, reservas ou envio de WhatsApp.
 */
export interface AppApi {
  getHealth(): Promise<AppHealth>;
  getSession(): Promise<AppSession | null>;
  loginE2E(role: UserRole): Promise<AppSession>;
  logout(): Promise<void>;
  listSchoolYears(): Promise<SchoolYear[]>;
  createSchoolYear(input: CreateSchoolYearInput): Promise<SchoolYear>;
  listClassrooms(schoolYearId?: string): Promise<Classroom[]>;
  createClassroom(input: CreateClassroomInput): Promise<Classroom>;
  listStudents(query?: {
    includeInactive?: boolean;
  }): Promise<StudentSummary[]>;
  getStudent(id: string): Promise<StudentDetail>;
  createStudent(input: CreateStudentInput): Promise<StudentDetail>;
  updateStudent(
    id: string,
    input: StudentProfileFields,
  ): Promise<StudentDetail>;
  deactivateStudent(id: string): Promise<StudentDetail>;
  reactivateStudent(
    id: string,
    input: ReactivateStudentInput,
  ): Promise<StudentDetail>;
  enrollStudent(
    id: string,
    input: { classroomId: string; startedOn: string },
  ): Promise<StudentDetail>;
  listGuardians(query?: { includeInactive?: boolean }): Promise<Guardian[]>;
  createGuardian(input: GuardianProfileFields): Promise<Guardian>;
  updateGuardian(id: string, input: GuardianProfileFields): Promise<Guardian>;
  getStudentGuardians(studentId: string): Promise<StudentGuardianLink[]>;
  linkGuardian(
    studentId: string,
    guardianId: string,
    input?: LinkGuardianInput,
  ): Promise<StudentGuardianLink[]>;
  setPrimaryGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[]>;
  unlinkGuardian(
    studentId: string,
    guardianId: string,
  ): Promise<StudentGuardianLink[]>;
  listSiblings(studentId: string): Promise<StudentSummary[]>;
  authorizeSibling(input: AuthorizeSiblingInput): Promise<SiblingAuthorization>;
  revokeSiblingAuthorization(id: string): Promise<SiblingAuthorization>;
  listSiblingAuthorizations(
    studentId?: string,
  ): Promise<SiblingAuthorization[]>;
  getGuardianSettings(): Promise<GuardianSettings>;
  setRequireGuardianBelowAge(age: number): Promise<GuardianSettings>;
  listProductCategories(): Promise<ProductCategory[]>;
  listProducts(query?: { includeInactive?: boolean }): Promise<Product[]>;
  createProduct(input: ProductFields): Promise<Product>;
  updateProduct(id: string, input: ProductFields): Promise<Product>;
  deactivateProduct(id: string): Promise<Product>;
  listProductPriceHistory(productId: string): Promise<ProductPriceHistory[]>;
  createAdHocItem(input: {
    name: string;
    priceCents: number;
  }): Promise<AdHocItem>;
  listAdHocItems(): Promise<AdHocItem[]>;
}
