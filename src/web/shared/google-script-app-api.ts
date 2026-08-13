import { APP_NAME, APP_VERSION } from '../../app-version';
import { isUserRole, type UserRole } from '../../domain/auth';
import { isEnvironment } from '../../domain/environment';
import type { AppApi, AppHealth, AppSession } from './app-api';

export const SESSION_TOKEN_STORAGE_KEY = 'cantina.sessionToken';

export interface GoogleScriptRunner {
  withSuccessHandler(handler: (value: unknown) => void): GoogleScriptRunner;
  withFailureHandler(handler: (error: unknown) => void): GoogleScriptRunner;
  getHealth(): void;
  loginE2E(role: string): void;
  logout(token: string): void;
  getSession(token: string): void;
}

export type SessionTokenStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;

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

function isAppSession(value: unknown): value is AppSession {
  return Boolean(
    value &&
    typeof value === 'object' &&
    isUserRole((value as AppSession).role),
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

function browserSessionStorage(): SessionTokenStorage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export class GoogleScriptAppApi implements AppApi {
  constructor(
    private readonly runner: GoogleScriptRunner,
    private readonly storage: SessionTokenStorage | null = browserSessionStorage(),
  ) {}

  getHealth(): Promise<AppHealth> {
    return this.call(
      (runner) => runner.getHealth(),
      (value) => {
        if (!isAppHealth(value)) {
          throw new Error('Resposta inválida do healthcheck Apps Script.');
        }

        if (value.appName !== APP_NAME || value.version !== APP_VERSION) {
          throw new Error('Healthcheck Apps Script incompatível.');
        }

        return {
          appName: value.appName,
          version: value.version,
          environment: value.environment,
          status: value.status,
          adapter: value.adapter,
          spreadsheetConfigured: value.spreadsheetConfigured,
          schemaVersion: value.schemaVersion,
          backupConfigured: value.backupConfigured,
          lastBackupAt: value.lastBackupAt,
        };
      },
    );
  }

  async getSession(): Promise<AppSession | null> {
    const token = this.readToken();
    if (!token) {
      return null;
    }

    try {
      return await this.call(
        (runner) => runner.getSession(token),
        (value) => {
          if (!isAppSession(value)) {
            throw new Error('Sessão inválida.');
          }
          return { role: value.role };
        },
      );
    } catch {
      this.clearToken();
      return null;
    }
  }

  loginE2E(role: UserRole): Promise<AppSession> {
    return this.call(
      (runner) => runner.loginE2E(role),
      (value) => {
        if (!value || typeof value !== 'object') {
          throw new Error('Login E2E inválido.');
        }
        const payload = value as { token?: unknown; role?: unknown };
        if (typeof payload.token !== 'string' || !isUserRole(payload.role)) {
          throw new Error('Login E2E inválido.');
        }
        this.storage?.setItem(SESSION_TOKEN_STORAGE_KEY, payload.token);
        return { role: payload.role };
      },
    );
  }

  async logout(): Promise<void> {
    const token = this.readToken();
    this.clearToken();
    if (!token) {
      return;
    }

    try {
      await this.call(
        (runner) => runner.logout(token),
        () => undefined,
      );
    } catch {
      return;
    }
  }

  private readToken(): string | null {
    return this.storage?.getItem(SESSION_TOKEN_STORAGE_KEY) ?? null;
  }

  private clearToken(): void {
    this.storage?.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }

  private call<T>(
    execute: (runner: GoogleScriptRunner) => void,
    parse: (value: unknown) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const runner = this.runner
        .withSuccessHandler((value) => {
          try {
            resolve(parse(value));
          } catch (error) {
            reject(toError(error));
          }
        })
        .withFailureHandler((error) => reject(toError(error)));
      execute(runner);
    });
  }
}
