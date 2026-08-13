import { describe, expect, it } from 'vitest';
import { validateStudentProfile } from '../../src/domain/student-profile';

describe('student profile', () => {
  it('accepts birth date or approximate age, never both', () => {
    expect(
      validateStudentProfile({
        fullName: '  Ana   Souza ',
        birthDate: '2016-03-10',
      }),
    ).toEqual({
      ok: true,
      data: {
        full_name: 'Ana Souza',
        birth_date: '2016-03-10',
        approximate_age: '',
        approximate_age_reference_year: '',
      },
    });
    expect(
      validateStudentProfile({
        fullName: 'Ana Souza',
        approximateAge: 8,
        approximateAgeReferenceYear: 2026,
      }).ok,
    ).toBe(true);
  });

  it('refuses missing name, missing age and conflicting age fields', () => {
    expect(validateStudentProfile({ fullName: ' ' }).ok).toBe(false);
    expect(validateStudentProfile({ fullName: 'Ana Souza' }).ok).toBe(false);
    expect(
      validateStudentProfile({
        fullName: 'Ana Souza',
        birthDate: '2016-03-10',
        approximateAge: 8,
        approximateAgeReferenceYear: 2026,
      }).ok,
    ).toBe(false);
    expect(
      validateStudentProfile({
        fullName: 'Ana Souza',
        approximateAge: 8,
      }).ok,
    ).toBe(false);
  });
});
