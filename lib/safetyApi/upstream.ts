const DEFAULT_SAFETY_API_UPSTREAM_BASE_URL = 'http://35.76.230.177:8011/api/v1';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getSafetyApiUpstreamBaseUrl(): string {
  const serverConfigured = process.env.SAFETY_API_BASE_URL?.trim();
  if (serverConfigured && isAbsoluteHttpUrl(serverConfigured)) {
    return normalizeBaseUrl(serverConfigured);
  }

  const publicConfigured = process.env.NEXT_PUBLIC_SAFETY_API_BASE_URL?.trim();
  if (publicConfigured && isAbsoluteHttpUrl(publicConfigured)) {
    return normalizeBaseUrl(publicConfigured);
  }

  return DEFAULT_SAFETY_API_UPSTREAM_BASE_URL;
}
