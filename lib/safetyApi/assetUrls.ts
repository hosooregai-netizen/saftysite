import { buildSafetyApiUrl, DEFAULT_SAFETY_API_BASE_URL } from './config';
import { DEFAULT_SAFETY_API_UPSTREAM_BASE_URL } from './upstream';

const SAFETY_ASSET_BASE_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SAFETY_ASSET_BASE_URL',
] as const;
const SAFETY_PUBLIC_UPSTREAM_BASE_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL',
  'NEXT_PUBLIC_SAFETY_API_BASE_URL',
] as const;
const SAFETY_UPLOADS_PATH_PREFIX = '/uploads/';
const SAFETY_PROXY_UPLOADS_PATH_PREFIX = `${DEFAULT_SAFETY_API_BASE_URL}${SAFETY_UPLOADS_PATH_PREFIX}`;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function hasNonProxyLocalScheme(value: string): boolean {
  return /^data:/i.test(value) || /^blob:/i.test(value);
}

function buildPathWithSearchAndHash(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

function toAbsoluteOrigin(value: string): string | null {
  if (!isAbsoluteHttpUrl(value)) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function extractSafetyAssetPath(value: string): string | null {
  if (value.startsWith(SAFETY_PROXY_UPLOADS_PATH_PREFIX)) {
    return value.slice(DEFAULT_SAFETY_API_BASE_URL.length);
  }

  if (value.startsWith(SAFETY_UPLOADS_PATH_PREFIX)) {
    return value;
  }

  return null;
}

export function getSafetyAssetBaseUrl(): string | null {
  for (const envKey of SAFETY_ASSET_BASE_URL_ENV_KEYS) {
    const configured = process.env[envKey]?.trim();
    if (configured?.startsWith('/') || (configured && isAbsoluteHttpUrl(configured))) {
      return normalizeBaseUrl(configured);
    }
  }

  for (const envKey of SAFETY_PUBLIC_UPSTREAM_BASE_URL_ENV_KEYS) {
    const configured = process.env[envKey]?.trim();
    const origin = configured ? toAbsoluteOrigin(configured) : null;
    if (origin) {
      return normalizeBaseUrl(origin);
    }
  }

  return normalizeBaseUrl(new URL(DEFAULT_SAFETY_API_UPSTREAM_BASE_URL).origin);
}

export function getSafetyAssetPath(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || hasNonProxyLocalScheme(normalized)) return null;

  const directPath = extractSafetyAssetPath(normalized);
  if (directPath) return directPath;

  if (!isAbsoluteHttpUrl(normalized)) return null;

  try {
    const parsed = new URL(normalized);
    return extractSafetyAssetPath(buildPathWithSearchAndHash(parsed));
  } catch {
    return null;
  }
}

export function buildSafetyAssetUrl(path: string): string {
  const normalizedPath = getSafetyAssetPath(path) ?? path.trim();
  if (!normalizedPath.startsWith(SAFETY_UPLOADS_PATH_PREFIX)) {
    return path.trim();
  }

  const assetBaseUrl = getSafetyAssetBaseUrl();
  if (assetBaseUrl) {
    return `${assetBaseUrl}${normalizedPath}`;
  }

  return buildSafetyApiUrl(normalizedPath);
}

export function normalizeSafetyAssetUrl(value: string): string {
  const normalized = value.trim();
  if (!normalized || hasNonProxyLocalScheme(normalized)) {
    return normalized;
  }

  const assetPath = getSafetyAssetPath(normalized);
  if (!assetPath) {
    return normalized;
  }

  if (normalized.startsWith(SAFETY_PROXY_UPLOADS_PATH_PREFIX)) {
    return buildSafetyAssetUrl(assetPath);
  }

  if (normalized.startsWith(SAFETY_UPLOADS_PATH_PREFIX)) {
    return buildSafetyAssetUrl(assetPath);
  }

  if (!isAbsoluteHttpUrl(normalized)) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.pathname.startsWith(SAFETY_PROXY_UPLOADS_PATH_PREFIX)) {
      return buildSafetyAssetUrl(assetPath);
    }

    if (parsed.pathname.startsWith(SAFETY_UPLOADS_PATH_PREFIX)) {
      return normalized;
    }
  } catch {
    return normalized;
  }

  return normalized;
}

export function shouldUseSafetyAssetDownloadAttribute(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (hasNonProxyLocalScheme(normalized)) return true;
  return !isAbsoluteHttpUrl(normalized);
}

export function shouldOpenSafetyAssetInNewTab(value: string): boolean {
  const normalized = value.trim();
  return isAbsoluteHttpUrl(normalized);
}

export function getSafetyAssetTransportWarning(
  value: string,
  pageProtocol?: string | null,
): string | null {
  if (pageProtocol !== 'https:') return null;
  return /^http:\/\//i.test(value.trim())
    ? 'HTTPS 배포에서는 이 파일이 브라우저에서 차단될 수 있습니다. HTTPS 자산 도메인을 연결하면 가장 안정적입니다.'
    : null;
}
