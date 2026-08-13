import { studentAgeLabel } from '../../domain/age';
import { civilDateFromTimestamp, isCivilDate } from '../../domain/civil-date';
import { type EnrollmentRecord, planEnrollment } from '../../domain/enrollment';
import { isImmutableId, isSheetRowNumber } from '../../domain/ids';
import { markHomonyms } from '../../domain/person-name';
import { canDeactivate, canReactivate } from '../../domain/reactivate-student';
import { err, ok, type AppError, type Result } from '../../domain/result';
import { validateStudentProfile } from '../../domain/student-profile';

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
    unwrap(
      this.createStudent({
        fullName: 'Ana Souza',
        approximateAge: 8,
        approximateAgeReferenceYear: 2026,
        classroomId: third.id,
        startedOn: '2026-02-01',
      }),
    );
    unwrap(
      this.createStudent({
        fullName: 'Ana Souza',
        birthDate: '2016-03-10',
        classroomId: second.id,
        startedOn: '2026-02-01',
      }),
    );
    unwrap(
      this.createStudent({
        fullName: 'Bruno Lima',
        birthDate: '2015-06-01',
        classroomId: third.id,
        startedOn: '2026-02-01',
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
    input: StudentProfileFields,
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
    return {
      id: student.id,
      fullName: student.full_name,
      active: student.active === 'true',
      ageLabel: age,
      classroomName: classroom?.name ?? null,
      schoolYearLabel: year?.label ?? null,
      isHomonym: false,
    };
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
