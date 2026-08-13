import { err, ok, type Result } from './result';

export const REACTIVATION_REVIEW_REQUIRED_ERROR = {
  code: 'REACTIVATION_REVIEW_REQUIRED',
  message: 'Revise o cadastro antes de reativar.',
  retryable: false,
} as const;

export const STUDENT_ALREADY_ACTIVE_ERROR = {
  code: 'STUDENT_ALREADY_ACTIVE',
  message: 'Este aluno já está ativo.',
  retryable: false,
} as const;

export const STUDENT_ALREADY_INACTIVE_ERROR = {
  code: 'STUDENT_ALREADY_INACTIVE',
  message: 'Este aluno já está inativo.',
  retryable: false,
} as const;

export function canReactivate(
  active: boolean,
  reviewed: unknown,
): Result<void> {
  if (active) {
    return err(STUDENT_ALREADY_ACTIVE_ERROR);
  }
  if (reviewed !== true) {
    return err(REACTIVATION_REVIEW_REQUIRED_ERROR);
  }
  return ok(undefined);
}

export function canDeactivate(active: boolean): Result<void> {
  if (!active) {
    return err(STUDENT_ALREADY_INACTIVE_ERROR);
  }
  return ok(undefined);
}
