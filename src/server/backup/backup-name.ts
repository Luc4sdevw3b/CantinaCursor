export const BACKUP_FILE_PREFIX = 'cantina-backup';

export const BACKUP_REASONS = [
  'scheduled',
  'pre-migration',
  'manual',
  'pre-restore',
] as const;

export type BackupReason = (typeof BACKUP_REASONS)[number];

export const DEFAULT_BACKUP_RETENTION_DAYS = 14;

export function isBackupReason(value: string): value is BackupReason {
  return BACKUP_REASONS.some((reason) => reason === value);
}

export function createBackupFileName(input: {
  environment: string;
  nowIso: string;
  appVersion: string;
  schemaVersion: number;
}): string {
  const stamp = input.nowIso
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replace(/\.\d+Z$/, 'Z');
  const version = input.appVersion.replace(/[^0-9A-Za-z]+/g, '-');
  return `${BACKUP_FILE_PREFIX}-${input.environment}-${stamp}-v${version}-s${input.schemaVersion}`;
}

export function isBackupFileName(name: string): boolean {
  return name.startsWith(`${BACKUP_FILE_PREFIX}-`);
}

export function createBackupDescription(input: {
  appVersion: string;
  schemaVersion: number;
  reason: BackupReason;
  environment: string;
}): string {
  return JSON.stringify({
    appVersion: input.appVersion,
    schemaVersion: input.schemaVersion,
    reason: input.reason,
    environment: input.environment,
  });
}
