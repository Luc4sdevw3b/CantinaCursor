const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createImmutableId(
  randomUUID: () => string = () => crypto.randomUUID(),
): string {
  return randomUUID();
}

export function isImmutableId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isSheetRowNumber(value: string | number): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0;
  }

  return /^[1-9]\d*$/.test(value);
}
