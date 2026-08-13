import { isCivilDate } from './civil-date';
import { normalizePersonName } from './person-name';
import { err, ok, type Result } from './result';

export interface StudentProfileInput {
  fullName: unknown;
  birthDate?: unknown;
  approximateAge?: unknown;
  approximateAgeReferenceYear?: unknown;
}

export interface StudentProfile {
  full_name: string;
  birth_date: string;
  approximate_age: string;
  approximate_age_reference_year: string;
}

export const STUDENT_NAME_REQUIRED_ERROR = {
  code: 'STUDENT_NAME_REQUIRED',
  message: 'Informe o nome completo do aluno.',
  retryable: false,
} as const;

export const STUDENT_AGE_REQUIRED_ERROR = {
  code: 'STUDENT_AGE_REQUIRED',
  message: 'Informe a data de nascimento ou a idade aproximada com o ano.',
  retryable: false,
} as const;

export const STUDENT_AGE_CONFLICT_ERROR = {
  code: 'STUDENT_AGE_CONFLICT',
  message: 'Use nascimento ou idade aproximada, não os dois.',
  retryable: false,
} as const;

export const INVALID_APPROXIMATE_AGE_ERROR = {
  code: 'INVALID_APPROXIMATE_AGE',
  message: 'Informe idade aproximada e o ano de referência.',
  retryable: false,
} as const;

export const INVALID_BIRTH_DATE_ERROR = {
  code: 'INVALID_BIRTH_DATE',
  message: 'A data de nascimento precisa ser uma data civil válida.',
  retryable: false,
} as const;

function empty(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

export function validateStudentProfile(
  input: StudentProfileInput,
): Result<StudentProfile> {
  const fullName =
    typeof input.fullName === 'string'
      ? normalizePersonName(input.fullName)
      : '';
  if (fullName.length < 2) {
    return err(STUDENT_NAME_REQUIRED_ERROR);
  }

  const hasBirth = !empty(input.birthDate);
  const hasAge = !empty(input.approximateAge);
  const hasYear = !empty(input.approximateAgeReferenceYear);

  if (hasBirth && (hasAge || hasYear)) {
    return err(STUDENT_AGE_CONFLICT_ERROR);
  }
  if (!hasBirth && !hasAge && !hasYear) {
    return err(STUDENT_AGE_REQUIRED_ERROR);
  }
  if (!hasBirth && hasAge !== hasYear) {
    return err(INVALID_APPROXIMATE_AGE_ERROR);
  }

  if (hasBirth) {
    const birthDate = String(input.birthDate).trim();
    if (!isCivilDate(birthDate)) {
      return err(INVALID_BIRTH_DATE_ERROR);
    }
    return ok({
      full_name: fullName,
      birth_date: birthDate,
      approximate_age: '',
      approximate_age_reference_year: '',
    });
  }

  const age = Number(input.approximateAge);
  const year = Number(input.approximateAgeReferenceYear);
  if (
    !Number.isInteger(age) ||
    age < 0 ||
    age > 120 ||
    !Number.isInteger(year) ||
    year < 1990 ||
    year > 2100
  ) {
    return err(INVALID_APPROXIMATE_AGE_ERROR);
  }

  return ok({
    full_name: fullName,
    birth_date: '',
    approximate_age: String(age),
    approximate_age_reference_year: String(year),
  });
}
