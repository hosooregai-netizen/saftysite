export const DEFAULT_SAFETY_API_BASE_URL = '/api/safety';
export const SAFETY_AUTH_TOKEN_KEY = 'safety-api-access-token';
const PUBLIC_PROXY_BASE_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SAFETY_API_PROXY_BASE_URL',
  'NEXT_PUBLIC_SAFETY_API_BASE_URL',
] as const;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getSafetyApiBaseUrl(): string {
  for (const envKey of PUBLIC_PROXY_BASE_URL_ENV_KEYS) {
    const configured = process.env[envKey]?.trim();
    if (configured?.startsWith('/') || (configured && isAbsoluteHttpUrl(configured))) {
      return normalizeBaseUrl(configured);
    }
  }

  return DEFAULT_SAFETY_API_BASE_URL;
}

export function getSafetyApiProxyBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SAFETY_API_PROXY_BASE_URL?.trim();
  if (configured?.startsWith('/') || (configured && isAbsoluteHttpUrl(configured))) {
    return normalizeBaseUrl(configured);
  }

  return DEFAULT_SAFETY_API_BASE_URL;
}

export function buildSafetyApiUrl(path: string): string {
  const baseUrl = getSafetyApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function buildSafetyApiProxyUrl(path: string): string {
  const baseUrl = getSafetyApiProxyBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
