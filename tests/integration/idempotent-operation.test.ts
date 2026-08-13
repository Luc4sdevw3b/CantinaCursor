import { describe, expect, it } from 'vitest';
import { createRequestId } from '../../src/domain/request-id';
import { createMemoryLock } from '../../src/server/locks/memory-lock';
import {
  E2E_PROBE_OPERATION,
  executeIdempotentOperation,
} from '../../src/server/operations/idempotent';
import type { BatchMutation } from '../../src/server/sheets/batch';
import { applyBatchMutations } from '../../src/server/sheets/batch';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';
import { OPERATION_REQUESTS_SHEET } from '../../src/server/sheets/schema';
import { setupSchema } from '../../src/server/sheets/setup-schema';

const RESULT_ENTITY_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const REQUEST_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

function readyOperations() {
  const memory = createMemorySpreadsheet();
  setupSchema({
    environment: 'E2E',
    appVersion: '0.1.0-dev',
    nowIso: '2026-08-13T15:00:00.000Z',
    spreadsheet: memory.spreadsheet,
  });
  const operations = memory.spreadsheet.getSheet(OPERATION_REQUESTS_SHEET.name);
  if (!operations) {
    throw new Error('setupSchema não criou _operation_requests.');
  }
  return { ...memory, operations };
}

describe('idempotent operations', () => {
  it('replays the same result on retry and double submit', () => {
    const { spreadsheet, operations } = readyOperations();
    const probe = spreadsheet.createSheet('_e2e_probe');
    probe.setHeaders(['id', 'label']);
    const lock = createMemoryLock();
    const input = {
      requestId: createRequestId(() => REQUEST_ID),
      operationType: E2E_PROBE_OPERATION,
      nowIso: '2026-08-13T15:01:00.000Z',
      createResultEntityId: () => RESULT_ENTITY_ID,
      extraMutations: [
        {
          type: 'appendRows' as const,
          sheetName: '_e2e_probe',
          rows: [[RESULT_ENTITY_ID, 'ok']],
        },
      ],
      lock,
      operations,
      applyMutations: (mutations: readonly BatchMutation[]) =>
        applyBatchMutations(spreadsheet, mutations),
    };

    const first = executeIdempotentOperation(input);
    const retry = executeIdempotentOperation(input);
    const doubleSubmit = executeIdempotentOperation(input);

    expect(first).toEqual({
      ok: true,
      data: {
        requestId: REQUEST_ID,
        resultEntityId: RESULT_ENTITY_ID,
        replayed: false,
        status: 'completed',
      },
    });
    expect(retry).toEqual({
      ok: true,
      data: {
        requestId: REQUEST_ID,
        resultEntityId: RESULT_ENTITY_ID,
        replayed: true,
        status: 'completed',
      },
    });
    expect(doubleSubmit).toEqual(retry);
    expect(operations.listRows()).toHaveLength(1);
    expect(probe.listRows()).toEqual([[RESULT_ENTITY_ID, 'ok']]);
  });

  it('retries after a failed batch without duplicating the request', () => {
    const { spreadsheet, operations } = readyOperations();
    let failNext = true;

    const run = () =>
      executeIdempotentOperation({
        requestId: REQUEST_ID,
        operationType: E2E_PROBE_OPERATION,
        nowIso: '2026-08-13T15:01:00.000Z',
        createResultEntityId: () => RESULT_ENTITY_ID,
        lock: createMemoryLock(),
        operations,
        applyMutations: (mutations) => {
          if (failNext) {
            failNext = false;
            return {
              ok: false,
              error: {
                code: 'BATCH_FAILED',
                message: 'Falha temporária no batch.',
                retryable: true,
              },
            };
          }
          return applyBatchMutations(spreadsheet, mutations);
        },
      });

    const failed = run();
    const recovered = run();

    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.error.code).toBe('BATCH_FAILED');
      expect(failed.error.retryable).toBe(true);
    }
    expect(recovered).toEqual({
      ok: true,
      data: {
        requestId: REQUEST_ID,
        resultEntityId: RESULT_ENTITY_ID,
        replayed: false,
        status: 'completed',
      },
    });
    expect(operations.listRows()).toHaveLength(1);
  });

  it('rejects a row number as request_id', () => {
    const { spreadsheet, operations } = readyOperations();
    const result = executeIdempotentOperation({
      requestId: '2',
      operationType: E2E_PROBE_OPERATION,
      nowIso: '2026-08-13T15:01:00.000Z',
      createResultEntityId: () => RESULT_ENTITY_ID,
      lock: createMemoryLock(),
      operations,
      applyMutations: (mutations) =>
        applyBatchMutations(spreadsheet, mutations),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_REQUEST_ID');
    }
    expect(operations.listRows()).toHaveLength(0);
  });

  it('returns a retryable lock timeout without writing', () => {
    const { spreadsheet, operations } = readyOperations();
    const result = executeIdempotentOperation({
      requestId: REQUEST_ID,
      operationType: E2E_PROBE_OPERATION,
      nowIso: '2026-08-13T15:01:00.000Z',
      createResultEntityId: () => RESULT_ENTITY_ID,
      lock: createMemoryLock({ acquire: false }),
      operations,
      applyMutations: (mutations) =>
        applyBatchMutations(spreadsheet, mutations),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('LOCK_TIMEOUT');
      expect(result.error.retryable).toBe(true);
    }
    expect(operations.listRows()).toHaveLength(0);
  });

  it('rejects the same request_id used for a different operation', () => {
    const { spreadsheet, operations } = readyOperations();
    const applyMutations = (mutations: readonly BatchMutation[]) =>
      applyBatchMutations(spreadsheet, mutations);

    executeIdempotentOperation({
      requestId: REQUEST_ID,
      operationType: E2E_PROBE_OPERATION,
      nowIso: '2026-08-13T15:01:00.000Z',
      createResultEntityId: () => RESULT_ENTITY_ID,
      lock: createMemoryLock(),
      operations,
      applyMutations,
    });

    const conflict = executeIdempotentOperation({
      requestId: REQUEST_ID,
      operationType: 'e2e.other',
      nowIso: '2026-08-13T15:02:00.000Z',
      createResultEntityId: () => RESULT_ENTITY_ID,
      lock: createMemoryLock(),
      operations,
      applyMutations,
    });

    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.error.code).toBe('REQUEST_CONFLICT');
    }
    expect(operations.listRows()).toHaveLength(1);
  });
});
