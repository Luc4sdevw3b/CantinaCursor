import { isImmutableId, isSheetRowNumber } from './ids';
import { err, ok, type Result } from './result';

export interface GuardianLinkRecord {
  id: string;
  student_id: string;
  guardian_id: string;
  is_primary: string;
  can_use_guardian_credit: string;
  auto_settle_debt_from_guardian_credit: string;
  active: string;
  started_at: string;
  ended_at: string;
  note: string;
  created_at: string;
}

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

function validId(id: string): boolean {
  return !isSheetRowNumber(id) && isImmutableId(id);
}

export function latestActiveLinks(
  records: readonly GuardianLinkRecord[],
): GuardianLinkRecord[] {
  const latest = new Map<string, GuardianLinkRecord>();
  for (const record of records) {
    latest.set(record.id, record);
  }
  return [...latest.values()].filter(
    (record) => record.active === 'true' && record.ended_at === '',
  );
}

export function primaryGuardianId(
  records: readonly GuardianLinkRecord[],
  studentId: string,
): string | null {
  const primary = latestActiveLinks(records).find(
    (record) => record.student_id === studentId && record.is_primary === 'true',
  );
  return primary?.guardian_id ?? null;
}

export function siblingStudentIds(
  records: readonly GuardianLinkRecord[],
  studentId: string,
): string[] {
  const active = latestActiveLinks(records);
  const guardianIds = new Set(
    active
      .filter((record) => record.student_id === studentId)
      .map((record) => record.guardian_id),
  );
  const siblings = new Set<string>();
  for (const record of active) {
    if (
      guardianIds.has(record.guardian_id) &&
      record.student_id !== studentId
    ) {
      siblings.add(record.student_id);
    }
  }
  return [...siblings];
}

export function planGuardianLink(input: {
  studentId: string;
  guardianId: string;
  isPrimary: boolean;
  canUseGuardianCredit?: boolean;
  autoSettle?: boolean;
  note?: string;
  createdAt: string;
  createId: () => string;
  existing: readonly GuardianLinkRecord[];
}): Result<{
  demote: GuardianLinkRecord | null;
  link: GuardianLinkRecord;
}> {
  if (!validId(input.studentId) || !validId(input.guardianId)) {
    return err(INVALID_ID_ERROR);
  }

  const active = latestActiveLinks(input.existing);
  const current = active.find(
    (record) =>
      record.student_id === input.studentId &&
      record.guardian_id === input.guardianId,
  );
  const previousPrimary = active.find(
    (record) =>
      record.student_id === input.studentId &&
      record.is_primary === 'true' &&
      record.guardian_id !== input.guardianId,
  );
  const makePrimary =
    input.isPrimary ||
    (!current &&
      !active.some(
        (record) =>
          record.student_id === input.studentId && record.is_primary === 'true',
      ));

  return ok({
    demote:
      makePrimary && previousPrimary
        ? { ...previousPrimary, is_primary: 'false' }
        : null,
    link: {
      id: current?.id ?? input.createId(),
      student_id: input.studentId,
      guardian_id: input.guardianId,
      is_primary: makePrimary ? 'true' : 'false',
      can_use_guardian_credit: input.canUseGuardianCredit ? 'true' : 'false',
      auto_settle_debt_from_guardian_credit: input.autoSettle
        ? 'true'
        : 'false',
      active: 'true',
      started_at: current?.started_at ?? input.createdAt,
      ended_at: '',
      note: input.note?.trim() ?? current?.note ?? '',
      created_at: current?.created_at ?? input.createdAt,
    },
  });
}

export const GUARDIAN_LINK_NOT_FOUND_ERROR = {
  code: 'GUARDIAN_LINK_NOT_FOUND',
  message: 'Este responsável não está vinculado ao aluno.',
  retryable: false,
} as const;

export function planGuardianUnlink(input: {
  studentId: string;
  guardianId: string;
  endedAt: string;
  existing: readonly GuardianLinkRecord[];
}): Result<GuardianLinkRecord> {
  if (!validId(input.studentId) || !validId(input.guardianId)) {
    return err(INVALID_ID_ERROR);
  }
  const current = latestActiveLinks(input.existing).find(
    (record) =>
      record.student_id === input.studentId &&
      record.guardian_id === input.guardianId,
  );
  if (!current) {
    return err(GUARDIAN_LINK_NOT_FOUND_ERROR);
  }
  return ok({
    ...current,
    active: 'false',
    ended_at: input.endedAt,
  });
}
