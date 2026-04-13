'use client';

import {
  completeGoogleMailConnect,
  completeNaverMailConnect,
} from '@/lib/mail/apiClient';

export type OAuthCompletionResult = {
  message: string;
  type: 'notice' | 'error';
};

const OAUTH_RESULT_STORAGE_PREFIX = 'mailbox-oauth-result:';
const oauthCompletionRequests = new Map<string, Promise<OAuthCompletionResult>>();

export function getRedirectUri(provider: 'google' | 'naver') {
  if (typeof window === 'undefined') return '';
  const path = provider === 'google' ? '/mail/connect/google' : '/mail/connect/naver';
  return `${window.location.origin}${path}`;
}

export function buildMailboxRedirectUrl(input: OAuthCompletionResult) {
  const searchParams = new URLSearchParams({ box: 'inbox' });
  searchParams.set(input.type === 'notice' ? 'oauthNotice' : 'oauthError', input.message);
  return `/mailbox?${searchParams.toString()}`;
}

export function buildCallbackKey(provider: 'google' | 'naver', state: string, authCode: string) {
  return `${provider}:${state}:${authCode}`;
}

function buildOAuthResultStorageKey(callbackKey: string) {
  return `${OAUTH_RESULT_STORAGE_PREFIX}${callbackKey}`;
}

export function readStoredOAuthResult(callbackKey: string): OAuthCompletionResult | null {
  if (typeof window === 'undefined') return null;
  const rawValue = window.sessionStorage.getItem(buildOAuthResultStorageKey(callbackKey));
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue) as OAuthCompletionResult | null;
    if (!parsed) return null;
    if (parsed.type !== 'notice' && parsed.type !== 'error') return null;
    if (typeof parsed.message !== 'string' || !parsed.message.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredOAuthResult(
  callbackKey: string,
  result: OAuthCompletionResult,
) {
  if (typeof window === 'undefined' || result.type !== 'notice') return;
  window.sessionStorage.setItem(
    buildOAuthResultStorageKey(callbackKey),
    JSON.stringify(result),
  );
}

export function rememberMailboxRedirectResult(result: OAuthCompletionResult) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    result.type === 'notice' ? 'mailbox-oauth-notice' : 'mailbox-oauth-error',
    result.message,
  );
}

export function getOAuthCompletionPromise(input: {
  authCode: string;
  callbackKey: string;
  provider: 'google' | 'naver';
  state: string;
}): Promise<OAuthCompletionResult> {
  const existing = oauthCompletionRequests.get(input.callbackKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      if (input.provider === 'google') {
        await completeGoogleMailConnect({
          authCode: input.authCode,
          redirectUri: getRedirectUri('google'),
          state: input.state,
        });
      } else {
        await completeNaverMailConnect({
          authCode: input.authCode,
          redirectUri: getRedirectUri('naver'),
          state: input.state,
        });
      }
      return {
        type: 'notice',
        message: `${input.provider === 'google' ? '구글' : '네이버'} 메일 계정을 연결했습니다.`,
      } satisfies OAuthCompletionResult;
    } catch (errorValue) {
      return {
        type: 'error',
        message:
          errorValue instanceof Error
            ? errorValue.message
            : '메일 계정 연결을 완료하지 못했습니다.',
      } satisfies OAuthCompletionResult;
    } finally {
      oauthCompletionRequests.delete(input.callbackKey);
    }
  })();

  oauthCompletionRequests.set(input.callbackKey, promise);
  return promise;
}
