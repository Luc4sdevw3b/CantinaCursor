import { APP_NAME, APP_VERSION } from '../../app-version';
import type { AppApi, AppHealth } from './app-api';

const LOCAL_HEALTH: AppHealth = {
  appName: APP_NAME,
  version: APP_VERSION,
  environment: 'LOCAL',
  status: 'ready',
  adapter: 'fake',
  spreadsheetConfigured: false,
};

export class FakeAppApi implements AppApi {
  async getHealth(): Promise<AppHealth> {
    return { ...LOCAL_HEALTH };
  }
}
