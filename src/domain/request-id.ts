import { createImmutableId, isImmutableId, isSheetRowNumber } from './ids';

export function createRequestId(
  randomUUID: () => string = () => crypto.randomUUID(),
): string {
  return createImmutableId(randomUUID);
}

export function isRequestId(value: string): boolean {
  return isImmutableId(value) && !isSheetRowNumber(value);
}
