import { civilYear, isCivilDate } from './civil-date';
import { err, ok, type Result } from './result';

export const INVALID_BIRTH_DATE_ERROR = {
  code: 'INVALID_BIRTH_DATE',
  message: 'A data de nascimento precisa ser uma data civil válida.',
  retryable: false,
} as const;

export function ageFromBirthDate(
  birthDate: string,
  todayCivil: string,
): number {
  const birthYear = Number(birthDate.slice(0, 4));
  const birthMonth = Number(birthDate.slice(5, 7));
  const birthDay = Number(birthDate.slice(8, 10));
  const todayYear = Number(todayCivil.slice(0, 4));
  const todayMonth = Number(todayCivil.slice(5, 7));
  const todayDay = Number(todayCivil.slice(8, 10));
  let age = todayYear - birthYear;
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export function approximateAgeAt(
  age: number,
  referenceYear: number,
  currentYear: number,
): number {
  return Math.max(age + (currentYear - referenceYear), 0);
}

export function formatAgeLabel(years: number, approximate: boolean): string {
  return approximate ? `~${years}` : String(years);
}

export function studentAgeLabel(input: {
  birthDate: string;
  approximateAge: string;
  approximateAgeReferenceYear: string;
  todayCivil: string;
}): Result<string> {
  if (input.birthDate) {
    if (!isCivilDate(input.birthDate) || !isCivilDate(input.todayCivil)) {
      return err(INVALID_BIRTH_DATE_ERROR);
    }
    return ok(
      formatAgeLabel(
        ageFromBirthDate(input.birthDate, input.todayCivil),
        false,
      ),
    );
  }

  const age = Number(input.approximateAge);
  const referenceYear = Number(input.approximateAgeReferenceYear);
  if (
    !Number.isInteger(age) ||
    !Number.isInteger(referenceYear) ||
    !isCivilDate(input.todayCivil)
  ) {
    return err({
      code: 'INVALID_APPROXIMATE_AGE',
      message: 'Informe idade aproximada e o ano de referência.',
      retryable: false,
    });
  }

  return ok(
    formatAgeLabel(
      approximateAgeAt(age, referenceYear, civilYear(input.todayCivil)),
      true,
    ),
  );
}

export function studentAgeYears(input: {
  birthDate: string;
  approximateAge: string;
  approximateAgeReferenceYear: string;
  todayCivil: string;
}): Result<number> {
  const label = studentAgeLabel(input);
  if (!label.ok) {
    return err(label.error);
  }
  return ok(Number(label.data.replace('~', '')));
}

export const DEFAULT_REQUIRE_GUARDIAN_BELOW_AGE = 18;

export function needsGuardian(
  ageYears: number,
  requireBelowAge: number,
  hasPrimaryGuardian: boolean,
): boolean {
  return ageYears < requireBelowAge && !hasPrimaryGuardian;
}
