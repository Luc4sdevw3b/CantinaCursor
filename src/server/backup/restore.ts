import { RESET_PROD_FORBIDDEN_ERROR } from '../../domain/e2e-lifecycle';
import { isImmutableId, isSheetRowNumber } from '../../domain/ids';
import { err, ok, type Result } from '../../domain/result';
import { findBackupRecord, runBackup, type RunBackupInput } from './run-backup';

const INVALID_BACKUP_ID = {
  code: 'INVALID_BACKUP_ID',
  message:
    'O backup deve ser identificado por UUID, nunca pelo número da linha.',
  retryable: false,
} as const;

const RESTORE_NOT_CONFIRMED = {
  code: 'RESTORE_NOT_CONFIRMED',
  message: 'A restauração precisa de confirmação explícita.',
  retryable: false,
} as const;

const SNAPSHOT_INVALID = {
  code: 'RESTORE_SNAPSHOT_INVALID',
  message: 'O snapshot de backup não é válido para restaurar.',
  retryable: false,
} as const;

export interface PrepareRestoreInput extends Omit<RunBackupInput, 'reason'> {
  backupId: string;
  confirmed: boolean;
}

export interface PrepareRestoreResult {
  prepared: true;
  merge: false;
  snapshotValid: true;
  currentBackupCreated: true;
}

export function prepareRestore(
  input: PrepareRestoreInput,
): Result<PrepareRestoreResult> {
  if (input.environment === 'PROD') {
    return err(RESET_PROD_FORBIDDEN_ERROR);
  }

  if (!input.confirmed) {
    return err(RESTORE_NOT_CONFIRMED);
  }

  if (isSheetRowNumber(input.backupId) || !isImmutableId(input.backupId)) {
    return err(INVALID_BACKUP_ID);
  }

  const record = findBackupRecord(input.backups, input.backupId);
  const fileId = record?.drive_file_id;
  if (!record || !fileId) {
    return err(SNAPSHOT_INVALID);
  }

  const snapshot = input.drive.getFile(fileId);
  if (!snapshot.ok) {
    return err(snapshot.error);
  }
  if (!snapshot.data) {
    return err(SNAPSHOT_INVALID);
  }

  const current = runBackup({ ...input, reason: 'pre-restore' });
  if (!current.ok) {
    return err(current.error);
  }

  return ok({
    prepared: true,
    merge: false,
    snapshotValid: true,
    currentBackupCreated: true,
  });
}
