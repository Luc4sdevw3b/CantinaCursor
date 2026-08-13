import { describe, expect, it } from 'vitest';
import {
  applyBatchMutations,
  buildSpreadsheetBatchUpdate,
} from '../../src/server/sheets/batch';
import { createMemorySpreadsheet } from '../../src/server/sheets/memory-spreadsheet';

describe('spreadsheet batch builder', () => {
  it('builds appendCells requests for spreadsheets.batchUpdate', () => {
    const result = buildSpreadsheetBatchUpdate(
      [
        {
          type: 'appendRows',
          sheetName: '_operation_requests',
          rows: [['req-1', 'e2e.probe']],
        },
      ],
      { _operation_requests: 17 },
    );

    expect(result).toEqual({
      ok: true,
      data: {
        requests: [
          {
            appendCells: {
              sheetId: 17,
              rows: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'req-1' } },
                    { userEnteredValue: { stringValue: 'e2e.probe' } },
                  ],
                },
              ],
              fields: 'userEnteredValue',
            },
          },
        ],
      },
    });
  });

  it('refuses mutations for a missing sheet', () => {
    const result = buildSpreadsheetBatchUpdate(
      [{ type: 'appendRows', sheetName: '_missing', rows: [['x']] }],
      {},
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SHEET_NOT_FOUND');
    }
  });

  it('applies append mutations in one batch', () => {
    const { spreadsheet } = createMemorySpreadsheet();
    const sheet = spreadsheet.createSheet('_operation_requests');
    sheet.setHeaders(['request_id', 'operation_type']);

    const applied = applyBatchMutations(spreadsheet, [
      {
        type: 'appendRows',
        sheetName: '_operation_requests',
        rows: [
          ['a', 'one'],
          ['b', 'two'],
        ],
      },
    ]);

    expect(applied.ok).toBe(true);
    expect(sheet.listRows()).toEqual([
      ['a', 'one'],
      ['b', 'two'],
    ]);
  });
});
