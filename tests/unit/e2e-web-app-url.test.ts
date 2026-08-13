import { describe, expect, it } from 'vitest';
import {
  assertE2EWebAppUrl,
  isE2EWebAppUrl,
  isLoadedE2EWebAppUrl,
} from '../../src/server/e2e-web-app-url';

describe('E2E web app URL', () => {
  it('accepts only the Apps Script /exec URL', () => {
    expect(
      isE2EWebAppUrl(
        'https://script.google.com/macros/s/AKfycbzExampleDeployment/exec',
      ),
    ).toBe(true);
  });

  it('accepts the Google userHtml iframe host after load', () => {
    expect(
      isLoadedE2EWebAppUrl(
        'https://n-example-script.googleusercontent.com/userCodeAppPanel',
      ),
    ).toBe(true);
  });

  it('rejects documentation, editor and non-https URLs', () => {
    expect(isE2EWebAppUrl('https://developers.google.com/apps-script')).toBe(
      false,
    );
    expect(isE2EWebAppUrl('https://script.google.com/d/SCRIPT_ID/edit')).toBe(
      false,
    );
    expect(isE2EWebAppUrl('http://script.google.com/macros/s/x/exec')).toBe(
      false,
    );
  });

  it('throws a clear error when E2E_BASE_URL is set incorrectly', () => {
    expect(() =>
      assertE2EWebAppUrl('https://developers.google.com/apps-script'),
    ).toThrow('/macros/s/');
    expect(assertE2EWebAppUrl(undefined)).toBeUndefined();
  });
});
