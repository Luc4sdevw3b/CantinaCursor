import { describe, expect, it } from 'vitest';
import { planBackupRetention } from '../../src/server/backup/retention';

describe('backup retention', () => {
  it('trashes only expired backup files', () => {
    const plan = planBackupRetention(
      [
        {
          fileId: 'keep-recent',
          name: 'cantina-backup-E2E-recent',
          createdAt: '2026-08-10T12:00:00.000Z',
        },
        {
          fileId: 'trash-old',
          name: 'cantina-backup-E2E-old',
          createdAt: '2026-07-01T12:00:00.000Z',
        },
        {
          fileId: 'keep-other',
          name: 'not-a-backup',
          createdAt: '2026-07-01T12:00:00.000Z',
        },
      ],
      '2026-08-13T12:00:00.000Z',
      14,
    );

    expect(plan.keep.map((file) => file.fileId)).toEqual([
      'keep-recent',
      'keep-other',
    ]);
    expect(plan.trash.map((file) => file.fileId)).toEqual(['trash-old']);
  });
});
