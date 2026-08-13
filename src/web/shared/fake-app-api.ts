import { APP_NAME, APP_VERSION } from '../../app-version';
import { isUserRole, type UserRole } from '../../domain/auth';
import type { AppApi, AppHealth, AppSession } from './app-api';

const LOCAL_HEALTH: AppHealth = {
  appName: APP_NAME,
  version: APP_VERSION,
  environment: 'LOCAL',
  status: 'ready',
  adapter: 'fake',
  spreadsheetConfigured: false,
  schemaVersion: 0,
  backupConfigured: false,
  lastBackupAt: null,
};

export class FakeAppApi implements AppApi {
  private session: AppSession | null = null;

  async getHealth(): Promise<AppHealth> {
    return { ...LOCAL_HEALTH };
  }

  async getSession(): Promise<AppSession | null> {
    return this.session ? { ...this.session } : null;
  }

  async loginE2E(role: UserRole): Promise<AppSession> {
    if (!isUserRole(role)) {
      throw new Error('INVALID_ROLE: informe dona ou funcionário.');
    }
    this.session = { role };
    return { role };
  }

  async logout(): Promise<void> {
    this.session = null;
  }
}
