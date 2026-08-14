import { describe, expect, it } from 'vitest';
import { applyTheme } from '../../src/web/shared/theme';

describe('theme', () => {
  it('always applies the pastel light theme to the document root', () => {
    const root = { dataset: {} } as HTMLElement;

    applyTheme(root);

    expect(root.dataset.themePreference).toBe('light');
    expect(root.dataset.theme).toBe('light');
  });
});
