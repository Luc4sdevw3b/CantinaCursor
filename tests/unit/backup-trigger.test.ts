import { describe, expect, it } from 'vitest';
import { shouldCreateBackupTrigger } from '../../src/server/backup/trigger';

describe('backup trigger', () => {
  it('creates the daily trigger only once', () => {
    expect(shouldCreateBackupTrigger([])).toBe(true);
    expect(shouldCreateBackupTrigger(['runScheduledBackup'])).toBe(false);
  });
});
