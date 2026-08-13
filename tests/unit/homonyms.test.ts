import { describe, expect, it } from 'vitest';
import { markHomonyms } from '../../src/domain/person-name';

describe('homonyms', () => {
  it('keeps separate ids when two students share a name', () => {
    const marked = markHomonyms([
      { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001', fullName: 'Ana Souza' },
      { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002', fullName: 'Ana  Souza' },
      { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003', fullName: 'Bruno Lima' },
    ]);

    expect(marked.filter((item) => item.isHomonym)).toHaveLength(2);
    expect(marked.map((item) => item.id)).toEqual([
      'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',
      'aaaaaaaa-bbbb-4ccc-8ddd-000000000002',
      'aaaaaaaa-bbbb-4ccc-8ddd-000000000003',
    ]);
    expect(
      marked.find((item) => item.fullName === 'Bruno Lima')?.isHomonym,
    ).toBe(false);
  });
});
