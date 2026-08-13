export function isE2EWebAppUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      url.pathname.includes('/macros/s/') &&
      url.pathname.endsWith('/exec')
    );
  } catch {
    return false;
  }
}

export function isLoadedE2EWebAppUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.hostname.endsWith('.googleusercontent.com')) {
      return true;
    }

    return isE2EWebAppUrl(`${url.origin}${url.pathname}`);
  } catch {
    return false;
  }
}

export function assertE2EWebAppUrl(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (!isE2EWebAppUrl(value)) {
    throw new Error(
      'E2E_BASE_URL deve ser a URL do Web App E2E (.../macros/s/<id>/exec). Não use a documentação, o editor nem PROD.',
    );
  }

  return value;
}
