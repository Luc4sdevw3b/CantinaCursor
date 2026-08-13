export type Environment = 'LOCAL' | 'DEV' | 'E2E' | 'PROD';

export interface AppHealth {
  appName: string;
  version: string;
  environment: Environment;
  status: 'ready';
  spreadsheetConfigured: boolean;
}

export interface AppApi {
  getHealth(): Promise<AppHealth>;
}
