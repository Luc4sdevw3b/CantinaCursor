import { describe, expect, it } from 'vitest';
import { createMemoryDrive } from '../../src/server/backup/drive-port';
import { prepareRestore } from '../../src/server/backup/restore';
import {
  readLastBackupAt,
  runBackup,
} from '../../src/server/backup/run-backup';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';
import { BACKUPS_SHEET } from '../../src/server/sheets/schema';
import { setupSchema } from '../../src/server/sheets/setup-schema';

const BACKUP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NOW = '2026-08-13T16:00:00.000Z';

function readyBackupSheets() {
  const memory = createMemorySpreadsheet();
  setupSchema({
    environment: 'E2E',
    appVersion: '0.1.0-dev',
    nowIso: NOW,
    spreadsheet: memory.spreadsheet,
  });
  const backups = memory.spreadsheet.getSheet(BACKUPS_SHEET.name);
  const meta = memory.spreadsheet.getSheet('_meta');
  if (!backups || !meta) {
    throw new Error('setupSchema não criou as abas de backup.');
  }
  return { ...memory, backups, meta };
}

describe('Drive backup and restore foundation', () => {
  it('copies the spreadsheet and records metadata without exposing ids in the result', () => {
    const { spreadsheet, backups, meta } = readyBackupSheets();
    const drive = createMemoryDrive();
    const folder = drive.ensureFolder('Cantina V2 AppScript E2E backups');
    if (!folder.ok) {
      throw new Error('pasta de backup inesperadamente ausente');
    }

    const result = runBackup({
      environment: 'E2E',
      reason: 'manual',
      nowIso: NOW,
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      spreadsheetId: 'secret-sheet-id',
      folderId: folder.data.folderId,
      drive,
      backups,
      meta,
      retentionDays: 14,
      createBackupId: () => BACKUP_ID,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        backupId: BACKUP_ID,
        createdAt: NOW,
        reason: 'manual',
        schemaVersion: 3,
      },
    });
    expect(JSON.stringify(result)).not.toContain('secret-sheet-id');
    expect(JSON.stringify(result)).not.toContain(folder.data.folderId);
    expect(readLastBackupAt(meta)).toBe(NOW);
    expect(backups.listRows()).toHaveLength(1);
    expect(spreadsheet.getSheet('_backups')?.listRows()[0]?.[0]).toBe(
      BACKUP_ID,
    );
  });

  it('trashes expired backups and keeps recent ones', () => {
    const { backups, meta } = readyBackupSheets();
    const drive = createMemoryDrive();
    const folder = drive.ensureFolder('Cantina V2 AppScript E2E backups');
    if (!folder.ok) {
      throw new Error('pasta de backup inesperadamente ausente');
    }

    runBackup({
      environment: 'E2E',
      reason: 'scheduled',
      nowIso: '2026-07-01T16:00:00.000Z',
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      spreadsheetId: 'secret-sheet-id',
      folderId: folder.data.folderId,
      drive,
      backups,
      meta,
      retentionDays: 14,
      createBackupId: () => 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });
    runBackup({
      environment: 'E2E',
      reason: 'scheduled',
      nowIso: NOW,
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      spreadsheetId: 'secret-sheet-id',
      folderId: folder.data.folderId,
      drive,
      backups,
      meta,
      retentionDays: 14,
      createBackupId: () => BACKUP_ID,
    });

    const listed = drive.listFolderFiles(folder.data.folderId);
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data).toHaveLength(1);
      expect(listed.data[0]?.createdAt).toBe(NOW);
    }
  });

  it('prepares restore after backing up current state and never merges', () => {
    const { backups, meta } = readyBackupSheets();
    const drive = createMemoryDrive();
    const folder = drive.ensureFolder('Cantina V2 AppScript E2E backups');
    if (!folder.ok) {
      throw new Error('pasta de backup inesperadamente ausente');
    }
    const input = {
      environment: 'E2E' as const,
      nowIso: NOW,
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      spreadsheetId: 'secret-sheet-id',
      folderId: folder.data.folderId,
      drive,
      backups,
      meta,
      retentionDays: 14,
    };

    const created = runBackup({
      ...input,
      reason: 'manual',
      createBackupId: () => BACKUP_ID,
    });
    expect(created.ok).toBe(true);

    const prepared = prepareRestore({
      ...input,
      nowIso: '2026-08-13T16:05:00.000Z',
      backupId: BACKUP_ID,
      confirmed: true,
      createBackupId: () => 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    expect(prepared).toEqual({
      ok: true,
      data: {
        prepared: true,
        merge: false,
        snapshotValid: true,
        currentBackupCreated: true,
      },
    });
    expect(backups.listRows()).toHaveLength(2);
  });

  it('refuses restore without confirmation, with a row number, or in PROD', () => {
    const { backups, meta } = readyBackupSheets();
    const drive = createMemoryDrive();
    const folder = drive.ensureFolder('Cantina V2 AppScript E2E backups');
    if (!folder.ok) {
      throw new Error('pasta de backup inesperadamente ausente');
    }
    const input = {
      nowIso: NOW,
      appVersion: '0.1.0-dev',
      schemaVersion: 3,
      spreadsheetId: 'secret-sheet-id',
      folderId: folder.data.folderId,
      drive,
      backups,
      meta,
      retentionDays: 14,
      backupId: BACKUP_ID,
      createBackupId: () => BACKUP_ID,
    };

    expect(
      prepareRestore({ ...input, environment: 'E2E', confirmed: false }).ok,
    ).toBe(false);
    expect(
      prepareRestore({
        ...input,
        environment: 'E2E',
        confirmed: true,
        backupId: '2',
      }).ok,
    ).toBe(false);
    expect(
      prepareRestore({ ...input, environment: 'PROD', confirmed: true }).ok,
    ).toBe(false);
  });
});
