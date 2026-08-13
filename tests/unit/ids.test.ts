import { describe, expect, it } from 'vitest';
import {
  createImmutableId,
  isImmutableId,
  isSheetRowNumber,
} from '../../src/domain/ids';

describe('immutable IDs', () => {
  it('creates UUID identifiers', () => {
    const id = createImmutableId(() => '11111111-1111-4111-8111-111111111111');
    expect(isImmutableId(id)).toBe(true);
  });

  it('rejects sheet row numbers as identity', () => {
    expect(isSheetRowNumber(2)).toBe(true);
    expect(isSheetRowNumber('2')).toBe(true);
    expect(isImmutableId('2')).toBe(false);
    expect(isImmutableId('row-2')).toBe(false);
  });
});
