export const DEFAULT_SAFETY_API_UPSTREAM_BASE_URL = 'http://35.76.230.177:8011/api/v1';
const SERVER_UPSTREAM_BASE_URL_ENV_KEYS = [
  'SAFETY_API_UPSTREAM_BASE_URL',
  'SAFETY_API_BASE_URL',
] as const;
const PUBLIC_UPSTREAM_BASE_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL',
  'NEXT_PUBLIC_SAFETY_API_BASE_URL',
] as const;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getSafetyApiUpstreamBaseUrl(): string {
  for (const envKey of SERVER_UPSTREAM_BASE_URL_ENV_KEYS) {
    const serverConfigured = process.env[envKey]?.trim();
    if (serverConfigured && isAbsoluteHttpUrl(serverConfigured)) {
      return normalizeBaseUrl(serverConfigured);
    }
  }

  for (const envKey of PUBLIC_UPSTREAM_BASE_URL_ENV_KEYS) {
    const publicConfigured = process.env[envKey]?.trim();
    if (publicConfigured && isAbsoluteHttpUrl(publicConfigured)) {
      return normalizeBaseUrl(publicConfigured);
    }
  }

  return DEFAULT_SAFETY_API_UPSTREAM_BASE_URL;
}
