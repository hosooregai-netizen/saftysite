import { buildSafetyApiUrl, DEFAULT_SAFETY_API_BASE_URL } from './config';
import {
  DEFAULT_SAFETY_API_UPSTREAM_BASE_URL,
  getPublicSafetyApiUpstreamBaseUrl,
} from './upstream';

const SAFETY_ASSET_BASE_URL_ENV_KEYS = ['NEXT_PUBLIC_SAFETY_ASSET_BASE_URL'] as const;
const SAFETY_PUBLIC_UPSTREAM_BASE_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL',
  'NEXT_PUBLIC_SAFETY_API_BASE_URL',
] as const;
const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const PASSTHROUGH_URL_PATTERN = /^(?:data|blob):/i;
const SAFETY_UPLOADS_PATH_PREFIX = '/uploads/';
const SAFETY_PHOTO_ASSET_FILES_PATH_PREFIX = '/photo-assets/files/';
const SAFETY_PROXY_UPLOADS_PATH_PREFIX = `${DEFAULT_SAFETY_API_BASE_URL}${SAFETY_UPLOADS_PATH_PREFIX}`;
const SAFETY_PATH_PREFIXES = ['/api/safety', '/api/v1'] as const;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return ABSOLUTE_HTTP_URL_PATTERN.test(value);
}

function hasNonProxyLocalScheme(value: string): boolean {
  return PASSTHROUGH_URL_PATTERN.test(value);
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

function ensureLeadingSlash(value: string): string {
  return value.startsWith('/') ? value : `/${value}`;
}

function stripKnownSafetyPrefix(path: string): string {
  for (const prefix of SAFETY_PATH_PREFIXES) {
    if (path === prefix) {
      return '/';
    }

    if (path.startsWith(`${prefix}/`)) {
      return path.slice(prefix.length);
    }
  }

  return path;
}

function toPublicContentAssetPath(path: string): string {
  const normalizedPath = stripKnownSafetyPrefix(path);
  if (!normalizedPath.startsWith('/content-items/assets/')) {
    return path;
  }

  const assetName = normalizedPath.split('/').filter(Boolean).at(-1);
  if (!assetName) {
    return path;
  }

  return `/uploads/content-items/${assetName}`;
}

function toLegacyContentAssetPath(path: string): string {
  if (!path.startsWith('/uploads/content-items/')) {
    return path;
  }

  const assetName = path.split('/').filter(Boolean).at(-1);
  if (!assetName) {
    return path;
  }

  return `/content-items/assets/${assetName}`;
}

function extractCanonicalAssetPath(value: string): string | null {
  let pathWithSearchAndHash = value;

  if (isAbsoluteHttpUrl(value)) {
    try {
      pathWithSearchAndHash = buildPathWithSearchAndHash(new URL(value));
    } catch {
      return null;
    }
  }

  const [pathname, suffix = ''] = pathWithSearchAndHash.split(/(?=[?#])/);
  const normalizedPath = stripKnownSafetyPrefix(ensureLeadingSlash(pathname));

  if (normalizedPath.startsWith('/uploads/content-items/')) {
    return `${normalizedPath}${suffix}`;
  }

  if (normalizedPath.startsWith('/content-items/assets/')) {
    return `${toPublicContentAssetPath(normalizedPath)}${suffix}`;
  }

  if (normalizedPath.startsWith(SAFETY_PHOTO_ASSET_FILES_PATH_PREFIX)) {
    return `${normalizedPath}${suffix}`;
  }

  return null;
}

function extractSafetyAssetPath(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || hasNonProxyLocalScheme(normalized)) return null;

  const canonicalContentAssetPath = extractCanonicalAssetPath(normalized);
  if (canonicalContentAssetPath) {
    return canonicalContentAssetPath;
  }

  if (normalized.startsWith(SAFETY_PROXY_UPLOADS_PATH_PREFIX)) {
    return normalized.slice(DEFAULT_SAFETY_API_BASE_URL.length);
  }

  if (normalized.startsWith(SAFETY_UPLOADS_PATH_PREFIX)) {
    return normalized;
  }

  if (!isAbsoluteHttpUrl(normalized)) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    const pathWithSearchAndHash = buildPathWithSearchAndHash(parsed);
    if (pathWithSearchAndHash.startsWith(SAFETY_PROXY_UPLOADS_PATH_PREFIX)) {
      return pathWithSearchAndHash.slice(DEFAULT_SAFETY_API_BASE_URL.length);
    }
    if (pathWithSearchAndHash.startsWith(SAFETY_UPLOADS_PATH_PREFIX)) {
      return pathWithSearchAndHash;
    }
  } catch {
    return null;
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

  const publicUpstreamBaseUrl = getPublicSafetyApiUpstreamBaseUrl();
  if (publicUpstreamBaseUrl) {
    return normalizeBaseUrl(new URL(publicUpstreamBaseUrl).origin);
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
  return extractSafetyAssetPath(value);
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

  if (assetPath.startsWith(SAFETY_PHOTO_ASSET_FILES_PATH_PREFIX)) {
    return buildSafetyApiUrl(assetPath);
  }

  return buildSafetyAssetUrl(assetPath);
}

export function shouldUseSafetyAssetDownloadAttribute(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (hasNonProxyLocalScheme(normalized)) return true;
  return !isAbsoluteHttpUrl(normalized);
}

export function shouldOpenSafetyAssetInNewTab(value: string): boolean {
  return isAbsoluteHttpUrl(value.trim());
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

export function resolveSafetyAssetUrl(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue || hasNonProxyLocalScheme(normalizedValue)) {
    return normalizedValue;
  }

  const assetPath = extractCanonicalAssetPath(normalizedValue) ?? getSafetyAssetPath(normalizedValue);
  if (assetPath) {
    if (assetPath.startsWith(SAFETY_PHOTO_ASSET_FILES_PATH_PREFIX)) {
      return buildSafetyApiUrl(assetPath);
    }
    return buildSafetyAssetUrl(assetPath);
  }

  if (isAbsoluteHttpUrl(normalizedValue)) {
    return normalizedValue;
  }

  const normalizedPath = ensureLeadingSlash(normalizedValue);
  const normalizedContentAssetPath = extractCanonicalAssetPath(normalizedPath);
  if (normalizedContentAssetPath) {
    return buildSafetyAssetUrl(normalizedContentAssetPath);
  }

  if (normalizedPath.startsWith('/content-items/assets/')) {
    return buildSafetyApiUrl(toLegacyContentAssetPath(normalizedPath));
  }

  return normalizedPath;
}
