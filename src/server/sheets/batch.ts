import { err, ok, type Result } from '../../domain/result';
import type { SpreadsheetPort } from './sheet-port';

export interface AppendRowsMutation {
  type: 'appendRows';
  sheetName: string;
  rows: string[][];
}

export type BatchMutation = AppendRowsMutation;

export interface AppendCellsRequest {
  appendCells: {
    sheetId: number;
    rows: Array<{
      values: Array<{ userEnteredValue: { stringValue: string } }>;
    }>;
    fields: 'userEnteredValue';
  };
}

export interface SpreadsheetBatchUpdate {
  requests: AppendCellsRequest[];
}

const SHEET_NOT_FOUND = {
  code: 'SHEET_NOT_FOUND',
  message: 'Aba necessária para o batch não existe.',
  retryable: false,
} as const;

export function buildSpreadsheetBatchUpdate(
  mutations: readonly BatchMutation[],
  sheetIds: Readonly<Record<string, number>>,
): Result<SpreadsheetBatchUpdate> {
  const requests: AppendCellsRequest[] = [];

  for (const mutation of mutations) {
    const sheetId = sheetIds[mutation.sheetName];
    if (sheetId === undefined) {
      return err(SHEET_NOT_FOUND);
    }

    requests.push({
      appendCells: {
        sheetId,
        rows: mutation.rows.map((row) => ({
          values: row.map((value) => ({
            userEnteredValue: { stringValue: value },
          })),
        })),
        fields: 'userEnteredValue',
      },
    });
  }

  return ok({ requests });
}

export function applyBatchMutations(
  spreadsheet: SpreadsheetPort,
  mutations: readonly BatchMutation[],
): Result<void> {
  for (const mutation of mutations) {
    const sheet = spreadsheet.getSheet(mutation.sheetName);
    if (!sheet) {
      return err(SHEET_NOT_FOUND);
    }
    for (const row of mutation.rows) {
      sheet.appendRow(row);
    }
  }

  return ok(undefined);
}
