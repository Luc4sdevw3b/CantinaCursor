import { describe, expect, it } from 'vitest';
import { err, ok } from '../../src/domain/result';

describe('Result', () => {
  it('wraps successful data', () => {
    expect(ok({ cents: 150 })).toEqual({
      ok: true,
      data: { cents: 150 },
    });
  });

  it('wraps a user-safe failure without a stack', () => {
    expect(
      err({
        code: 'HEALTH_UNAVAILABLE',
        message: 'Não foi possível verificar o ambiente.',
        retryable: true,
      }),
    ).toEqual({
      ok: false,
      error: {
        code: 'HEALTH_UNAVAILABLE',
        message: 'Não foi possível verificar o ambiente.',
        retryable: true,
      },
    });
  });
});
