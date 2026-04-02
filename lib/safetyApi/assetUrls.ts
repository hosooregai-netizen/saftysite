import { buildSafetyApiUrl } from './config';
import { getPublicSafetyApiUpstreamBaseUrl } from './upstream';

const NEXT_PUBLIC_SAFETY_ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_SAFETY_ASSET_BASE_URL?.trim() || '';
const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const PASSTHROUGH_URL_PATTERN = /^(?:data|blob):/i;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return ABSOLUTE_HTTP_URL_PATTERN.test(value);
}

function ensureLeadingSlash(value: string): string {
  return value.startsWith('/') ? value : `/${value}`;
}

function toPublicContentAssetPath(path: string): string {
  if (!path.startsWith('/content-items/assets/')) {
    return path;
  }

  const assetName = path.split('/').filter(Boolean).at(-1);
  if (!assetName) {
    return path;
  }

  return `/uploads/content-items/${assetName}`;
}

export function getSafetyAssetBaseUrl(): string | null {
  if (NEXT_PUBLIC_SAFETY_ASSET_BASE_URL && isAbsoluteHttpUrl(NEXT_PUBLIC_SAFETY_ASSET_BASE_URL)) {
    return normalizeBaseUrl(NEXT_PUBLIC_SAFETY_ASSET_BASE_URL);
  }

  const publicUpstreamBaseUrl = getPublicSafetyApiUpstreamBaseUrl();
  if (publicUpstreamBaseUrl) {
    return new URL(publicUpstreamBaseUrl).origin;
  }

  return null;
}

export function resolveSafetyAssetUrl(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue || PASSTHROUGH_URL_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  if (isAbsoluteHttpUrl(normalizedValue)) {
    return normalizedValue;
  }

  const normalizedPath = ensureLeadingSlash(normalizedValue);
  const assetBaseUrl = getSafetyAssetBaseUrl();

  if (normalizedPath.startsWith('/uploads/')) {
    return assetBaseUrl ? `${assetBaseUrl}${normalizedPath}` : normalizedPath;
  }

  if (normalizedPath.startsWith('/content-items/assets/')) {
    const publicPath = toPublicContentAssetPath(normalizedPath);
    return assetBaseUrl ? `${assetBaseUrl}${publicPath}` : buildSafetyApiUrl(normalizedPath);
  }

  return normalizedPath;
}
