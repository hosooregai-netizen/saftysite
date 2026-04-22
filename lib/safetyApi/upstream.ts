export const DEFAULT_SAFETY_API_UPSTREAM_BASE_URL = 'http://52.64.85.49:8011/api/v1';
const SERVER_UPSTREAM_BASE_URL_ENV_KEYS = [
  'SAFETY_API_UPSTREAM_BASE_URL',
  'SAFETY_API_BASE_URL',
] as const;
const PUBLIC_UPSTREAM_BASE_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL',
  'NEXT_PUBLIC_SAFETY_API_BASE_URL',
] as const;
const NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL =
  process.env.NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL?.trim() || '';
const NEXT_PUBLIC_SAFETY_API_BASE_URL =
  process.env.NEXT_PUBLIC_SAFETY_API_BASE_URL?.trim() || '';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function readPublicConfiguredUpstreamBaseUrl(): string | null {
  for (const candidate of [
    NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL,
    NEXT_PUBLIC_SAFETY_API_BASE_URL,
  ]) {
    if (candidate && isAbsoluteHttpUrl(candidate)) {
      return normalizeBaseUrl(candidate);
    }
  }

  return null;
}

export function getPublicSafetyApiUpstreamBaseUrl(): string | null {
  return readPublicConfiguredUpstreamBaseUrl();
}

export function buildPublicSafetyApiUpstreamUrl(path: string): string | null {
  const publicUpstreamBaseUrl = getPublicSafetyApiUpstreamBaseUrl();
  if (!publicUpstreamBaseUrl) {
    return null;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  return new URL(normalizedPath, `${publicUpstreamBaseUrl}/`).toString();
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

  const publicUpstreamBaseUrl = readPublicConfiguredUpstreamBaseUrl();
  if (publicUpstreamBaseUrl) {
    return publicUpstreamBaseUrl;
  }

  return DEFAULT_SAFETY_API_UPSTREAM_BASE_URL;
}
