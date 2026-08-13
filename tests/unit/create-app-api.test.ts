import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/app-version';
import { createAppApi } from '../../src/web/shared/create-app-api';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';
import { GoogleScriptAppApi } from '../../src/web/shared/google-script-app-api';

describe('createAppApi', () => {
  it('uses FakeAppApi in local preview', () => {
    expect(createAppApi(undefined)).toBeInstanceOf(FakeAppApi);
  });

  it('uses GoogleScriptAppApi when google.script.run exists', () => {
    const runner = {
      withSuccessHandler() {
        return runner;
      },
      withFailureHandler() {
        return runner;
      },
      getHealth() {},
    };

    expect(createAppApi({ script: { run: runner } })).toBeInstanceOf(
      GoogleScriptAppApi,
    );
  });
});

describe('GoogleScriptAppApi', () => {
  it('returns typed health from Apps Script without leaking extra fields', async () => {
    const runner = {
      withSuccessHandler(handler: (value: unknown) => void) {
        handler({
          appName: APP_NAME,
          version: APP_VERSION,
          environment: 'E2E',
          status: 'ready',
          adapter: 'google-script',
          spreadsheetConfigured: true,
          spreadsheetId: 'should-not-be-required',
        });
        return runner;
      },
      withFailureHandler() {
        return runner;
      },
      getHealth() {},
    };

    const health = await new GoogleScriptAppApi(runner).getHealth();
    expect(health.environment).toBe('E2E');
    expect(health.adapter).toBe('google-script');
    expect(health).not.toHaveProperty('spreadsheetId');
  });
});
