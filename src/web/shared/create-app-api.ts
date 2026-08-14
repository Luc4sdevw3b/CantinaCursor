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
        recordClientCall(property);
        return value.apply(target, args);
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
