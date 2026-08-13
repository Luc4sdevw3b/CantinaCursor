import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/app-version';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';

describe('FakeAppApi', () => {
  it('returns a safe local health response', async () => {
    const health = await new FakeAppApi().getHealth();

    expect(health).toEqual({
      appName: APP_NAME,
      version: APP_VERSION,
      environment: 'LOCAL',
      status: 'ready',
      adapter: 'fake',
      spreadsheetConfigured: false,
      schemaVersion: 0,
      backupConfigured: false,
      lastBackupAt: null,
    });
  });

  it('does not share mutable health state between calls', async () => {
    const api = new FakeAppApi();
    const first = await api.getHealth();
    first.environment = 'PROD';

    expect((await api.getHealth()).environment).toBe('LOCAL');
  });

  it('keeps a local E2E-style session without a password', async () => {
    const api = new FakeAppApi();

    expect(await api.getSession()).toBeNull();
    expect(await api.loginE2E('owner')).toEqual({ role: 'owner' });
    expect(await api.getSession()).toEqual({ role: 'owner' });
    expect(await api.loginE2E('staff')).toEqual({ role: 'staff' });
    await api.logout();
    expect(await api.getSession()).toBeNull();
  });

  it('lists homonyms separately and requires review to reactivate', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const students = await api.listStudents();
    const anas = students.filter((student) => student.fullName === 'Ana Souza');

    expect(anas).toHaveLength(2);
    expect(anas.map((student) => student.ageLabel).sort()).toEqual([
      '10',
      '~8',
    ]);
    expect(new Set(anas.map((student) => student.id)).size).toBe(2);

    const bruno = students.find((student) => student.fullName === 'Bruno Lima');
    if (!bruno) {
      throw new Error('Bruno Lima não estava no cadastro local');
    }
    await api.deactivateStudent(bruno.id);
    await expect(
      api.reactivateStudent(bruno.id, {
        reviewed: false,
        fullName: 'Bruno Lima',
      }),
    ).rejects.toThrow('REACTIVATION_REVIEW_REQUIRED');
    expect(
      (
        await api.reactivateStudent(bruno.id, {
          reviewed: true,
          fullName: 'Bruno Lima',
        })
      ).active,
    ).toBe(true);
  });
});
