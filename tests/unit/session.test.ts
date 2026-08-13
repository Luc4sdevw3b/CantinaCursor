import { describe, expect, it } from 'vitest';
import { resolveSession, sessionExpiresAt } from '../../src/domain/session';

const TOKEN = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const NOW = '2026-08-13T12:00:00.000Z';

function session(
  overrides: Partial<{
    id: string;
    user_id: string;
    role: 'owner' | 'staff';
    created_at: string;
    expires_at: string;
    revoked: string;
  }> = {},
) {
  return {
    id: TOKEN,
    user_id: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
    role: 'owner' as const,
    created_at: '2026-08-13T10:00:00.000Z',
    expires_at: '2026-08-13T18:00:00.000Z',
    revoked: 'false',
    ...overrides,
  };
}

describe('resolveSession', () => {
  it('accepts the latest matching UUID session', () => {
    const result = resolveSession(
      [
        session({ revoked: 'true' }),
        session({ role: 'staff', revoked: 'false' }),
      ],
      TOKEN,
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      data: session({ role: 'staff', revoked: 'false' }),
    });
  });

  it('rejects missing, row-number and revoked tokens', () => {
    expect(resolveSession([session()], null, NOW).ok).toBe(false);
    expect(resolveSession([session()], '2', NOW).ok).toBe(false);
    expect(resolveSession([session({ revoked: 'true' })], TOKEN, NOW)).toEqual({
      ok: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Entre para continuar.',
        retryable: false,
      },
    });
  });

  it('rejects expired sessions', () => {
    const result = resolveSession(
      [session({ expires_at: '2026-08-13T11:00:00.000Z' })],
      TOKEN,
      NOW,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SESSION_EXPIRED');
    }
  });

  it('computes expiry from TTL', () => {
    expect(
      sessionExpiresAt('2026-08-13T10:00:00.000Z', 8 * 60 * 60 * 1000),
    ).toBe('2026-08-13T18:00:00.000Z');
  });
});
