import { describe, expect, it } from 'vitest';
import {
  applyTheme,
  isThemePreference,
  resolveTheme,
} from '../../src/web/shared/theme';

describe('theme', () => {
  it.each([
    ['system', false, 'light'],
    ['system', true, 'dark'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)(
    'resolves %s with system dark=%s as %s',
    (preference, systemDark, expected) => {
      expect(resolveTheme(preference, systemDark)).toBe(expected);
    },
  );

  it('accepts only supported preferences', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it('applies preference and resolved theme to the document root', () => {
    const root = { dataset: {} } as HTMLElement;

    applyTheme(root, 'system', true);

    expect(root.dataset.themePreference).toBe('system');
    expect(root.dataset.theme).toBe('dark');
  });
});
