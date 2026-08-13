import { describe, expect, it } from 'vitest';
import {
  isDestructiveTestEnvironment,
  isEnvironment,
} from '../../src/domain/environment';

describe('environment', () => {
  it('accepts only the four named environments', () => {
    expect(isEnvironment('LOCAL')).toBe(true);
    expect(isEnvironment('DEV')).toBe(true);
    expect(isEnvironment('E2E')).toBe(true);
    expect(isEnvironment('PROD')).toBe(true);
    expect(isEnvironment('STAGE')).toBe(false);
    expect(isEnvironment(null)).toBe(false);
  });

  it('allows destructive automated tests only in E2E', () => {
    expect(isDestructiveTestEnvironment('E2E')).toBe(true);
    expect(isDestructiveTestEnvironment('PROD')).toBe(false);
    expect(isDestructiveTestEnvironment('DEV')).toBe(false);
    expect(isDestructiveTestEnvironment('LOCAL')).toBe(false);
  });
});
