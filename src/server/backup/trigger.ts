export const SCHEDULED_BACKUP_HANDLER = 'runScheduledBackup';
export const SCHEDULED_BACKUP_HOUR = 6;

export function shouldCreateBackupTrigger(
  existingHandlers: readonly string[],
): boolean {
  return !existingHandlers.includes(SCHEDULED_BACKUP_HANDLER);
}
