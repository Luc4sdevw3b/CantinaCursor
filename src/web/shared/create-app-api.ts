import type { AppApi } from './app-api';
import { FakeAppApi } from './fake-app-api';

/** Preview e E2E local usam somente FakeAppApi. Sem google.script.run. */
export function createAppApi(): AppApi {
  return new FakeAppApi();
}
