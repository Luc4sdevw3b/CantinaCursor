import type { AppApi } from './app-api';
import { FakeAppApi } from './fake-app-api';
import {
  GoogleScriptAppApi,
  type GoogleScriptRunner,
} from './google-script-app-api';

interface GoogleScriptHost {
  script?: { run?: GoogleScriptRunner };
}

/** Preview/E2E local: FakeAppApi. Web App Apps Script: google.script.run. */
export function createAppApi(
  host: GoogleScriptHost | undefined = globalThis.google,
): AppApi {
  const runner = host?.script?.run;
  return runner ? new GoogleScriptAppApi(runner) : new FakeAppApi();
}
