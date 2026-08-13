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

/**
 * Contrato técnico da Fase 8.
 * Sem responsáveis, produtos, vendas, estoque, fiado, crédito, caixa, reservas ou WhatsApp.
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
}
