import { isRequestId } from '../../domain/request-id';
import { err, ok, type Result } from '../../domain/result';
import { withScriptLock, type ScriptLockPort } from '../locks/script-lock';
import type { BatchMutation } from '../sheets/batch';
import { OPERATION_REQUESTS_SHEET } from '../sheets/schema';
import { deserializeRecord, serializeRecord } from '../sheets/serialize';
import type { SheetPort } from '../sheets/sheet-port';

export const OPERATION_COMPLETED = 'completed';
export const E2E_PROBE_OPERATION = 'e2e.probe';

const INVALID_REQUEST_ID = {
  code: 'INVALID_REQUEST_ID',
  message: 'request_id deve ser UUID, nunca número da linha.',
  retryable: false,
} as const;

const REQUEST_CONFLICT = {
  code: 'REQUEST_CONFLICT',
  message: 'Este request_id já foi usado em outra operação.',
  retryable: false,
} as const;

const REQUEST_INCOMPLETE = {
  code: 'REQUEST_INCOMPLETE',
  message: 'A operação ainda não concluiu. Tente de novo.',
  retryable: true,
} as const;

export interface OperationRequestRecord {
  request_id: string;
  operation_type: string;
  result_entity_id: string;
  status: string;
  created_at: string;
}

export interface IdempotentOperationResult {
  requestId: string;
  resultEntityId: string;
  replayed: boolean;
  status: typeof OPERATION_COMPLETED;
}

export interface IdempotentOperationInput {
  requestId: string;
  operationType: string;
  nowIso: string;
  createResultEntityId: () => string;
  extraMutations?: readonly BatchMutation[];
  lock: ScriptLockPort;
  operations: SheetPort;
  applyMutations: (mutations: readonly BatchMutation[]) => Result<void>;
}

function parseOperation(row: readonly string[]): OperationRequestRecord | null {
  const record = deserializeRecord(OPERATION_REQUESTS_SHEET.headers, row);
  if (!record.request_id) {
    return null;
  }

  return {
    request_id: record.request_id,
    operation_type: record.operation_type ?? '',
    result_entity_id: record.result_entity_id ?? '',
    status: record.status ?? '',
    created_at: record.created_at ?? '',
  };
}

export function findOperationRequest(
  operations: SheetPort,
  requestId: string,
): OperationRequestRecord | null {
  for (const row of operations.listRows()) {
    const record = parseOperation(row);
    if (record?.request_id === requestId) {
      return record;
    }
  }

  return null;
}

export function executeIdempotentOperation(
  input: IdempotentOperationInput,
): Result<IdempotentOperationResult> {
  return withScriptLock(input.lock, () => {
    if (!isRequestId(input.requestId)) {
      return err(INVALID_REQUEST_ID);
    }

    const existing = findOperationRequest(input.operations, input.requestId);
    if (existing) {
      if (existing.operation_type !== input.operationType) {
        return err(REQUEST_CONFLICT);
      }
      if (existing.status !== OPERATION_COMPLETED) {
        return err(REQUEST_INCOMPLETE);
      }
      return ok({
        requestId: existing.request_id,
        resultEntityId: existing.result_entity_id,
        replayed: true,
        status: OPERATION_COMPLETED,
      });
    }

    const resultEntityId = input.createResultEntityId();
    const operationRow = serializeRecord(OPERATION_REQUESTS_SHEET.headers, {
      request_id: input.requestId,
      operation_type: input.operationType,
      result_entity_id: resultEntityId,
      status: OPERATION_COMPLETED,
      created_at: input.nowIso,
    });

    const applied = input.applyMutations([
      ...(input.extraMutations ?? []),
      {
        type: 'appendRows',
        sheetName: OPERATION_REQUESTS_SHEET.name,
        rows: [operationRow],
      },
    ]);
    if (!applied.ok) {
      return err(applied.error);
    }

    return ok({
      requestId: input.requestId,
      resultEntityId,
      replayed: false,
      status: OPERATION_COMPLETED,
    });
  });
}
