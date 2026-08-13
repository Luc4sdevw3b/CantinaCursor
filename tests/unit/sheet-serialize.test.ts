import { describe, expect, it } from 'vitest';
import { META_SHEET } from '../../src/server/sheets/schema';
import {
  checksumHeaders,
  deserializeRecord,
  serializeRecord,
  validateHeaders,
} from '../../src/server/sheets/serialize';

describe('sheet serialization', () => {
  it('validates versioned headers', () => {
    expect(validateHeaders(META_SHEET.headers, ['key', 'value'])).toEqual({
      ok: true,
      data: undefined,
    });
    expect(validateHeaders(META_SHEET.headers, ['id', 'value']).ok).toBe(false);
    expect(
      validateHeaders(META_SHEET.headers, ['key', 'value', 'extra']).ok,
    ).toBe(false);
  });

  it('round-trips records without using row numbers', () => {
    const record = { key: 'schema_version', value: '1' };
    const row = serializeRecord(META_SHEET.headers, record);
    expect(row).toEqual(['schema_version', '1']);
    expect(deserializeRecord(META_SHEET.headers, row)).toEqual(record);
  });

  it('checksums headers for migrations', () => {
    expect(checksumHeaders(META_SHEET.headers)).toBe('key|value');
  });
});
