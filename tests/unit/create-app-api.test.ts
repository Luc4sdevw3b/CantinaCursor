import { describe, expect, it } from 'vitest';
import { createAppApi } from '../../src/web/shared/create-app-api';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';

describe('createAppApi', () => {
  it('uses FakeAppApi in local preview', () => {
    expect(createAppApi()).toBeInstanceOf(FakeAppApi);
  });
});
