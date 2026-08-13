import { RESET_PROD_FORBIDDEN_ERROR } from '../../domain/e2e-lifecycle';
import { createImmutableId } from '../../domain/ids';
import { err, ok, type Result } from '../../domain/result';
import { deserializeRecord, serializeRecord } from '../sheets/serialize';
import { BACKUPS_SHEET, META_SHEET } from '../sheets/schema';
import type { SheetPort } from '../sheets/sheet-port';
import {
  createBackupDescription,
  createBackupFileName,
  type BackupReason,
} from './backup-name';
import type { DriveBackupPort } from './drive-port';
import { planBackupRetention } from './retention';

export interface RunBackupInput {
  environment: string | null | undefined;
  reason: BackupReason;
  nowIso: string;
  appVersion: string;
  schemaVersion: number;
  spreadsheetId: string;
  folderId: string;
  drive: DriveBackupPort;
  backups: SheetPort;
  meta: SheetPort;
  retentionDays: number;
  createBackupId?: () => string;
}

export interface RunBackupResult {
  backupId: string;
  createdAt: string;
  reason: BackupReason;
  schemaVersion: number;
}

export function readLastBackupAt(meta: SheetPort): string | null {
  let last: string | null = null;
  for (const row of meta.listRows()) {
    const record = deserializeRecord(META_SHEET.headers, row);
    if (record.key === 'last_backup_at' && record.value) {
      last = record.value;
    }
  }
  return last;
}

export function findBackupRecord(
  backups: SheetPort,
  backupId: string,
): Record<string, string> | null {
  for (const row of backups.listRows()) {
    const record = deserializeRecord(BACKUPS_SHEET.headers, row);
    if (record.id === backupId) {
      return record;
    }
  }
  return null;
}

export function runBackup(input: RunBackupInput): Result<RunBackupResult> {
  if (input.environment === 'PROD') {
    return err(RESET_PROD_FORBIDDEN_ERROR);
  }

  const name = createBackupFileName({
    environment: String(input.environment ?? ''),
    nowIso: input.nowIso,
    appVersion: input.appVersion,
    schemaVersion: input.schemaVersion,
  });
  const copied = input.drive.copySpreadsheet({
    spreadsheetId: input.spreadsheetId,
    folderId: input.folderId,
    name,
    description: createBackupDescription({
      appVersion: input.appVersion,
      schemaVersion: input.schemaVersion,
      reason: input.reason,
      environment: String(input.environment ?? ''),
    }),
    createdAt: input.nowIso,
  });
  if (!copied.ok) {
    return err(copied.error);
  }

  const backupId = (input.createBackupId ?? createImmutableId)();
  input.backups.appendRow(
    serializeRecord(BACKUPS_SHEET.headers, {
      id: backupId,
      created_at: input.nowIso,
      app_version: input.appVersion,
      schema_version: String(input.schemaVersion),
      reason: input.reason,
      status: 'completed',
      drive_file_id: copied.data.fileId,
    }),
  );
  input.meta.appendRow(
    serializeRecord(META_SHEET.headers, {
      key: 'last_backup_at',
      value: input.nowIso,
    }),
  );

  const listed = input.drive.listFolderFiles(input.folderId);
  if (listed.ok) {
    const plan = planBackupRetention(
      listed.data,
      input.nowIso,
      input.retentionDays,
    );
    for (const file of plan.trash) {
      const trashed = input.drive.trashFile(file.fileId);
      if (!trashed.ok) {
        return err(trashed.error);
      }
    }
  }

  return ok({
    backupId,
    createdAt: input.nowIso,
    reason: input.reason,
    schemaVersion: input.schemaVersion,
  });
}
