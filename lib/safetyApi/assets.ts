'use client';

import { createOptimizedPhotoUpload } from '@/lib/photos/thumbnail';
import type { SafetyContentAssetUpload } from './adminEndpoints';
import { resolveSafetyAssetUrl } from './assetUrls';
import { readSafetyAuthToken } from './authStorage';
import { buildSafetyApiUrl, getSafetyApiBaseUrl } from './config';
import { buildPublicSafetyUploadUpstreamUrl } from './upstream';
import {
  buildProxyUploadOversizeErrorMessage,
  getProxyUploadWarningMessage,
  resolveUploadTransport,
  shouldFallbackDirectUploadToProxy,
} from './uploadTransport';

export const MAX_SAFETY_ASSET_BYTES = 50 * 1024 * 1024;
export const MAX_SAFETY_PROXY_FILE_BYTES = Math.floor(4.5 * 1024 * 1024);
const SAFETY_ASSET_UPLOAD_BASE_TIMEOUT_MS = 60000;
const SAFETY_ASSET_UPLOAD_TIMEOUT_PER_MB_MS = 4000;
const SAFETY_ASSET_UPLOAD_MAX_TIMEOUT_MS = 180000;

interface SafetyAssetValidationOptions {
  allowImageProxyOptimization?: boolean;
  maxFileBytes?: number;
  proxyFileBytes?: number;
  usesProxy?: boolean;
}

export interface UploadedSafetyAsset extends SafetyContentAssetUpload {
  url: string;
}

function getDirectSafetyAssetUploadUrl(): string | null {
  return buildPublicSafetyUploadUpstreamUrl('/content-items/assets/upload');
}

function getSafetyAssetUploadTransport() {
  return resolveUploadTransport({
    directUploadUrl: getDirectSafetyAssetUploadUrl(),
    proxyBaseUrl: getSafetyApiBaseUrl(),
  });
}

function getProxySafetyAssetUploadUrl(): string {
  return buildSafetyApiUrl('/content-items/assets/upload');
}

function shouldPreferProxySafetyImageUpload(file: File, proxyUploadUrl: string): boolean {
  return (
    proxyUploadUrl.startsWith('/') &&
    isOptimizableSafetyImageFile(file) &&
    file.size <= MAX_SAFETY_PROXY_FILE_BYTES
  );
}

function isOptimizableSafetyImageFile(file: File): boolean {
  if (/^image\/(?:png|jpe?g|webp|bmp|heic|heif)$/i.test(file.type)) {
    return true;
  }

  return /\.(png|jpe?g|bmp|webp|heic|heif)$/i.test(file.name);
}

async function prepareSafetyAssetFileForUpload(file: File): Promise<File> {
  if (!isOptimizableSafetyImageFile(file)) {
    return file;
  }

  return createOptimizedPhotoUpload(file).catch(() => file);
}

function getSafetyAssetUploadTimeoutMs(fileSize: number): number {
  const sizeBasedTimeout =
    SAFETY_ASSET_UPLOAD_BASE_TIMEOUT_MS +
    Math.ceil(fileSize / (1024 * 1024)) * SAFETY_ASSET_UPLOAD_TIMEOUT_PER_MB_MS;
  return Math.min(SAFETY_ASSET_UPLOAD_MAX_TIMEOUT_MS, sizeBasedTimeout);
}

export function usesSafetyProxyUpload(): boolean {
  return getSafetyAssetUploadTransport().usesProxyUpload;
}

function parseUploadErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  return fallback;
}

async function uploadSafetyContentAsset(
  uploadUrl: string,
  token: string,
  file: File,
): Promise<SafetyContentAssetUpload> {
  const body = new FormData();
  body.set('file', file);

  const uploadTimeoutMs = getSafetyAssetUploadTimeoutMs(file.size);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`콘텐츠 파일 업로드가 ${uploadTimeoutMs}ms 안에 완료되지 않았습니다.`),
    );
  }, uploadTimeoutMs);

  let response: Response;

  try {
    response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
      cache: 'no-store',
      signal: abortController.signal,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `콘텐츠 파일 업로드 중 네트워크 오류가 발생했습니다. ${error.message}`
        : '콘텐츠 파일 업로드 중 안전 API 서버에 연결하지 못했습니다.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let payload: SafetyContentAssetUpload | { detail?: string } | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as SafetyContentAssetUpload | { detail?: string };
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const fallbackMessage = text || response.statusText || '업로드 처리 중 오류가 발생했습니다.';
    throw new Error(
      `콘텐츠 파일 업로드가 실패했습니다 (${response.status}). ${parseUploadErrorMessage(payload, fallbackMessage)}`,
    );
  }

  return payload as SafetyContentAssetUpload;
}

export function validateSafetyAssetFile(
  file: File,
  options: SafetyAssetValidationOptions = {},
): string | null {
  const allowImageProxyOptimization = options.allowImageProxyOptimization ?? true;
  const maxFileBytes = options.maxFileBytes ?? MAX_SAFETY_ASSET_BYTES;
  const proxyFileBytes = options.proxyFileBytes ?? MAX_SAFETY_PROXY_FILE_BYTES;
  const usesProxy = options.usesProxy ?? usesSafetyProxyUpload();

  if (file.size <= 0) {
    return '빈 파일은 업로드할 수 없습니다.';
  }

  if (file.size > maxFileBytes) {
    return '50MB를 초과하는 파일은 업로드할 수 없습니다.';
  }

  if (
    usesProxy &&
    file.size > proxyFileBytes &&
    !(allowImageProxyOptimization && isOptimizableSafetyImageFile(file))
  ) {
    return buildProxyUploadOversizeErrorMessage('파일');
  }

  return null;
}

export function getSafetyAssetUploadHelperText(
  options: { usesProxy?: boolean } = {},
): string | undefined {
  const usesProxy = options.usesProxy ?? usesSafetyProxyUpload();
  return usesProxy ? getProxyUploadWarningMessage('파일') : undefined;
}

export async function uploadSafetyAssetFile(file: File): Promise<UploadedSafetyAsset> {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const uploadFile = await prepareSafetyAssetFileForUpload(file);
  const validationMessage = validateSafetyAssetFile(uploadFile, {
    allowImageProxyOptimization: false,
  });
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const transport = getSafetyAssetUploadTransport();
  const proxyUploadUrl = getProxySafetyAssetUploadUrl();
  let uploaded: SafetyContentAssetUpload;

  if (shouldPreferProxySafetyImageUpload(uploadFile, proxyUploadUrl)) {
    uploaded = await uploadSafetyContentAsset(proxyUploadUrl, token, uploadFile);
  } else if (!transport.directUploadUrl) {
    uploaded = await uploadSafetyContentAsset(proxyUploadUrl, token, uploadFile);
  } else {
    try {
      uploaded = await uploadSafetyContentAsset(
        transport.directUploadUrl,
        token,
        uploadFile,
      );
    } catch (error) {
      if (
        !shouldFallbackDirectUploadToProxy(
          error,
          uploadFile.size,
          MAX_SAFETY_PROXY_FILE_BYTES,
        )
      ) {
          throw error;
      }
      uploaded = await uploadSafetyContentAsset(proxyUploadUrl, token, uploadFile);
    }
  }

  return {
    ...uploaded,
    url: resolveSafetyAssetUrl(uploaded.path),
  };
}
