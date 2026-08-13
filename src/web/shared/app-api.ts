import type { Environment } from '../../domain/environment';
import type { UserRole } from '../../domain/auth';

export type { Environment, UserRole };

export type AppApiAdapter = 'fake' | 'google-script';

export interface AppHealth {
  appName: string;
  version: string;
  environment: Environment;
  status: 'ready';
  adapter: AppApiAdapter;
  spreadsheetConfigured: boolean;
  schemaVersion: number;
  backupConfigured: boolean;
  lastBackupAt: string | null;
}

export interface AppSession {
  role: UserRole;
}

/**
 * Contrato técnico mínimo.
 * Sem alunos, produtos, vendas, estoque, fiado, crédito, caixa, reservas ou WhatsApp.
 */
export interface AppApi {
  getHealth(): Promise<AppHealth>;
  getSession(): Promise<AppSession | null>;
  loginE2E(role: UserRole): Promise<AppSession>;
  logout(): Promise<void>;
}
