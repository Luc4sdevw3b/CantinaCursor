import { describe, expect, it } from 'vitest';
import {
  ageFromBirthDate,
  approximateAgeAt,
  formatAgeLabel,
  studentAgeLabel,
} from '../../src/domain/age';

describe('student age', () => {
  it('computes age from birth date and keeps ~ on approximate age', () => {
    expect(ageFromBirthDate('2016-03-10', '2026-08-13')).toBe(10);
    expect(ageFromBirthDate('2016-08-14', '2026-08-13')).toBe(9);
    expect(approximateAgeAt(8, 2026, 2027)).toBe(9);
    expect(formatAgeLabel(8, true)).toBe('~8');
    expect(
      studentAgeLabel({
        birthDate: '',
        approximateAge: '8',
        approximateAgeReferenceYear: '2026',
        todayCivil: '2026-08-13',
      }),
    ).toEqual({ ok: true, data: '~8' });
  });
});
