export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function personNameKey(value: string): string {
  return normalizePersonName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function markHomonyms<T extends { id: string; fullName: string }>(
  items: readonly T[],
): Array<T & { isHomonym: boolean }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = personNameKey(item.fullName);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return items.map((item) => ({
    ...item,
    isHomonym: (counts.get(personNameKey(item.fullName)) ?? 0) > 1,
  }));
}
