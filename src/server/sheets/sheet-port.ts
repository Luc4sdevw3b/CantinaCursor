export interface SheetPort {
  readonly name: string;
  getHeaders(): string[];
  setHeaders(headers: readonly string[]): void;
  listRows(): string[][];
  appendRow(values: readonly string[]): void;
  hasData(): boolean;
}

export interface SpreadsheetPort {
  getSheet(name: string): SheetPort | null;
  createSheet(name: string): SheetPort;
}
