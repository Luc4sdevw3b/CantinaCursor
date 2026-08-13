export const THEMES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEMES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export function isThemePreference(
  value: string | null,
): value is ThemePreference {
  return THEMES.some((theme) => theme === value);
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  return preference === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : preference;
}

export function applyTheme(
  root: HTMLElement,
  preference: ThemePreference,
  systemPrefersDark: boolean,
): void {
  root.dataset.themePreference = preference;
  root.dataset.theme = resolveTheme(preference, systemPrefersDark);
}
