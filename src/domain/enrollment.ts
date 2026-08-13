import { isCivilDate } from './civil-date';
import { isImmutableId, isSheetRowNumber } from './ids';
import { err, ok, type Result } from './result';

export interface EnrollmentRecord {
  id: string;
  student_id: string;
  classroom_id: string;
  started_on: string;
  ended_on: string;
  created_by: string;
  created_at: string;
}

export const INVALID_ENROLLMENT_DATE_ERROR = {
  code: 'INVALID_ENROLLMENT_DATE',
  message: 'A matrícula precisa de uma data civil de início.',
  retryable: false,
} as const;

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

export function currentEnrollment(
  records: readonly EnrollmentRecord[],
  studentId: string,
): EnrollmentRecord | null {
  const open = records.filter(
    (record) => record.student_id === studentId && record.ended_on === '',
  );
  return open.at(-1) ?? null;
}

export function planEnrollment(input: {
  studentId: string;
  classroomId: string;
  startedOn: string;
  createdBy: string;
  createdAt: string;
  createId: () => string;
  existing: readonly EnrollmentRecord[];
}): Result<{
  close: EnrollmentRecord | null;
  open: EnrollmentRecord;
}> {
  if (
    isSheetRowNumber(input.studentId) ||
    !isImmutableId(input.studentId) ||
    isSheetRowNumber(input.classroomId) ||
    !isImmutableId(input.classroomId)
  ) {
    return err(INVALID_ID_ERROR);
  }
  if (!isCivilDate(input.startedOn)) {
    return err(INVALID_ENROLLMENT_DATE_ERROR);
  }

  const current = currentEnrollment(input.existing, input.studentId);
  if (current && current.classroom_id === input.classroomId) {
    return ok({ close: null, open: current });
  }

  return ok({
    close: current
      ? {
          ...current,
          ended_on: input.startedOn,
        }
      : null,
    open: {
      id: input.createId(),
      student_id: input.studentId,
      classroom_id: input.classroomId,
      started_on: input.startedOn,
      ended_on: '',
      created_by: input.createdBy,
      created_at: input.createdAt,
    },
  });
}
