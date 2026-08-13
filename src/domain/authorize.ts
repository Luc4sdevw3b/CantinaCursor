import {
  ACTION_ROLES,
  isUserRole,
  type AuthAction,
  type UserRole,
} from './auth';
import { err, ok, type Result } from './result';

export const UNAUTHENTICATED_ERROR = {
  code: 'UNAUTHENTICATED',
  message: 'Entre para continuar.',
  retryable: false,
} as const;

export const FORBIDDEN_ERROR = {
  code: 'FORBIDDEN',
  message: 'Esta ação não é permitida para o seu perfil.',
  retryable: false,
} as const;

export const SESSION_EXPIRED_ERROR = {
  code: 'SESSION_EXPIRED',
  message: 'A sessão expirou. Entre novamente.',
  retryable: false,
} as const;

export function authorize(role: unknown, action: AuthAction): Result<UserRole> {
  if (!isUserRole(role)) {
    return err(UNAUTHENTICATED_ERROR);
  }

  if (!ACTION_ROLES[action].includes(role)) {
    return err(FORBIDDEN_ERROR);
  }

  return ok(role);
}
