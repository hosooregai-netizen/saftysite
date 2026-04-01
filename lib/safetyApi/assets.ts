'use client';

import type { SafetyContentAssetUpload } from './adminEndpoints';
import { uploadSafetyContentAsset } from './adminEndpoints';
import { buildSafetyAssetUrl } from './assetUrls';
import { readSafetyAuthToken } from './authStorage';
import { getSafetyApiBaseUrl } from './config';

export const MAX_SAFETY_ASSET_BYTES = 50 * 1024 * 1024;
export const MAX_SAFETY_PROXY_FILE_BYTES = 50 * 1024 * 1024;

interface SafetyAssetValidationOptions {
  maxFileBytes?: number;
  proxyFileBytes?: number;
  usesProxy?: boolean;
}

export interface UploadedSafetyAsset extends SafetyContentAssetUpload {
  url: string;
}

export function usesSafetyProxyUpload(): boolean {
  return getSafetyApiBaseUrl().startsWith('/');
}

export function validateSafetyAssetFile(
  file: File,
  options: SafetyAssetValidationOptions = {}
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
    return '50MB를 초과하는 파일은 현재 업로드 경로에서 저장할 수 없습니다. 백엔드/프록시 허용 용량을 함께 확인해 주세요.';
  }

  return null;
}

export async function uploadSafetyAssetFile(file: File): Promise<UploadedSafetyAsset> {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const uploaded = await uploadSafetyContentAsset(token, file);
  return {
    ...uploaded,
    url: buildSafetyAssetUrl(uploaded.path),
  };
}
