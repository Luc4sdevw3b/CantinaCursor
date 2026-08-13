import type { AppApi } from './app-api';
import { FakeAppApi } from './fake-app-api';

export function createAppApi(): AppApi {
  return new FakeAppApi();
}
