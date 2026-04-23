'use client';

import { SafetyApiError } from './client';

const PRIMARY_DIRECT_UPLOAD_ENV_KEY = 'NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL';

function getCurrentPageProtocol(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location?.protocol || null;
}

export function canUseDirectUploadUrl(
  uploadUrl: string | null,
  pageProtocol: string | null = getCurrentPageProtocol(),
): boolean {
  if (!uploadUrl) {
    return false;
  }

  try {
    const targetUrl = new URL(uploadUrl);
    if (!/^https?:$/i.test(targetUrl.protocol)) {
      return false;
    }

    if (pageProtocol === 'https:') {
      return targetUrl.protocol === 'https:';
    }

    return true;
  } catch {
    return false;
  }
}

export function resolveUploadTransport(input: {
  directUploadUrl: string | null;
  proxyBaseUrl: string;
  pageProtocol?: string | null;
}) {
  const directUploadUrl = canUseDirectUploadUrl(
    input.directUploadUrl,
    input.pageProtocol,
  )
    ? input.directUploadUrl
    : null;

  return {
    directUploadUrl,
    usesProxyUpload: !directUploadUrl && input.proxyBaseUrl.startsWith('/'),
  };
}

export function buildProxyUploadOversizeErrorMessage(subject: string): string {
  return `4.5MB를 초과하는 ${subject}은 현재 Vercel 프록시 업로드 경로로는 저장할 수 없습니다. ${PRIMARY_DIRECT_UPLOAD_ENV_KEY} 설정을 확인해 주세요.`;
}

export function getProxyUploadWarningMessage(subject: string): string {
  return `현재는 Vercel 프록시 경유 업로드라 4.5MB를 넘는 ${subject}은 직접 업로드 origin 설정이 없으면 저장할 수 없습니다. ${PRIMARY_DIRECT_UPLOAD_ENV_KEY} 설정을 확인해 주세요.`;
}

export function shouldFallbackDirectUploadToProxy(
  error: unknown,
  uploadBytes: number,
  proxyFileBytes: number,
): boolean {
  if (uploadBytes > proxyFileBytes) {
    return false;
  }

  if (error instanceof SafetyApiError) {
    return error.status === 404 || error.status === 405;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  if (/\((404|405)\)\./.test(error.message)) {
    return true;
  }

  if (/\((4\d\d|5\d\d)\)\./.test(error.message)) {
    return false;
  }

  return true;
}
