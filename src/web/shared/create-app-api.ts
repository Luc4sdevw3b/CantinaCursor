import type { AppApi } from './app-api';
import { FakeAppApi } from './fake-app-api';
import {
  GoogleScriptAppApi,
  type GoogleScriptRunner,
} from './google-script-app-api';
import { recordClientCall } from './perf';

interface GoogleScriptHost {
  script?: { run?: GoogleScriptRunner };
}

function instrumentAppApi(api: AppApi): AppApi {
  return new Proxy(api, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function' || typeof property !== 'string') {
        return value;
      }
      return (...args: unknown[]) => {
        const startedAt = Date.now();
        const finish = () => recordClientCall(property, Date.now() - startedAt);
        try {
          const result = value.apply(target, args) as unknown;
          if (
            result &&
            typeof (result as Promise<unknown>).then === 'function'
          ) {
            return (result as Promise<unknown>).finally(finish);
          }
          finish();
          return result;
        } catch (error) {
          finish();
          throw error;
        }
      };
    },
  });
}

/** Preview/E2E local: FakeAppApi. Web App Apps Script: google.script.run. */
export function createAppApi(
  host: GoogleScriptHost | undefined = globalThis.google,
): AppApi {
  const runner = host?.script?.run;
  const api = runner ? new GoogleScriptAppApi(runner) : new FakeAppApi();
  return instrumentAppApi(api);
}
