import type { GoogleScriptRunner } from './web/shared/google-script-app-api';

declare global {
  var google: { script?: { run?: GoogleScriptRunner } } | undefined;
}

export {};
