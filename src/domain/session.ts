import { isImmutableId, isSheetRowNumber } from './ids';
import { SESSION_TTL_MS, isUserRole, type UserRole } from './auth';
import { SESSION_EXPIRED_ERROR, UNAUTHENTICATED_ERROR } from './authorize';
import { err, ok, type Result } from './result';

export interface SessionRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  expires_at: string;
  revoked: string;
}

export function sessionExpiresAt(
  createdAtIso: string,
  ttlMs = SESSION_TTL_MS,
): string {
  return new Date(Date.parse(createdAtIso) + ttlMs).toISOString();
}

export function resolveSession(
  records: readonly SessionRecord[],
  token: string | null | undefined,
  nowIso: string,
): Result<SessionRecord> {
  if (!token || isSheetRowNumber(token) || !isImmutableId(token)) {
    return err(UNAUTHENTICATED_ERROR);
  }

  const latest = [...records].reverse().find((record) => record.id === token);
  if (!latest || latest.revoked === 'true' || !isUserRole(latest.role)) {
    return err(UNAUTHENTICATED_ERROR);
  }

  if (Date.parse(latest.expires_at) <= Date.parse(nowIso)) {
    return err(SESSION_EXPIRED_ERROR);
  }

  return ok(latest);
}
