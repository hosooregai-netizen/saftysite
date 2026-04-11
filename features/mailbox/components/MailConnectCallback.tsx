'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  completeGoogleMailConnect,
  completeNaverMailConnect,
} from '@/lib/mail/apiClient';

interface MailConnectCallbackProps {
  provider: 'google' | 'naver';
}

type OAuthCompletionResult = {
  message: string;
  type: 'notice' | 'error';
};

const OAUTH_RESULT_STORAGE_PREFIX = 'mailbox-oauth-result:';
const oauthCompletionRequests = new Map<string, Promise<OAuthCompletionResult>>();

function getRedirectUri(provider: 'google' | 'naver') {
  if (typeof window === 'undefined') return '';
  const path = provider === 'google' ? '/mail/connect/google' : '/mail/connect/naver';
  return `${window.location.origin}${path}`;
}

function buildMailboxRedirectUrl(input: {
  type: 'notice' | 'error';
  message: string;
}) {
  const searchParams = new URLSearchParams({ box: 'inbox' });
  searchParams.set(input.type === 'notice' ? 'oauthNotice' : 'oauthError', input.message);
  return `/mailbox?${searchParams.toString()}`;
}

function buildCallbackKey(provider: 'google' | 'naver', state: string, authCode: string) {
  return `${provider}:${state}:${authCode}`;
}

function buildOAuthResultStorageKey(callbackKey: string) {
  return `${OAUTH_RESULT_STORAGE_PREFIX}${callbackKey}`;
}

function readStoredOAuthResult(callbackKey: string): OAuthCompletionResult | null {
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

function writeStoredOAuthResult(callbackKey: string, result: OAuthCompletionResult) {
  if (typeof window === 'undefined') return;
  if (result.type !== 'notice') return;
  window.sessionStorage.setItem(buildOAuthResultStorageKey(callbackKey), JSON.stringify(result));
}

function rememberMailboxRedirectResult(result: OAuthCompletionResult) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    result.type === 'notice' ? 'mailbox-oauth-notice' : 'mailbox-oauth-error',
    result.message,
  );
}

function getCompletionPromise(input: {
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
          errorValue instanceof Error ? errorValue.message : '메일 계정 연결을 완료하지 못했습니다.',
      } satisfies OAuthCompletionResult;
    } finally {
      oauthCompletionRequests.delete(input.callbackKey);
    }
  })();

  oauthCompletionRequests.set(input.callbackKey, promise);
  return promise;
}

export function MailConnectCallback({ provider }: MailConnectCallbackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedCallbackRef = useRef<string | null>(null);

  useEffect(() => {
    const authCode = searchParams.get('code') || '';
    const error = searchParams.get('error') || '';
    const errorDescription = searchParams.get('error_description') || '';
    const state = searchParams.get('state') || '';

    if (error) {
      const providerLabel = provider === 'google' ? '구글' : '네이버';
      const detail = errorDescription ? `${error} (${errorDescription})` : error;
      const nextMessage = `${providerLabel} 로그인 중 오류가 발생했습니다: ${detail}`;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('mailbox-oauth-error', nextMessage);
      }
      router.replace(
        buildMailboxRedirectUrl({
          type: 'error',
          message: nextMessage,
        }),
      );
      return;
    }

    if (!authCode || !state) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('mailbox-oauth-error', '로그인 응답에 필요한 code/state 값이 없습니다.');
      }
      router.replace(
        buildMailboxRedirectUrl({
          type: 'error',
          message: '로그인 응답에 필요한 code/state 값이 없습니다.',
        }),
      );
      return;
    }

    const callbackKey = buildCallbackKey(provider, state, authCode);
    const storedResult = readStoredOAuthResult(callbackKey);
    if (storedResult) {
      if (redirectedCallbackRef.current === callbackKey) {
        return;
      }
      redirectedCallbackRef.current = callbackKey;
      rememberMailboxRedirectResult(storedResult);
      router.replace(buildMailboxRedirectUrl(storedResult));
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await getCompletionPromise({
        authCode,
        callbackKey,
        provider,
        state,
      });
      writeStoredOAuthResult(callbackKey, result);
      if (cancelled) return;
      if (redirectedCallbackRef.current === callbackKey) {
        return;
      }
      redirectedCallbackRef.current = callbackKey;
      rememberMailboxRedirectResult(result);
      router.replace(buildMailboxRedirectUrl(result));
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, router, searchParams]);

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>메일 계정 연결</h1>
            <p style={{ color: '#5f6b7a' }}>메일 계정을 연결하는 중입니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default MailConnectCallback;
