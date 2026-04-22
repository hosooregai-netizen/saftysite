'use client';

import type { SafetyContentAssetUpload } from './adminEndpoints';
import { uploadSafetyContentAsset } from './adminEndpoints';
import { resolveSafetyAssetUrl } from './assetUrls';
import { readSafetyAuthToken } from './authStorage';
import { SafetyApiError } from './client';
import { getSafetyApiBaseUrl } from './config';
import { buildPublicSafetyUploadUpstreamUrl } from './upstream';

export const MAX_SAFETY_ASSET_BYTES = 50 * 1024 * 1024;
export const MAX_SAFETY_PROXY_FILE_BYTES = Math.floor(4.5 * 1024 * 1024);
const SAFETY_ASSET_UPLOAD_TIMEOUT_MS = 45000;

interface SafetyAssetValidationOptions {
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

function canUseDirectSafetyAssetUploadUrl(uploadUrl: string | null) {
  if (!uploadUrl) {
    return false;
  }

  try {
    const targetUrl = new URL(uploadUrl);
    if (!/^https?:$/i.test(targetUrl.protocol)) {
      return false;
    }

    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return targetUrl.protocol === 'https:';
    }

    return true;
  } catch {
    return false;
  }
}

function getUsableDirectSafetyAssetUploadUrl(): string | null {
  const uploadUrl = getDirectSafetyAssetUploadUrl();
  return canUseDirectSafetyAssetUploadUrl(uploadUrl) ? uploadUrl : null;
}

export function usesSafetyProxyUpload(): boolean {
  if (getUsableDirectSafetyAssetUploadUrl()) {
    return false;
  }

  return getSafetyApiBaseUrl().startsWith('/');
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

async function uploadSafetyContentAssetDirect(
  uploadUrl: string,
  token: string,
  file: File,
): Promise<SafetyContentAssetUpload> {
  const body = new FormData();
  body.set('file', file);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`콘텐츠 파일 업로드가 ${SAFETY_ASSET_UPLOAD_TIMEOUT_MS}ms 안에 완료되지 않았습니다.`),
    );
  }, SAFETY_ASSET_UPLOAD_TIMEOUT_MS);

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

function shouldFallbackSafetyAssetUploadToProxy(error: unknown, file: File) {
  if (file.size > MAX_SAFETY_PROXY_FILE_BYTES) {
    return false;
  }

  if (error instanceof SafetyApiError) {
    return error.status === 404 || error.status === 405;
  }

  if (error instanceof Error) {
    return !/\((4\d\d|5\d\d)\)\./.test(error.message) || /\((404|405)\)\./.test(error.message);
  }

  return false;
}

export function validateSafetyAssetFile(
  file: File,
  options: SafetyAssetValidationOptions = {},
): string | null {
  const maxFileBytes = options.maxFileBytes ?? MAX_SAFETY_ASSET_BYTES;
  const proxyFileBytes = options.proxyFileBytes ?? MAX_SAFETY_PROXY_FILE_BYTES;
  const usesProxy = options.usesProxy ?? usesSafetyProxyUpload();

  if (file.size <= 0) {
    return '빈 파일은 업로드할 수 없습니다.';
  }

  if (file.size > maxFileBytes) {
    return '50MB를 초과하는 파일은 업로드할 수 없습니다.';
  }

  if (usesProxy && file.size > proxyFileBytes) {
    return '4.5MB를 초과하는 파일은 현재 Vercel 프록시 업로드 경로로는 저장할 수 없습니다. 직접 업로드 origin 설정을 확인해 주세요.';
  }

  return null;
}

export async function uploadSafetyAssetFile(file: File): Promise<UploadedSafetyAsset> {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const directUploadUrl = getUsableDirectSafetyAssetUploadUrl();
  let uploaded: SafetyContentAssetUpload;

  if (!directUploadUrl) {
    uploaded = await uploadSafetyContentAsset(token, file);
  } else {
    try {
      uploaded = await uploadSafetyContentAssetDirect(directUploadUrl, token, file);
    } catch (error) {
      if (!shouldFallbackSafetyAssetUploadToProxy(error, file)) {
        throw error;
      }
      uploaded = await uploadSafetyContentAsset(token, file);
    }
  }

  return {
    ...uploaded,
    url: resolveSafetyAssetUrl(uploaded.path),
  };
}
