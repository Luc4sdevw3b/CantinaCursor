import { APP_NAME, APP_VERSION } from '../../app-version';
import { isUserRole, type UserRole } from '../../domain/auth';
import type { AppError } from '../../domain/result';
import { MemoryRoster } from '../../server/students/memory-roster';
import type {
  AppApi,
  AppHealth,
  AppSession,
  Classroom,
  CreateClassroomInput,
  CreateSchoolYearInput,
  CreateStudentInput,
  ReactivateStudentInput,
  SchoolYear,
  StudentDetail,
  StudentProfileFields,
  StudentSummary,
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
    this.assertSession();
    return throwResult(this.roster.enrollStudent(id, input));
  }

  private assertSession(): void {
    if (!this.session) {
      throw new Error('UNAUTHENTICATED: Entre para continuar.');
    }
  }
}
