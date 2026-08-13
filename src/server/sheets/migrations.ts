import { err, ok, type Result } from '../../domain/result';
import { checksumHeaders } from './serialize';
import {
  BACKUPS_MIGRATION_ID,
  BACKUPS_SHEET,
  CLASSROOMS_SHEET,
  FOUNDATION_MIGRATION_ID,
  GUARDIANS_MIGRATION_ID,
  GUARDIANS_SHEET,
  OPERATION_REQUESTS_MIGRATION_ID,
  OPERATION_REQUESTS_SHEET,
  PRODUCTS_MIGRATION_ID,
  PRODUCTS_SHEET,
  PRODUCT_CATEGORIES_SHEET,
  PRODUCT_PRICE_HISTORY_SHEET,
  AD_HOC_ITEMS_SHEET,
  INVENTORY_MIGRATION_ID,
  INVENTORY_DAYS_SHEET,
  INVENTORY_OPENING_ITEMS_SHEET,
  INVENTORY_MOVEMENTS_SHEET,
  SALES_MIGRATION_ID,
  SALES_SHEET,
  SALE_ITEMS_SHEET,
  SALE_SETTLEMENTS_SHEET,
  RECEIVABLES_MIGRATION_ID,
  RECEIVABLES_SHEET,
  RECEIVABLE_CHARGES_SHEET,
  RECEIVABLE_DUE_DATE_HISTORY_SHEET,
  PAYMENTS_MIGRATION_ID,
  PAYMENTS_SHEET,
  PAYMENT_ALLOCATIONS_SHEET,
  CREDITS_MIGRATION_ID,
  CREDIT_ACCOUNTS_SHEET,
  CREDIT_ACCOUNT_STUDENTS_SHEET,
  CREDIT_MOVEMENTS_SHEET,
  PAYMENT_CREDIT_ALLOCATIONS_SHEET,
  CASH_MIGRATION_ID,
  CASH_SESSIONS_SHEET,
  CASH_MOVEMENTS_SHEET,
  REVERSALS_MIGRATION_ID,
  OPERATION_REVERSALS_SHEET,
  REVERSAL_EFFECTS_SHEET,
  SCHOOL_YEARS_SHEET,
  SESSIONS_SHEET,
  SETTINGS_SHEET,
  STUDENTS_MIGRATION_ID,
  STUDENTS_SHEET,
  STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET,
  STUDENT_ENROLLMENTS_SHEET,
  STUDENT_GUARDIANS_SHEET,
  USERS_MIGRATION_ID,
  USERS_SHEET,
} from './schema';

export interface Migration {
  id: string;
  description: string;
  checksum: string;
}

export const FOUNDATION_MIGRATION: Migration = {
  id: FOUNDATION_MIGRATION_ID,
  description: 'Cria _meta e _schema_migrations',
  checksum: 'meta|schema_migrations',
};

export const OPERATION_REQUESTS_MIGRATION: Migration = {
  id: OPERATION_REQUESTS_MIGRATION_ID,
  description: 'Cria _operation_requests',
  checksum: checksumHeaders(OPERATION_REQUESTS_SHEET.headers),
};

export const BACKUPS_MIGRATION: Migration = {
  id: BACKUPS_MIGRATION_ID,
  description: 'Cria _backups',
  checksum: checksumHeaders(BACKUPS_SHEET.headers),
};

export const USERS_MIGRATION: Migration = {
  id: USERS_MIGRATION_ID,
  description: 'Cria _users e _sessions',
  checksum: checksumHeaders([
    ...USERS_SHEET.headers,
    ...SESSIONS_SHEET.headers,
  ]),
};

export const STUDENTS_MIGRATION: Migration = {
  id: STUDENTS_MIGRATION_ID,
  description: 'Cria anos letivos, turmas, alunos e matrículas',
  checksum: checksumHeaders([
    ...SCHOOL_YEARS_SHEET.headers,
    ...CLASSROOMS_SHEET.headers,
    ...STUDENTS_SHEET.headers,
    ...STUDENT_ENROLLMENTS_SHEET.headers,
  ]),
};

export const GUARDIANS_MIGRATION: Migration = {
  id: GUARDIANS_MIGRATION_ID,
  description: 'Cria responsáveis, vínculos, autorizações de irmãos e settings',
  checksum: checksumHeaders([
    ...GUARDIANS_SHEET.headers,
    ...STUDENT_GUARDIANS_SHEET.headers,
    ...STUDENT_ACCOUNT_AUTHORIZATIONS_SHEET.headers,
    ...SETTINGS_SHEET.headers,
  ]),
};

export const PRODUCTS_MIGRATION: Migration = {
  id: PRODUCTS_MIGRATION_ID,
  description: 'Cria categorias, produtos, histórico de preço e itens avulsos',
  checksum: checksumHeaders([
    ...PRODUCT_CATEGORIES_SHEET.headers,
    ...PRODUCTS_SHEET.headers,
    ...PRODUCT_PRICE_HISTORY_SHEET.headers,
    ...AD_HOC_ITEMS_SHEET.headers,
  ]),
};

export const INVENTORY_MIGRATION: Migration = {
  id: INVENTORY_MIGRATION_ID,
  description: 'Cria estoque diário, abertura e movimentos',
  checksum: checksumHeaders([
    ...INVENTORY_DAYS_SHEET.headers,
    ...INVENTORY_OPENING_ITEMS_SHEET.headers,
    ...INVENTORY_MOVEMENTS_SHEET.headers,
  ]),
};

export const SALES_MIGRATION: Migration = {
  id: SALES_MIGRATION_ID,
  description: 'Cria vendas, itens com snapshot e settlements PIX',
  checksum: checksumHeaders([
    ...SALES_SHEET.headers,
    ...SALE_ITEMS_SHEET.headers,
    ...SALE_SETTLEMENTS_SHEET.headers,
  ]),
};

export const RECEIVABLES_MIGRATION: Migration = {
  id: RECEIVABLES_MIGRATION_ID,
  description: 'Cria recebíveis, charges e histórico de vencimento',
  checksum: checksumHeaders([
    ...RECEIVABLES_SHEET.headers,
    ...RECEIVABLE_CHARGES_SHEET.headers,
    ...RECEIVABLE_DUE_DATE_HISTORY_SHEET.headers,
  ]),
};

export const PAYMENTS_MIGRATION: Migration = {
  id: PAYMENTS_MIGRATION_ID,
  description: 'Cria pagamentos e alocações em recebíveis',
  checksum: checksumHeaders([
    ...PAYMENTS_SHEET.headers,
    ...PAYMENT_ALLOCATIONS_SHEET.headers,
  ]),
};

export const CREDITS_MIGRATION: Migration = {
  id: CREDITS_MIGRATION_ID,
  description: 'Cria contas de crédito, movimentos e alocações em crédito',
  checksum: checksumHeaders([
    ...CREDIT_ACCOUNTS_SHEET.headers,
    ...CREDIT_ACCOUNT_STUDENTS_SHEET.headers,
    ...CREDIT_MOVEMENTS_SHEET.headers,
    ...PAYMENT_CREDIT_ALLOCATIONS_SHEET.headers,
  ]),
};

export const CASH_MIGRATION: Migration = {
  id: CASH_MIGRATION_ID,
  description: 'Cria sessões e movimentos de caixa físico',
  checksum: checksumHeaders([
    ...CASH_SESSIONS_SHEET.headers,
    ...CASH_MOVEMENTS_SHEET.headers,
  ]),
};

export const REVERSALS_MIGRATION: Migration = {
  id: REVERSALS_MIGRATION_ID,
  description: 'Cria estornos de operações e efeitos auditáveis',
  checksum: checksumHeaders([
    ...OPERATION_REVERSALS_SHEET.headers,
    ...REVERSAL_EFFECTS_SHEET.headers,
  ]),
};

export const MIGRATION_CATALOG: readonly Migration[] = [
  FOUNDATION_MIGRATION,
  OPERATION_REQUESTS_MIGRATION,
  BACKUPS_MIGRATION,
  USERS_MIGRATION,
  STUDENTS_MIGRATION,
  GUARDIANS_MIGRATION,
  PRODUCTS_MIGRATION,
  INVENTORY_MIGRATION,
  SALES_MIGRATION,
  RECEIVABLES_MIGRATION,
  PAYMENTS_MIGRATION,
  CREDITS_MIGRATION,
  CASH_MIGRATION,
  REVERSALS_MIGRATION,
];

export function pendingMigrations(
  appliedIds: readonly string[],
  catalog: readonly Migration[] = MIGRATION_CATALOG,
): Result<Migration[]> {
  const applied = new Set(appliedIds);
  const pending = catalog.filter((migration) => !applied.has(migration.id));

  if (
    appliedIds.some((id) => !catalog.some((migration) => migration.id === id))
  ) {
    return err({
      code: 'UNKNOWN_MIGRATION',
      message: 'Há migration aplicada que não existe no catálogo.',
      retryable: false,
    });
  }

  return ok(pending);
}
