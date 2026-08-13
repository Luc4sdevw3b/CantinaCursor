import { describe, expect, it } from 'vitest';
import {
  E2E_ONLY_ERROR,
  E2E_SEED_MARKER,
  RESET_PROD_FORBIDDEN_ERROR,
  resetE2EState,
  seedE2EState,
} from '../../src/domain/e2e-lifecycle';

describe('E2E lifecycle guards', () => {
  it.each(['LOCAL', 'DEV', null, undefined, ''] as const)(
    'refuses reset when environment is %s',
    (environment) => {
      expect(resetE2EState(environment)).toEqual({
        ok: false,
        error: E2E_ONLY_ERROR,
      });
    },
  );

  it('never resets PROD', () => {
    expect(resetE2EState('PROD')).toEqual({
      ok: false,
      error: RESET_PROD_FORBIDDEN_ERROR,
    });
  });

  it('resets only the isolated E2E environment', () => {
    expect(resetE2EState('E2E')).toEqual({
      ok: true,
      data: { reset: true },
    });
  });

  it('seeds only fictitious E2E data', () => {
    expect(seedE2EState('E2E')).toEqual({
      ok: true,
      data: { marker: E2E_SEED_MARKER, seeded: true },
    });
    expect(seedE2EState('PROD')).toEqual({
      ok: false,
      error: RESET_PROD_FORBIDDEN_ERROR,
    });
  });
});
