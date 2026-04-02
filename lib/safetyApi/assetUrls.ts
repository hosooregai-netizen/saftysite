import { buildSafetyApiUrl } from './config';
import { getPublicSafetyApiUpstreamBaseUrl } from './upstream';

const NEXT_PUBLIC_SAFETY_ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_SAFETY_ASSET_BASE_URL?.trim() || '';
const NEXT_PUBLIC_SAFETY_API_BASE_URL =
  process.env.NEXT_PUBLIC_SAFETY_API_BASE_URL?.trim() || '';
const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const PASSTHROUGH_URL_PATTERN = /^(?:data|blob):/i;
const SAFETY_PATH_PREFIXES = ['/api/safety', '/api/v1'] as const;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return ABSOLUTE_HTTP_URL_PATTERN.test(value);
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
  let pathname = value;

  if (isAbsoluteHttpUrl(value)) {
    try {
      pathname = new URL(value).pathname;
    } catch {
      return null;
    }
  }

  const normalizedPath = stripKnownSafetyPrefix(ensureLeadingSlash(pathname));

  if (normalizedPath.startsWith('/uploads/content-items/')) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('/content-items/assets/')) {
    return toPublicContentAssetPath(normalizedPath);
  }

  return null;
}

export function getSafetyAssetBaseUrl(): string | null {
  if (NEXT_PUBLIC_SAFETY_ASSET_BASE_URL && isAbsoluteHttpUrl(NEXT_PUBLIC_SAFETY_ASSET_BASE_URL)) {
    return normalizeBaseUrl(NEXT_PUBLIC_SAFETY_ASSET_BASE_URL);
  }

  const publicUpstreamBaseUrl = getPublicSafetyApiUpstreamBaseUrl();
  if (publicUpstreamBaseUrl) {
    return new URL(publicUpstreamBaseUrl).origin;
  }

  if (NEXT_PUBLIC_SAFETY_API_BASE_URL && isAbsoluteHttpUrl(NEXT_PUBLIC_SAFETY_API_BASE_URL)) {
    return new URL(NEXT_PUBLIC_SAFETY_API_BASE_URL).origin;
  }

  return null;
}

export function resolveSafetyAssetUrl(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue || PASSTHROUGH_URL_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  const normalizedPath = ensureLeadingSlash(normalizedValue);
  const assetBaseUrl = getSafetyAssetBaseUrl();
  const canonicalAssetPath = extractCanonicalAssetPath(normalizedValue);

  if (canonicalAssetPath) {
    if (assetBaseUrl) {
      return `${assetBaseUrl}${canonicalAssetPath}`;
    }

    return buildSafetyApiUrl(toLegacyContentAssetPath(canonicalAssetPath));
  }

  if (isAbsoluteHttpUrl(normalizedValue)) {
    return normalizedValue;
  }

  return normalizedPath;
}
