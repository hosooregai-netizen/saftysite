export const DEFAULT_SAFETY_API_BASE_URL = 'http://35.76.230.177:8011/api/v1';
export const SAFETY_AUTH_TOKEN_KEY = 'safety-api-access-token';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getSafetyApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SAFETY_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  return DEFAULT_SAFETY_API_BASE_URL;
}

export function buildSafetyApiUrl(path: string): string {
  const baseUrl = getSafetyApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
