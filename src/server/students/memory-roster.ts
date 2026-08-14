import {
  needsGuardian,
  studentAgeLabel,
  studentAgeYears,
} from '../../domain/age';
import { civilDateFromTimestamp, isCivilDate } from '../../domain/civil-date';
import { type EnrollmentRecord, planEnrollment } from '../../domain/enrollment';
import {
  type GuardianLinkRecord,
  latestActiveLinks,
  planGuardianLink,
  planGuardianUnlink,
  primaryGuardianId,
  siblingStudentIds,
} from '../../domain/guardian-link';
import { validateGuardianProfile } from '../../domain/guardian-profile';
import {
  parseRequireGuardianBelowAge,
  REQUIRE_GUARDIAN_BELOW_AGE_KEY,
  requireGuardianBelowAgeOrDefault,
} from '../../domain/guardian-setting';
import { isImmutableId, isSheetRowNumber } from '../../domain/ids';
import { markHomonyms } from '../../domain/person-name';
import { canDeactivate, canReactivate } from '../../domain/reactivate-student';
import { err, ok, type AppError, type Result } from '../../domain/result';
import {
  type SiblingAuthorizationRecord,
  planSiblingAuthorization,
  planSiblingRevocation,
} from '../../domain/sibling-authorization';
import { validateStudentProfile } from '../../domain/student-profile';

const LOCAL_ACTOR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

export interface SchoolYearView {
  id: string;
  label: string;
  startedOn: string;
  endedOn: string | null;
  active: boolean;
}

export interface ClassroomView {
  id: string;
  schoolYearId: string;
  name: string;
  active: boolean;
}

export interface StudentSummaryView {
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

export interface StudentDetailView extends StudentSummaryView {
  birthDate: string | null;
  approximateAge: number | null;
  approximateAgeReferenceYear: number | null;
  enrollments: Array<{
    id: string;
    classroomId: string;
    classroomName: string;
    schoolYearLabel: string;
    startedOn: string;
    endedOn: string | null;
  }>;
}

export interface StudentProfileFields {
  fullName: string;
  birthDate?: string | null;
  approximateAge?: number | null;
  approximateAgeReferenceYear?: number | null;
}

export interface GuardianView {
  id: string;
  fullName: string;
  phone: string;
  whatsappEnabled: boolean;
  relationLabel: string;
  active: boolean;
}

export interface StudentGuardianLinkView {
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

export interface SiblingAuthorizationView {
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

export interface GuardianSettingsView {
  requireGuardianBelowAge: number;
}

export interface GuardianProfileFields {
  fullName: string;
  phone?: string | null;
  whatsappEnabled?: boolean;
  relationLabel?: string | null;
}

interface SchoolYearRecord {
  id: string;
  label: string;
  started_on: string;
  ended_on: string;
  active: string;
  created_at: string;
}

interface ClassroomRecord {
  id: string;
  school_year_id: string;
  name: string;
  active: string;
  created_at: string;
}

interface StudentRecord {
  id: string;
  full_name: string;
  birth_date: string;
  approximate_age: string;
  approximate_age_reference_year: string;
  active: string;
  created_at: string;
  updated_at: string;
}

interface GuardianRecord {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_enabled: string;
  relation_label: string;
  active: string;
  created_at: string;
  updated_at: string;
}

interface SettingRecord {
  key: string;
  value: string;
}

function fail(error: AppError): never {
  throw new Error(`${error.code}: ${error.message}`);
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    fail(result.error);
  }
  return result.data;
}

function latestById<T extends { id: string }>(records: readonly T[]): T[] {
  const latest = new Map<string, T>();
  for (const record of records) {
    latest.set(record.id, record);
  }
  return [...latest.values()];
}

function parseId(id: string): Result<string> {
  if (isSheetRowNumber(id) || !isImmutableId(id)) {
    return err({
      code: 'INVALID_ID',
      message: 'ID deve ser UUID imutável, nunca número da linha.',
      retryable: false,
    });
  }
  return ok(id);
}

export class MemoryRoster {
  private schoolYears: SchoolYearRecord[] = [];
  private classrooms: ClassroomRecord[] = [];
  private students: StudentRecord[] = [];
  private enrollments: EnrollmentRecord[] = [];
  private guardians: GuardianRecord[] = [];
  private guardianLinks: GuardianLinkRecord[] = [];
  private siblingAuthorizations: SiblingAuthorizationRecord[] = [];
  private settings: SettingRecord[] = [
    {
      key: REQUIRE_GUARDIAN_BELOW_AGE_KEY,
      value: '18',
    },
  ];
  private seeded = false;

  constructor(
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  ensureDemoRoster(): void {
    if (this.seeded) {
      return;
    }
    this.seeded = true;
    const year = unwrap(
      this.createSchoolYear({ label: '2026', startedOn: '2026-02-01' }),
    );
    const third = unwrap(
      this.createClassroom({ schoolYearId: year.id, name: '3º A' }),
    );
    const second = unwrap(
      this.createClassroom({ schoolYearId: year.id, name: '2º B' }),
    );
    const anaApprox = unwrap(
      this.createStudent({
        fullName: 'Ana Souza',
        approximateAge: 8,
        approximateAgeReferenceYear: 2026,
        classroomId: third.id,
        startedOn: '2026-02-01',
      }),
    );
    const anaBirth = unwrap(
      this.createStudent({
        fullName: 'Ana Souza',
        birthDate: '2016-03-10',
        classroomId: second.id,
        startedOn: '2026-02-01',
      }),
    );
    const bruno = unwrap(
      this.createStudent({
        fullName: 'Bruno Lima',
        birthDate: '2015-06-01',
        classroomId: third.id,
        startedOn: '2026-02-01',
      }),
    );
    const maria = unwrap(
      this.createGuardian({
        fullName: 'Maria Souza',
        phone: '11999990001',
        whatsappEnabled: true,
        relationLabel: 'mãe',
      }),
    );
    const paulo = unwrap(
      this.createGuardian({
        fullName: 'Paulo Nunes',
        phone: '11999990002',
        whatsappEnabled: false,
        relationLabel: 'pai',
      }),
    );
    unwrap(this.linkGuardian(anaApprox.id, maria.id, { isPrimary: true }));
    unwrap(this.linkGuardian(bruno.id, maria.id, { isPrimary: true }));
    unwrap(this.linkGuardian(anaBirth.id, paulo.id, { isPrimary: true }));
    unwrap(
      this.authorizeSibling({
        consumerStudentId: bruno.id,
        accountStudentId: anaApprox.id,
        canChargeAccount: true,
        canUseAccountCredit: false,
      }),
    );
  }

  listSchoolYears(): Result<SchoolYearView[]> {
    return ok(
      latestById(this.schoolYears).map((year) => ({
        id: year.id,
        label: year.label,
        startedOn: year.started_on,
        endedOn: year.ended_on || null,
        active: year.active === 'true',
      })),
    );
  }

  createSchoolYear(input: {
    label: string;
    startedOn: string;
    endedOn?: string | null;
  }): Result<SchoolYearView> {
    if (!input.label.trim() || !isCivilDate(input.startedOn)) {
      return err({
        code: 'INVALID_SCHOOL_YEAR',
        message: 'Informe o nome do ano letivo e a data de início.',
        retryable: false,
      });
    }
    const record: SchoolYearRecord = {
      id: this.createId(),
      label: input.label.trim(),
      started_on: input.startedOn,
      ended_on:
        input.endedOn && isCivilDate(input.endedOn) ? input.endedOn : '',
      active: 'true',
      created_at: this.nowIso(),
    };
    this.schoolYears.push(record);
    return ok({
      id: record.id,
      label: record.label,
      startedOn: record.started_on,
      endedOn: record.ended_on || null,
      active: true,
    });
  }

  listClassrooms(schoolYearId?: string): Result<ClassroomView[]> {
    return ok(
      latestById(this.classrooms)
        .filter((room) => !schoolYearId || room.school_year_id === schoolYearId)
        .map((room) => ({
          id: room.id,
          schoolYearId: room.school_year_id,
          name: room.name,
          active: room.active === 'true',
        })),
    );
  }

  createClassroom(input: {
    schoolYearId: string;
    name: string;
  }): Result<ClassroomView> {
    const yearId = parseId(input.schoolYearId);
    if (!yearId.ok) {
      return err(yearId.error);
    }
    const year = latestById(this.schoolYears).find(
      (item) => item.id === input.schoolYearId,
    );
    if (!year) {
      return err({
        code: 'SCHOOL_YEAR_NOT_FOUND',
        message: 'Ano letivo não encontrado.',
        retryable: false,
      });
    }
    if (!input.name.trim()) {
      return err({
        code: 'INVALID_CLASSROOM',
        message: 'Informe o nome da turma.',
        retryable: false,
      });
    }
    const record: ClassroomRecord = {
      id: this.createId(),
      school_year_id: input.schoolYearId,
      name: input.name.trim(),
      active: 'true',
      created_at: this.nowIso(),
    };
    this.classrooms.push(record);
    return ok({
      id: record.id,
      schoolYearId: record.school_year_id,
      name: record.name,
      active: true,
    });
  }

  updateClassroom(id: string, name: string): Result<ClassroomView> {
    const current = this.findClassroom(id);
    if (!current.ok) {
      return err(current.error);
    }
    if (!name.trim()) {
      return err({
        code: 'INVALID_CLASSROOM',
        message: 'Informe o nome da turma.',
        retryable: false,
      });
    }
    const record: ClassroomRecord = {
      ...current.data,
      name: name.trim(),
    };
    this.classrooms.push(record);
    return ok({
      id: record.id,
      schoolYearId: record.school_year_id,
      name: record.name,
      active: record.active === 'true',
    });
  }

  deactivateClassroom(id: string): Result<ClassroomView> {
    const current = this.findClassroom(id);
    if (!current.ok) {
      return err(current.error);
    }
    if (current.data.active !== 'true') {
      return err({
        code: 'CLASSROOM_ALREADY_INACTIVE',
        message: 'Esta turma já está inativa.',
        retryable: false,
      });
    }
    if (this.classroomHasActiveStudents(id)) {
      return err({
        code: 'CLASSROOM_HAS_ACTIVE_STUDENTS',
        message:
          'Não é possível excluir a turma enquanto houver alunos ativos nela.',
        retryable: false,
      });
    }
    const record: ClassroomRecord = {
      ...current.data,
      active: 'false',
    };
    this.classrooms.push(record);
    return ok({
      id: record.id,
      schoolYearId: record.school_year_id,
      name: record.name,
      active: false,
    });
  }

  listStudents(query?: {
    includeInactive?: boolean;
  }): Result<StudentSummaryView[]> {
    const includeInactive = query?.includeInactive !== false;
    const summaries = latestById(this.students)
      .filter((student) => includeInactive || student.active === 'true')
      .map((student) => this.toSummary(student));
    return ok(markHomonyms(summaries));
  }

  getStudent(id: string): Result<StudentDetailView> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const student = latestById(this.students).find((item) => item.id === id);
    if (!student) {
      return err({
        code: 'STUDENT_NOT_FOUND',
        message: 'Aluno não encontrado.',
        retryable: false,
      });
    }
    return ok(this.toDetail(student));
  }

  createStudent(
    input: StudentProfileFields & {
      classroomId?: string | null;
      startedOn?: string | null;
    },
  ): Result<StudentDetailView> {
    const profile = validateStudentProfile(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const now = this.nowIso();
    const record: StudentRecord = {
      id: this.createId(),
      ...profile.data,
      active: 'true',
      created_at: now,
      updated_at: now,
    };
    this.students.push(record);
    if (input.classroomId) {
      const enrolled = this.enrollStudent(record.id, {
        classroomId: input.classroomId,
        startedOn: input.startedOn || civilDateFromTimestamp(now),
      });
      if (!enrolled.ok) {
        return enrolled;
      }
    }
    return this.getStudent(record.id);
  }

  updateStudent(
    id: string,
    input: StudentProfileFields & {
      classroomId?: string | null;
      startedOn?: string | null;
    },
  ): Result<StudentDetailView> {
    const current = this.getStudent(id);
    if (!current.ok) {
      return current;
    }
    const profile = validateStudentProfile(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const previous = latestById(this.students).find((item) => item.id === id);
    if (!previous) {
      return err({
        code: 'STUDENT_NOT_FOUND',
        message: 'Aluno não encontrado.',
        retryable: false,
      });
    }
    this.students.push({
      ...previous,
      ...profile.data,
      updated_at: this.nowIso(),
    });
    if (input.classroomId) {
      const enrolled = this.enrollStudent(id, {
        classroomId: input.classroomId,
        startedOn: input.startedOn || civilDateFromTimestamp(this.nowIso()),
      });
      if (!enrolled.ok) {
        return enrolled;
      }
    }
    return this.getStudent(id);
  }

  deactivateStudent(id: string): Result<StudentDetailView> {
    const current = this.getStudent(id);
    if (!current.ok) {
      return current;
    }
    const allowed = canDeactivate(current.data.active);
    if (!allowed.ok) {
      return err(allowed.error);
    }
    return this.appendActive(id, false);
  }

  reactivateStudent(
    id: string,
    input: StudentProfileFields & {
      reviewed: boolean;
      classroomId?: string | null;
      startedOn?: string | null;
    },
  ): Result<StudentDetailView> {
    const current = this.getStudent(id);
    if (!current.ok) {
      return current;
    }
    const allowed = canReactivate(current.data.active, input.reviewed);
    if (!allowed.ok) {
      return err(allowed.error);
    }
    const profile = validateStudentProfile({
      fullName: input.fullName || current.data.fullName,
      birthDate:
        input.birthDate === undefined
          ? current.data.birthDate
          : input.birthDate,
      approximateAge:
        input.approximateAge === undefined
          ? current.data.approximateAge
          : input.approximateAge,
      approximateAgeReferenceYear:
        input.approximateAgeReferenceYear === undefined
          ? current.data.approximateAgeReferenceYear
          : input.approximateAgeReferenceYear,
    });
    if (!profile.ok) {
      return err(profile.error);
    }
    const previous = latestById(this.students).find((item) => item.id === id);
    if (!previous) {
      return err({
        code: 'STUDENT_NOT_FOUND',
        message: 'Aluno não encontrado.',
        retryable: false,
      });
    }
    this.students.push({
      ...previous,
      ...profile.data,
      active: 'true',
      updated_at: this.nowIso(),
    });
    if (input.classroomId) {
      const enrolled = this.enrollStudent(id, {
        classroomId: input.classroomId,
        startedOn: input.startedOn || civilDateFromTimestamp(this.nowIso()),
      });
      if (!enrolled.ok) {
        return enrolled;
      }
    }
    return this.getStudent(id);
  }

  enrollStudent(
    id: string,
    input: { classroomId: string; startedOn: string },
  ): Result<StudentDetailView> {
    const student = this.getStudent(id);
    if (!student.ok) {
      return student;
    }
    if (!student.data.active) {
      return err({
        code: 'STUDENT_INACTIVE',
        message: 'Reative o aluno antes de mudar a turma.',
        retryable: false,
      });
    }
    const classroomId = parseId(input.classroomId);
    if (!classroomId.ok) {
      return err(classroomId.error);
    }
    const classroom = latestById(this.classrooms).find(
      (item) => item.id === input.classroomId,
    );
    if (!classroom) {
      return err({
        code: 'CLASSROOM_NOT_FOUND',
        message: 'Turma não encontrada.',
        retryable: false,
      });
    }
    if (classroom.active !== 'true') {
      return err({
        code: 'CLASSROOM_INACTIVE',
        message: 'Não é possível matricular em turma inativa.',
        retryable: false,
      });
    }
    const planned = planEnrollment({
      studentId: id,
      classroomId: input.classroomId,
      startedOn: input.startedOn,
      createdBy: 'local-user',
      createdAt: this.nowIso(),
      createId: this.createId,
      existing: this.enrollments,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (planned.data.close) {
      this.enrollments.push(planned.data.close);
    }
    if (
      !this.enrollments.some(
        (enrollment) =>
          enrollment.id === planned.data.open.id &&
          enrollment.ended_on === planned.data.open.ended_on,
      )
    ) {
      this.enrollments.push(planned.data.open);
    }
    return this.getStudent(id);
  }

  listGuardians(query?: { includeInactive?: boolean }): Result<GuardianView[]> {
    const includeInactive = query?.includeInactive !== false;
    return ok(
      latestById(this.guardians)
        .filter((guardian) => includeInactive || guardian.active === 'true')
        .map((guardian) => this.toGuardian(guardian)),
    );
  }

  getGuardian(id: string): Result<GuardianView> {
    const found = this.findGuardian(id);
    if (!found.ok) {
      return err(found.error);
    }
    return ok(this.toGuardian(found.data));
  }

  listActiveGuardianLinks(): StudentGuardianLinkView[] {
    return latestActiveLinks(this.guardianLinks).map((link) =>
      this.toLink(link),
    );
  }

  createGuardian(input: GuardianProfileFields): Result<GuardianView> {
    const profile = validateGuardianProfile(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const now = this.nowIso();
    const record: GuardianRecord = {
      id: this.createId(),
      ...profile.data,
      active: 'true',
      created_at: now,
      updated_at: now,
    };
    this.guardians.push(record);
    return ok(this.toGuardian(record));
  }

  updateGuardian(
    id: string,
    input: GuardianProfileFields,
  ): Result<GuardianView> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const previous = latestById(this.guardians).find((item) => item.id === id);
    if (!previous) {
      return err({
        code: 'GUARDIAN_NOT_FOUND',
        message: 'Responsável não encontrado.',
        retryable: false,
      });
    }
    const profile = validateGuardianProfile(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const record: GuardianRecord = {
      ...previous,
      ...profile.data,
      updated_at: this.nowIso(),
    };
    this.guardians.push(record);
    return ok(this.toGuardian(record));
  }

  deactivateGuardian(id: string): Result<GuardianView> {
    const found = this.findGuardian(id);
    if (!found.ok) {
      return err(found.error);
    }
    if (found.data.active !== 'true') {
      return err({
        code: 'GUARDIAN_ALREADY_INACTIVE',
        message: 'Este responsável já está inativo.',
        retryable: false,
      });
    }
    const record: GuardianRecord = {
      ...found.data,
      active: 'false',
      updated_at: this.nowIso(),
    };
    this.guardians.push(record);
    return ok(this.toGuardian(record));
  }

  getStudentGuardians(studentId: string): Result<StudentGuardianLinkView[]> {
    const student = this.getStudent(studentId);
    if (!student.ok) {
      return err(student.error);
    }
    return ok(this.latestLinksForStudent(studentId));
  }

  linkGuardian(
    studentId: string,
    guardianId: string,
    input?: {
      isPrimary?: boolean;
      canUseGuardianCredit?: boolean;
      autoSettle?: boolean;
      note?: string;
    },
  ): Result<StudentGuardianLinkView[]> {
    const student = this.getStudent(studentId);
    if (!student.ok) {
      return err(student.error);
    }
    const guardian = this.findGuardian(guardianId);
    if (!guardian.ok) {
      return err(guardian.error);
    }
    const planned = planGuardianLink({
      studentId,
      guardianId,
      isPrimary: input?.isPrimary === true,
      canUseGuardianCredit: input?.canUseGuardianCredit,
      autoSettle: input?.autoSettle,
      note: input?.note,
      createdAt: this.nowIso(),
      createId: this.createId,
      existing: this.guardianLinks,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (planned.data.demote) {
      this.guardianLinks.push(planned.data.demote);
    }
    this.guardianLinks.push(planned.data.link);
    return this.getStudentGuardians(studentId);
  }

  setPrimaryGuardian(
    studentId: string,
    guardianId: string,
  ): Result<StudentGuardianLinkView[]> {
    return this.linkGuardian(studentId, guardianId, { isPrimary: true });
  }

  unlinkGuardian(
    studentId: string,
    guardianId: string,
  ): Result<StudentGuardianLinkView[]> {
    const planned = planGuardianUnlink({
      studentId,
      guardianId,
      endedAt: this.nowIso(),
      existing: this.guardianLinks,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    this.guardianLinks.push(planned.data);
    return this.getStudentGuardians(studentId);
  }

  listSiblings(studentId: string): Result<StudentSummaryView[]> {
    const student = this.getStudent(studentId);
    if (!student.ok) {
      return err(student.error);
    }
    const siblingIds = siblingStudentIds(this.guardianLinks, studentId);
    const summaries = latestById(this.students)
      .filter((item) => siblingIds.includes(item.id))
      .map((item) => this.toSummary(item));
    return ok(markHomonyms(summaries));
  }

  authorizeSibling(input: {
    consumerStudentId: string;
    accountStudentId: string;
    canChargeAccount?: boolean;
    canUseAccountCredit?: boolean;
    note?: string;
  }): Result<SiblingAuthorizationView> {
    const consumer = this.getStudent(input.consumerStudentId);
    if (!consumer.ok) {
      return err(consumer.error);
    }
    const account = this.getStudent(input.accountStudentId);
    if (!account.ok) {
      return err(account.error);
    }
    const planned = planSiblingAuthorization({
      consumerStudentId: input.consumerStudentId,
      accountStudentId: input.accountStudentId,
      canChargeAccount: input.canChargeAccount === true,
      canUseAccountCredit: input.canUseAccountCredit === true,
      createdBy: LOCAL_ACTOR_ID,
      authorizedAt: this.nowIso(),
      note: input.note,
      createId: this.createId,
      links: this.guardianLinks,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    this.siblingAuthorizations.push(planned.data);
    return ok(this.toAuthorization(planned.data));
  }

  revokeSiblingAuthorization(id: string): Result<SiblingAuthorizationView> {
    const planned = planSiblingRevocation({
      id,
      revokedAt: this.nowIso(),
      existing: this.siblingAuthorizations,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    this.siblingAuthorizations.push(planned.data);
    return ok(this.toAuthorization(planned.data));
  }

  listSiblingAuthorizations(
    studentId?: string,
  ): Result<SiblingAuthorizationView[]> {
    if (studentId) {
      const student = this.getStudent(studentId);
      if (!student.ok) {
        return err(student.error);
      }
    }
    return ok(
      latestById(this.siblingAuthorizations)
        .filter(
          (record) =>
            !studentId ||
            record.consumer_student_id === studentId ||
            record.account_student_id === studentId,
        )
        .map((record) => this.toAuthorization(record)),
    );
  }

  getGuardianSettings(): Result<GuardianSettingsView> {
    return ok({
      requireGuardianBelowAge: this.requireGuardianBelowAge(),
    });
  }

  setRequireGuardianBelowAge(age: number): Result<GuardianSettingsView> {
    const parsed = parseRequireGuardianBelowAge(age);
    if (!parsed.ok) {
      return err(parsed.error);
    }
    this.settings.push({
      key: REQUIRE_GUARDIAN_BELOW_AGE_KEY,
      value: String(parsed.data),
    });
    return this.getGuardianSettings();
  }

  private appendActive(id: string, active: boolean): Result<StudentDetailView> {
    const previous = latestById(this.students).find((item) => item.id === id);
    if (!previous) {
      return err({
        code: 'STUDENT_NOT_FOUND',
        message: 'Aluno não encontrado.',
        retryable: false,
      });
    }
    this.students.push({
      ...previous,
      active: active ? 'true' : 'false',
      updated_at: this.nowIso(),
    });
    return this.getStudent(id);
  }

  private toSummary(student: StudentRecord): StudentSummaryView {
    const age = unwrap(
      studentAgeLabel({
        birthDate: student.birth_date,
        approximateAge: student.approximate_age,
        approximateAgeReferenceYear: student.approximate_age_reference_year,
        todayCivil: civilDateFromTimestamp(this.nowIso()),
      }),
    );
    const enrollment = this.enrollments
      .filter((item) => item.student_id === student.id && item.ended_on === '')
      .at(-1);
    const classroom = enrollment
      ? latestById(this.classrooms).find(
          (item) => item.id === enrollment.classroom_id,
        )
      : undefined;
    const year = classroom
      ? latestById(this.schoolYears).find(
          (item) => item.id === classroom.school_year_id,
        )
      : undefined;
    const primaryId = primaryGuardianId(this.guardianLinks, student.id);
    const primary = primaryId
      ? latestById(this.guardians).find((item) => item.id === primaryId)
      : undefined;
    const ageYears = studentAgeYears({
      birthDate: student.birth_date,
      approximateAge: student.approximate_age,
      approximateAgeReferenceYear: student.approximate_age_reference_year,
      todayCivil: civilDateFromTimestamp(this.nowIso()),
    });
    return {
      id: student.id,
      fullName: student.full_name,
      active: student.active === 'true',
      ageLabel: age,
      classroomName: classroom?.name ?? null,
      schoolYearLabel: year?.label ?? null,
      isHomonym: false,
      primaryGuardianName: primary?.full_name ?? null,
      needsGuardian:
        ageYears.ok &&
        needsGuardian(
          ageYears.data,
          this.requireGuardianBelowAge(),
          Boolean(primaryId),
        ),
    };
  }

  private findClassroom(id: string): Result<ClassroomRecord> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const classroom = latestById(this.classrooms).find(
      (item) => item.id === id,
    );
    if (!classroom) {
      return err({
        code: 'CLASSROOM_NOT_FOUND',
        message: 'Turma não encontrada.',
        retryable: false,
      });
    }
    return ok(classroom);
  }

  private classroomHasActiveStudents(classroomId: string): boolean {
    return latestById(this.students).some((student) => {
      if (student.active !== 'true') {
        return false;
      }
      const enrollment = this.enrollments
        .filter(
          (item) => item.student_id === student.id && item.ended_on === '',
        )
        .at(-1);
      return enrollment?.classroom_id === classroomId;
    });
  }

  private findGuardian(id: string): Result<GuardianRecord> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const guardian = latestById(this.guardians).find((item) => item.id === id);
    if (!guardian) {
      return err({
        code: 'GUARDIAN_NOT_FOUND',
        message: 'Responsável não encontrado.',
        retryable: false,
      });
    }
    return ok(guardian);
  }

  private latestLinksForStudent(studentId: string): StudentGuardianLinkView[] {
    return latestById(this.guardianLinks)
      .filter((link) => link.student_id === studentId)
      .map((link) => this.toLink(link));
  }

  private toGuardian(guardian: GuardianRecord): GuardianView {
    return {
      id: guardian.id,
      fullName: guardian.full_name,
      phone: guardian.phone,
      whatsappEnabled: guardian.whatsapp_enabled === 'true',
      relationLabel: guardian.relation_label,
      active: guardian.active === 'true',
    };
  }

  private toLink(link: GuardianLinkRecord): StudentGuardianLinkView {
    const guardian = latestById(this.guardians).find(
      (item) => item.id === link.guardian_id,
    );
    return {
      id: link.id,
      studentId: link.student_id,
      guardianId: link.guardian_id,
      guardianName: guardian?.full_name ?? '',
      isPrimary: link.is_primary === 'true',
      canUseGuardianCredit: link.can_use_guardian_credit === 'true',
      autoSettleDebtFromGuardianCredit:
        link.auto_settle_debt_from_guardian_credit === 'true',
      active: link.active === 'true',
      startedAt: link.started_at,
      endedAt: link.ended_at || null,
      note: link.note,
    };
  }

  private toAuthorization(
    record: SiblingAuthorizationRecord,
  ): SiblingAuthorizationView {
    const students = latestById(this.students);
    const consumer = students.find(
      (item) => item.id === record.consumer_student_id,
    );
    const account = students.find(
      (item) => item.id === record.account_student_id,
    );
    return {
      id: record.id,
      consumerStudentId: record.consumer_student_id,
      accountStudentId: record.account_student_id,
      consumerName: consumer?.full_name ?? '',
      accountName: account?.full_name ?? '',
      canChargeAccount: record.can_charge_account === 'true',
      canUseAccountCredit: record.can_use_account_credit === 'true',
      active: record.active === 'true',
      authorizedAt: record.authorized_at,
      revokedAt: record.revoked_at || null,
      note: record.note,
    };
  }

  private requireGuardianBelowAge(): number {
    const latest = [...this.settings]
      .reverse()
      .find((item) => item.key === REQUIRE_GUARDIAN_BELOW_AGE_KEY);
    return requireGuardianBelowAgeOrDefault(latest?.value);
  }

  private toDetail(student: StudentRecord): StudentDetailView {
    const summary = this.toSummary(student);
    const classrooms = latestById(this.classrooms);
    const years = latestById(this.schoolYears);
    return {
      ...summary,
      birthDate: student.birth_date || null,
      approximateAge: student.approximate_age
        ? Number(student.approximate_age)
        : null,
      approximateAgeReferenceYear: student.approximate_age_reference_year
        ? Number(student.approximate_age_reference_year)
        : null,
      enrollments: this.enrollments
        .filter((item) => item.student_id === student.id)
        .map((item) => {
          const classroom = classrooms.find(
            (room) => room.id === item.classroom_id,
          );
          const year = classroom
            ? years.find((entry) => entry.id === classroom.school_year_id)
            : undefined;
          return {
            id: item.id,
            classroomId: item.classroom_id,
            classroomName: classroom?.name ?? '',
            schoolYearLabel: year?.label ?? '',
            startedOn: item.started_on,
            endedOn: item.ended_on || null,
          };
        }),
    };
  }
}
