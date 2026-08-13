import { describe, expect, it } from 'vitest';
import { createImmutableId } from '../../src/domain/ids';
import { createSheetRepository } from '../../src/server/repositories/sheet-repository';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';
import type { SheetSchema } from '../../src/server/sheets/schema';

const SAMPLE_SHEET: SheetSchema = {
  name: '_sample_records',
  headers: ['id', 'label'],
};

describe('sheet repository', () => {
  it('stores and finds records by UUID, never by row number', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const sheet = spreadsheet.createSheet(SAMPLE_SHEET.name);
    sheet.setHeaders(SAMPLE_SHEET.headers);
    const repository = createSheetRepository(SAMPLE_SHEET, sheet);
    const id = createImmutableId(() => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');

    expect(repository.append({ id, label: 'fictício' })).toEqual({
      ok: true,
      data: undefined,
    });
    expect(repository.findById(id)).toEqual({
      ok: true,
      data: { id, label: 'fictício' },
    });
    expect(repository.findById('2').ok).toBe(false);
    expect(repository.append({ id: '3', label: 'linha' }).ok).toBe(false);
    expect(repository.list()).toEqual({
      ok: true,
      data: [{ id, label: 'fictício' }],
    });
  });
});
