import { isImmutableId, isSheetRowNumber } from '../../domain/ids';
import { err, ok, type Result } from '../../domain/result';
import type { SheetSchema } from '../sheets/schema';
import {
  deserializeRecord,
  serializeRecord,
  validateHeaders,
} from '../sheets/serialize';
import type { SheetPort } from '../sheets/sheet-port';

const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

export function createSheetRepository(schema: SheetSchema, sheet: SheetPort) {
  function assertHeaders(): Result<void> {
    return validateHeaders(schema.headers, sheet.getHeaders());
  }

  function assertImmutableId(id: string): Result<void> {
    if (isSheetRowNumber(id) || !isImmutableId(id)) {
      return err(INVALID_ID_ERROR);
    }
    return ok(undefined);
  }

  return {
    append(record: Record<string, string>): Result<void> {
      const headers = assertHeaders();
      if (!headers.ok) {
        return err(headers.error);
      }

      if (schema.headers.includes('id')) {
        const id = assertImmutableId(record.id ?? '');
        if (!id.ok) {
          return err(id.error);
        }
      }

      sheet.appendRow(serializeRecord(schema.headers, record));
      return ok(undefined);
    },

    list(): Result<Record<string, string>[]> {
      const headers = assertHeaders();
      if (!headers.ok) {
        return err(headers.error);
      }

      return ok(
        sheet.listRows().map((row) => deserializeRecord(schema.headers, row)),
      );
    },

    findById(id: string): Result<Record<string, string> | null> {
      const validId = assertImmutableId(id);
      if (!validId.ok) {
        return err(validId.error);
      }

      const records = this.list();
      if (!records.ok) {
        return err(records.error);
      }

      return ok(records.data.find((record) => record.id === id) ?? null);
    },
  };
}
