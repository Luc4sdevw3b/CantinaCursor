import { describe, expect, it } from 'vitest';
import { setupSchema } from '../../src/server/sheets/setup-schema';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';
import {
  BACKUPS_MIGRATION_ID,
  FOUNDATION_MIGRATION_ID,
  GUARDIANS_MIGRATION_ID,
  OPERATION_REQUESTS_MIGRATION_ID,
  USERS_MIGRATION_ID,
  STUDENTS_MIGRATION_ID,
  PRODUCTS_MIGRATION_ID,
  INVENTORY_MIGRATION_ID,
  SALES_MIGRATION_ID,
  RECEIVABLES_MIGRATION_ID,
  PAYMENTS_MIGRATION_ID,
  CREDITS_MIGRATION_ID,
  CASH_MIGRATION_ID,
  REVERSALS_MIGRATION_ID,
  RESERVATIONS_MIGRATION_ID,
} from '../../src/server/sheets/schema';

describe('setupSchema', () => {
  it('creates foundation sheets idempotently', () => {
    const { spreadsheet, sheets } = createMemorySpreadsheet();
    const input = {
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    };

    const first = setupSchema(input);
    const second = setupSchema(input);

    expect(first).toEqual({
      ok: true,
      data: {
        schemaVersion: 15,
        appliedMigrations: [
          FOUNDATION_MIGRATION_ID,
          OPERATION_REQUESTS_MIGRATION_ID,
          BACKUPS_MIGRATION_ID,
          USERS_MIGRATION_ID,
          STUDENTS_MIGRATION_ID,
          GUARDIANS_MIGRATION_ID,
          PRODUCTS_MIGRATION_ID,
          INVENTORY_MIGRATION_ID,
          SALES_MIGRATION_ID,
          RECEIVABLES_MIGRATION_ID,
          PAYMENTS_MIGRATION_ID,
          CREDITS_MIGRATION_ID,
          CASH_MIGRATION_ID,
          REVERSALS_MIGRATION_ID,
          RESERVATIONS_MIGRATION_ID,
        ],
      },
    });
    expect(second).toEqual(first);
    expect(sheets.get('_schema_migrations')?.listRows()).toHaveLength(15);
    expect(sheets.get('_meta')?.getHeaders()).toEqual(['key', 'value']);
    expect(sheets.get('_operation_requests')?.getHeaders()).toEqual([
      'request_id',
      'operation_type',
      'result_entity_id',
      'status',
      'created_at',
    ]);
    expect(sheets.get('_backups')?.getHeaders()).toEqual([
      'id',
      'created_at',
      'app_version',
      'schema_version',
      'reason',
      'status',
      'drive_file_id',
    ]);
    expect(sheets.get('_users')?.getHeaders()).toEqual([
      'id',
      'google_subject',
      'role',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_sessions')?.getHeaders()).toEqual([
      'id',
      'user_id',
      'role',
      'created_at',
      'expires_at',
      'revoked',
    ]);
    expect(sheets.get('_school_years')?.getHeaders()).toEqual([
      'id',
      'label',
      'started_on',
      'ended_on',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_students')?.getHeaders()[0]).toBe('id');
    expect(sheets.get('_guardians')?.getHeaders()).toEqual([
      'id',
      'full_name',
      'phone',
      'whatsapp_enabled',
      'relation_label',
      'active',
      'created_at',
      'updated_at',
    ]);
    expect(sheets.get('_settings')?.getHeaders()).toEqual(['key', 'value']);
    expect(sheets.get('_product_categories')?.getHeaders()).toEqual([
      'id',
      'name',
      'sort_order',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_products')?.getHeaders()).toEqual([
      'id',
      'category_id',
      'name',
      'price_cents',
      'discount_allowed',
      'stock_tracked',
      'reservable',
      'active',
      'created_at',
      'updated_at',
    ]);
    expect(sheets.get('_ad_hoc_items')?.getHeaders()).toEqual([
      'id',
      'name',
      'price_cents',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_inventory_days')?.getHeaders()).toEqual([
      'id',
      'business_date',
      'status',
      'opened_by',
      'opened_at',
    ]);
    expect(sheets.get('_inventory_opening_items')?.getHeaders()).toEqual([
      'id',
      'inventory_day_id',
      'product_id',
      'opening_quantity',
    ]);
    expect(sheets.get('_inventory_movements')?.getHeaders()).toEqual([
      'id',
      'inventory_day_id',
      'product_id',
      'kind',
      'quantity_delta',
      'source_type',
      'source_id',
      'created_by',
      'created_at',
      'reason',
    ]);
    expect(sheets.get('_sales')?.getHeaders()).toEqual([
      'id',
      'consumer_student_id',
      'charged_student_id',
      'status',
      'gross_total_cents',
      'discount_total_cents',
      'net_total_cents',
      'source_reservation_id',
      'created_by',
      'created_at',
      'reversal_id',
    ]);
    expect(sheets.get('_sale_items')?.getHeaders()).toEqual([
      'id',
      'sale_id',
      'product_id',
      'item_kind',
      'description_snapshot',
      'quantity',
      'unit_price_cents',
      'discount_kind',
      'discount_input',
      'discount_amount_cents',
      'line_net_total_cents',
    ]);
    expect(sheets.get('_sale_settlements')?.getHeaders()).toEqual([
      'id',
      'sale_id',
      'kind',
      'amount_cents',
      'related_entity_id',
      'created_at',
    ]);
    expect(sheets.get('_receivables')?.getHeaders()).toEqual([
      'id',
      'charged_student_id',
      'source_sale_id',
      'due_date',
      'status',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_receivable_charges')?.getHeaders()).toEqual([
      'id',
      'receivable_id',
      'kind',
      'amount_cents',
      'reason_code',
      'note',
      'created_by',
      'created_at',
      'reversal_id',
    ]);
    expect(sheets.get('_receivable_due_date_history')?.getHeaders()).toEqual([
      'receivable_id',
      'old_due_date',
      'new_due_date',
      'reason',
      'changed_by',
      'changed_at',
    ]);
    expect(sheets.get('_payments')?.getHeaders()).toEqual([
      'id',
      'payer_guardian_id',
      'payer_student_id',
      'method',
      'amount_received_cents',
      'status',
      'created_by',
      'created_at',
      'note',
    ]);
    expect(sheets.get('_payment_allocations')?.getHeaders()).toEqual([
      'payment_id',
      'receivable_id',
      'student_id',
      'amount_cents',
    ]);
    expect(sheets.get('_credit_accounts')?.getHeaders()).toEqual([
      'id',
      'owner_type',
      'owner_student_id',
      'owner_guardian_id',
      'active',
      'created_at',
    ]);
    expect(sheets.get('_credit_account_students')?.getHeaders()).toEqual([
      'credit_account_id',
      'student_id',
      'can_use',
      'active',
    ]);
    expect(sheets.get('_credit_movements')?.getHeaders()).toEqual([
      'credit_account_id',
      'kind',
      'amount_delta_cents',
      'source_type',
      'source_id',
      'student_id',
      'created_by',
      'created_at',
      'note',
    ]);
    expect(sheets.get('_payment_credit_allocations')?.getHeaders()).toEqual([
      'payment_id',
      'credit_account_id',
      'amount_cents',
    ]);
    expect(sheets.get('_cash_sessions')?.getHeaders()).toEqual([
      'id',
      'business_date',
      'status',
      'opening_float_cents',
      'opened_by',
      'opened_at',
      'closed_by',
      'closed_at',
      'expected_close_cents',
      'counted_close_cents',
      'difference_cents',
      'close_note',
    ]);
    expect(sheets.get('_cash_movements')?.getHeaders()).toEqual([
      'id',
      'cash_session_id',
      'kind',
      'amount_delta_cents',
      'source_type',
      'source_id',
      'created_by',
      'created_at',
      'note',
    ]);
    expect(sheets.get('_operation_reversals')?.getHeaders()).toEqual([
      'id',
      'operation_type',
      'operation_id',
      'reason',
      'original_methods',
      'refund_method',
      'different_method_confirmed',
      'returned_to_stock',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_reversal_effects')?.getHeaders()).toEqual([
      'id',
      'reversal_id',
      'effect_type',
      'entity_type',
      'entity_id',
      'amount_delta_cents',
      'quantity_delta',
    ]);
    expect(sheets.get('_reservation_slots')?.getHeaders()).toEqual([
      'id',
      'business_date',
      'label',
      'pickup_starts_at',
      'pickup_ends_at',
      'cutoff_at',
      'active',
      'created_by',
      'created_at',
    ]);
    expect(sheets.get('_reservations')?.getHeaders()).toEqual([
      'id',
      'public_code',
      'request_id',
      'requester_name',
      'student_name_text',
      'classroom_text',
      'contact_optional',
      'slot_id',
      'status',
      'payment_status',
      'linked_student_id',
      'total_cents',
      'created_at',
      'updated_at',
      'note',
    ]);
    expect(sheets.get('_reservation_items')?.getHeaders()).toEqual([
      'id',
      'reservation_id',
      'product_id',
      'description_snapshot',
      'quantity',
      'unit_price_cents',
      'line_total_cents',
    ]);
    expect(sheets.get('_reservation_status_history')?.getHeaders()).toEqual([
      'id',
      'reservation_id',
      'from_status',
      'to_status',
      'actor_id',
      'created_at',
      'reason',
    ]);
  });

  it('applies only the operation-requests migration when foundation already exists', () => {
    const { spreadsheet, sheets } = createMemorySpreadsheet();
    const meta = spreadsheet.createSheet('_meta');
    meta.setHeaders(['key', 'value']);
    const migrations = spreadsheet.createSheet('_schema_migrations');
    migrations.setHeaders([
      'migration_id',
      'applied_at',
      'app_version',
      'checksum',
      'description',
    ]);
    migrations.appendRow([
      FOUNDATION_MIGRATION_ID,
      '2026-08-13T12:00:00.000Z',
      '0.1.0-dev',
      'meta|schema_migrations',
      'Cria _meta e _schema_migrations',
    ]);

    const result = setupSchema({
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:30:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.appliedMigrations).toEqual([
        FOUNDATION_MIGRATION_ID,
        OPERATION_REQUESTS_MIGRATION_ID,
        BACKUPS_MIGRATION_ID,
        USERS_MIGRATION_ID,
        STUDENTS_MIGRATION_ID,
        GUARDIANS_MIGRATION_ID,
        PRODUCTS_MIGRATION_ID,
        INVENTORY_MIGRATION_ID,
        SALES_MIGRATION_ID,
        RECEIVABLES_MIGRATION_ID,
        PAYMENTS_MIGRATION_ID,
        CREDITS_MIGRATION_ID,
        CASH_MIGRATION_ID,
        REVERSALS_MIGRATION_ID,
        RESERVATIONS_MIGRATION_ID,
      ]);
    }
    expect(sheets.get('_schema_migrations')?.listRows()).toHaveLength(15);
  });

  it('refuses PROD', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const result = setupSchema({
      environment: 'PROD',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RESET_PROD_FORBIDDEN');
    }
  });

  it('refuses unexpected headers on sheets that already have data', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const meta = spreadsheet.createSheet('_meta');
    meta.setHeaders(['id', 'value']);
    meta.appendRow(['schema_version', '1']);

    const result = setupSchema({
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('HEADER_MISMATCH');
    }
  });

  it('refuses unknown applied migrations', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const meta = spreadsheet.createSheet('_meta');
    meta.setHeaders(['key', 'value']);
    const migrations = spreadsheet.createSheet('_schema_migrations');
    migrations.setHeaders([
      'migration_id',
      'applied_at',
      'app_version',
      'checksum',
      'description',
    ]);
    migrations.appendRow(['999_unknown', '', '', '', '']);

    const result = setupSchema({
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNKNOWN_MIGRATION');
    }
  });

  it('runs the pre-migration hook only when there are pending migrations', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const calls: number[] = [];
    const input = {
      environment: 'E2E',
      appVersion: '0.1.0-dev',
      nowIso: '2026-08-13T12:00:00.000Z',
      spreadsheet,
      beforePendingMigrations: () => {
        calls.push(1);
        return { ok: true as const, data: undefined };
      },
    };

    expect(setupSchema(input).ok).toBe(true);
    expect(setupSchema(input).ok).toBe(true);
    expect(calls).toEqual([1]);
  });
});
