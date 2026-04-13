'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import type { OAuthCompletionResult } from './mailConnectCallbackHelpers';
import {
  buildCallbackKey,
  buildMailboxRedirectUrl,
  getOAuthCompletionPromise,
  readStoredOAuthResult,
  rememberMailboxRedirectResult,
  writeStoredOAuthResult,
} from './mailConnectCallbackHelpers';

interface RouterLike {
  replace: (href: string) => void;
}

interface SearchParamsLike {
  get: (key: string) => string | null;
}

interface UseMailConnectCallbackParams {
  provider: 'google' | 'naver';
  router: RouterLike;
  searchParams: SearchParamsLike;
}

function redirectWithResult(
  callbackKey: string,
  redirectedCallbackRef: MutableRefObject<string | null>,
  result: OAuthCompletionResult,
  router: RouterLike,
) {
  if (redirectedCallbackRef.current === callbackKey) {
    return;
  }
  redirectedCallbackRef.current = callbackKey;
  rememberMailboxRedirectResult(result);
  router.replace(buildMailboxRedirectUrl(result));
}

export function useMailConnectCallback({
  provider,
  router,
  searchParams,
}: UseMailConnectCallbackParams) {
  const redirectedCallbackRef = useRef<string | null>(null);

  useEffect(() => {
    const authCode = searchParams.get('code') || '';
    const error = searchParams.get('error') || '';
    const errorDescription = searchParams.get('error_description') || '';
    const state = searchParams.get('state') || '';

    if (error) {
      const providerLabel = provider === 'google' ? '구글' : '네이버';
      const detail = errorDescription ? `${error} (${errorDescription})` : error;
      const result = {
        type: 'error',
        message: `${providerLabel} 로그인 중 오류가 발생했습니다: ${detail}`,
      } satisfies OAuthCompletionResult;
      rememberMailboxRedirectResult(result);
      router.replace(buildMailboxRedirectUrl(result));
      return;
    }

    if (!authCode || !state) {
      const result = {
        type: 'error',
        message: '로그인 응답에 필요한 code/state 값이 없습니다.',
      } satisfies OAuthCompletionResult;
      rememberMailboxRedirectResult(result);
      router.replace(buildMailboxRedirectUrl(result));
      return;
    }

    const callbackKey = buildCallbackKey(provider, state, authCode);
    const storedResult = readStoredOAuthResult(callbackKey);
    if (storedResult) {
      redirectWithResult(callbackKey, redirectedCallbackRef, storedResult, router);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await getOAuthCompletionPromise({
        authCode,
        callbackKey,
        provider,
        state,
      });
      writeStoredOAuthResult(callbackKey, result);
      if (!cancelled) {
        redirectWithResult(callbackKey, redirectedCallbackRef, result, router);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, router, searchParams]);
}
