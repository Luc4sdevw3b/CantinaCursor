import { err, ok, type Result } from '../../domain/result';
import type { SheetSchema } from './schema';
import { validateHeaders } from './serialize';
import type { SheetPort, SpreadsheetPort } from './sheet-port';

export function ensureSheet(
  spreadsheet: SpreadsheetPort,
  schema: SheetSchema,
): Result<SheetPort> {
  const existing = spreadsheet.getSheet(schema.name);
  const sheet = existing ?? spreadsheet.createSheet(schema.name);
  const headers = validateHeaders(schema.headers, sheet.getHeaders());

  if (headers.ok) {
    return ok(sheet);
  }

  if (existing?.hasData()) {
    return err(headers.error);
  }

  sheet.setHeaders(schema.headers);
  return ok(sheet);
}
