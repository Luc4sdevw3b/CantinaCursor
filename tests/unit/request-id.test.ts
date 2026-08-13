import { describe, expect, it } from 'vitest';
import { createRequestId, isRequestId } from '../../src/domain/request-id';
import { isSheetRowNumber } from '../../src/domain/ids';

describe('request_id', () => {
  it('creates UUID request identifiers', () => {
    const requestId = createRequestId(
      () => 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    );
    expect(isRequestId(requestId)).toBe(true);
  });

  it('rejects sheet row numbers', () => {
    expect(isRequestId('2')).toBe(false);
    expect(isSheetRowNumber('2')).toBe(true);
  });
});
