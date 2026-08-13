import { err, ok, type Result } from '../../domain/result';

export interface DriveFileSnapshot {
  fileId: string;
  name: string;
  createdAt: string;
  description: string;
  trashed: boolean;
}

export interface DriveBackupPort {
  ensureFolder(name: string, existingId?: string): Result<{ folderId: string }>;
  copySpreadsheet(input: {
    spreadsheetId: string;
    folderId: string;
    name: string;
    description: string;
    createdAt: string;
  }): Result<{ fileId: string }>;
  listFolderFiles(folderId: string): Result<DriveFileSnapshot[]>;
  getFile(fileId: string): Result<DriveFileSnapshot | null>;
  trashFile(fileId: string): Result<void>;
}

const FOLDER_NOT_FOUND = {
  code: 'BACKUP_FOLDER_MISSING',
  message: 'A pasta de backup não está configurada.',
  retryable: false,
} as const;

export function createMemoryDrive(): DriveBackupPort & {
  folders: Map<string, DriveFileSnapshot[]>;
  files: Map<string, DriveFileSnapshot>;
} {
  const folders = new Map<string, DriveFileSnapshot[]>();
  const files = new Map<string, DriveFileSnapshot>();
  let folderCount = 0;
  let fileCount = 0;

  return {
    folders,
    files,
    ensureFolder(name, existingId) {
      void name;
      if (existingId) {
        if (!folders.has(existingId)) {
          return err(FOLDER_NOT_FOUND);
        }
        return ok({ folderId: existingId });
      }
      folderCount += 1;
      const folderId = `folder-${folderCount}`;
      folders.set(folderId, []);
      return ok({ folderId });
    },
    copySpreadsheet(input) {
      const folder = folders.get(input.folderId);
      if (!folder) {
        return err(FOLDER_NOT_FOUND);
      }
      fileCount += 1;
      const file: DriveFileSnapshot = {
        fileId: `file-${fileCount}`,
        name: input.name,
        createdAt: input.createdAt,
        description: input.description,
        trashed: false,
      };
      files.set(file.fileId, file);
      folder.push(file);
      return ok({ fileId: file.fileId });
    },
    listFolderFiles(folderId) {
      const folder = folders.get(folderId);
      if (!folder) {
        return err(FOLDER_NOT_FOUND);
      }
      return ok(
        folder.filter((file) => !file.trashed).map((file) => ({ ...file })),
      );
    },
    getFile(fileId) {
      const file = files.get(fileId);
      if (!file || file.trashed) {
        return ok(null);
      }
      return ok({ ...file });
    },
    trashFile(fileId) {
      const file = files.get(fileId);
      if (!file) {
        return ok(undefined);
      }
      file.trashed = true;
      return ok(undefined);
    },
  };
}
