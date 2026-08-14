/** Manter a mesma chave no script inline de `index.html`. */
export const THEME_STORAGE_KEY = 'cantina.theme';

export function applyTheme(root: HTMLElement): void {
  root.dataset.themePreference = 'light';
  root.dataset.theme = 'light';
}
