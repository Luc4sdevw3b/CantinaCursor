import { APP_NAME, APP_VERSION } from '../../app-version';
import { isEnvironment } from '../../domain/environment';
import type { AppApi, AppHealth } from './app-api';

export interface GoogleScriptRunner {
  withSuccessHandler(handler: (value: unknown) => void): GoogleScriptRunner;
  withFailureHandler(handler: (error: unknown) => void): GoogleScriptRunner;
  getHealth(): void;
}

function isAppHealth(value: unknown): value is AppHealth {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const health = value as Partial<AppHealth>;
  return (
    typeof health.appName === 'string' &&
    typeof health.version === 'string' &&
    isEnvironment(health.environment) &&
    health.status === 'ready' &&
    health.adapter === 'google-script' &&
    typeof health.spreadsheetConfigured === 'boolean' &&
    typeof health.schemaVersion === 'number' &&
    typeof health.backupConfigured === 'boolean' &&
    (health.lastBackupAt === null || typeof health.lastBackupAt === 'string')
  );
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('Não foi possível consultar o ambiente Apps Script.');
}

export class GoogleScriptAppApi implements AppApi {
  constructor(private readonly runner: GoogleScriptRunner) {}

  getHealth(): Promise<AppHealth> {
    return new Promise((resolve, reject) => {
      this.runner
        .withSuccessHandler((value) => {
          if (!isAppHealth(value)) {
            reject(new Error('Resposta inválida do healthcheck Apps Script.'));
            return;
          }

          if (value.appName !== APP_NAME || value.version !== APP_VERSION) {
            reject(new Error('Healthcheck Apps Script incompatível.'));
            return;
          }

          resolve({
            appName: value.appName,
            version: value.version,
            environment: value.environment,
            status: value.status,
            adapter: value.adapter,
            spreadsheetConfigured: value.spreadsheetConfigured,
            schemaVersion: value.schemaVersion,
            backupConfigured: value.backupConfigured,
            lastBackupAt: value.lastBackupAt,
          });
        })
        .withFailureHandler((error) => reject(toError(error)))
        .getHealth();
    });
  }
}
