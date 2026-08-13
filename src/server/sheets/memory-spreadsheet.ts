import type { SheetPort, SpreadsheetPort } from './sheet-port';

export class MemorySheet implements SheetPort {
  readonly rows: string[][] = [];

  constructor(readonly name: string) {}

  getHeaders(): string[] {
    return [...(this.rows[0] ?? [])];
  }

  setHeaders(headers: readonly string[]): void {
    const next = [...headers];
    if (this.rows.length === 0) {
      this.rows.push(next);
      return;
    }
    this.rows[0] = next;
  }

  listRows(): string[][] {
    return this.rows.slice(1).map((row) => [...row]);
  }

  appendRow(values: readonly string[]): void {
    this.rows.push([...values]);
  }

  hasData(): boolean {
    return this.rows.length > 1;
  }
}

export function createMemorySpreadsheet(): {
  sheets: Map<string, MemorySheet>;
  spreadsheet: SpreadsheetPort;
} {
  const sheets = new Map<string, MemorySheet>();

  return {
    sheets,
    spreadsheet: {
      getSheet: (name) => sheets.get(name) ?? null,
      createSheet: (name) => {
        const sheet = new MemorySheet(name);
        sheets.set(name, sheet);
        return sheet;
      },
    },
  };
}
