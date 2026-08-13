import { isBackupFileName } from './backup-name';

export interface RetainedDriveFile {
  fileId: string;
  name: string;
  createdAt: string;
}

export function planBackupRetention(
  files: readonly RetainedDriveFile[],
  nowIso: string,
  retentionDays: number,
): { keep: RetainedDriveFile[]; trash: RetainedDriveFile[] } {
  const nowMs = Date.parse(nowIso);
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const keep: RetainedDriveFile[] = [];
  const trash: RetainedDriveFile[] = [];

  for (const file of files) {
    const createdMs = Date.parse(file.createdAt);
    if (
      isBackupFileName(file.name) &&
      Number.isFinite(nowMs) &&
      Number.isFinite(createdMs) &&
      nowMs - createdMs > maxAgeMs
    ) {
      trash.push(file);
      continue;
    }
    keep.push(file);
  }

  return { keep, trash };
}
