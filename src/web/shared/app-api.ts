export type Environment = 'LOCAL' | 'DEV' | 'E2E' | 'PROD';

export type AppApiAdapter = 'fake';

export interface AppHealth {
  appName: string;
  version: string;
  environment: Environment;
  status: 'ready';
  adapter: AppApiAdapter;
  spreadsheetConfigured: boolean;
}

/**
 * Contrato técnico mínimo até a Fase 2.
 * Sem alunos, produtos, vendas, estoque, fiado, crédito, caixa, reservas ou WhatsApp.
 */
export interface AppApi {
  getHealth(): Promise<AppHealth>;
}
