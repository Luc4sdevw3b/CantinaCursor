import { describe, expect, it } from 'vitest';
import {
  BACKUP_FILE_PREFIX,
  createBackupDescription,
  createBackupFileName,
  isBackupFileName,
} from '../../src/server/backup/backup-name';

describe('backup file names', () => {
  it('builds a Drive name with environment, timestamp and versions', () => {
    const name = createBackupFileName({
      environment: 'E2E',
      nowIso: '2026-08-13T15:40:00.000Z',
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
    });

    expect(name).toBe(
      `${BACKUP_FILE_PREFIX}-E2E-20260813T154000Z-v0-1-0-dev-s3`,
    );
    expect(isBackupFileName(name)).toBe(true);
    expect(name).not.toContain('sheet');
  });

  it('describes a backup without spreadsheet ids', () => {
    const description = createBackupDescription({
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      reason: 'pre-migration',
      environment: 'E2E',
    });

    expect(JSON.parse(description)).toEqual({
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      reason: 'pre-migration',
      environment: 'E2E',
    });
    expect(description).not.toContain('spreadsheet');
  });
});
