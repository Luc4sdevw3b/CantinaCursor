import { err, ok, type Result } from '../../domain/result';

export function checksumHeaders(headers: readonly string[]): string {
  return headers.join('|');
}

const HEADER_MISMATCH = {
  code: 'HEADER_MISMATCH',
  message: 'Cabeçalho da planilha não confere com o schema.',
  retryable: false,
} as const;

export function validateHeaders(
  expected: readonly string[],
  actual: readonly unknown[],
): Result<void> {
  for (let index = 0; index < expected.length; index += 1) {
    if (String(actual[index] ?? '') !== expected[index]) {
      return err(HEADER_MISMATCH);
    }
  }

  for (let index = expected.length; index < actual.length; index += 1) {
    if (String(actual[index] ?? '') !== '') {
      return err(HEADER_MISMATCH);
    }
  }

  return ok(undefined);
}

export function serializeRecord(
  headers: readonly string[],
  record: Record<string, string>,
): string[] {
  return headers.map((header) => record[header] ?? '');
}

export function deserializeRecord(
  headers: readonly string[],
  row: readonly unknown[],
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [index, header] of headers.entries()) {
    record[header] = String(row[index] ?? '');
  }
  return record;
}
