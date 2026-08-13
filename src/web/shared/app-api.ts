import type { Environment } from '../../domain/environment';

export type { Environment };

export type AppApiAdapter = 'fake' | 'google-script';

export interface AppHealth {
  appName: string;
  version: string;
  environment: Environment;
  status: 'ready';
  adapter: AppApiAdapter;
  spreadsheetConfigured: boolean;
}

/**
 * Contrato técnico mínimo.
 * Sem alunos, produtos, vendas, estoque, fiado, crédito, caixa, reservas ou WhatsApp.
 */
export interface AppApi {
  getHealth(): Promise<AppHealth>;
}
