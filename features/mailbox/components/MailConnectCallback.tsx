'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  completeGoogleMailConnect,
  completeNaverMailConnect,
} from '@/lib/mail/apiClient';

interface MailConnectCallbackProps {
  provider: 'google' | 'naver';
}

function getRedirectUri(provider: 'google' | 'naver') {
  if (typeof window === 'undefined') return '';
  const path = provider === 'google' ? '/mail/connect/google' : '/mail/connect/naver';
  return `${window.location.origin}${path}`;
}

function buildMailboxRedirectUrl(input: {
  type: 'notice' | 'error';
  message: string;
}) {
  const searchParams = new URLSearchParams({ box: 'accounts' });
  searchParams.set(input.type === 'notice' ? 'oauthNotice' : 'oauthError', input.message);
  return `/mailbox?${searchParams.toString()}`;
}

export function MailConnectCallback({ provider }: MailConnectCallbackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

    let cancelled = false;
    void (async () => {
      try {
        if (provider === 'google') {
          await completeGoogleMailConnect({
            authCode,
            redirectUri: getRedirectUri('google'),
            state,
          });
        } else {
          await completeNaverMailConnect({
            authCode,
            redirectUri: getRedirectUri('naver'),
            state,
          });
        }
        if (cancelled) return;
        const nextMessage = `${provider === 'google' ? '구글' : '네이버'} 메일 계정을 연결했습니다.`;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('mailbox-oauth-notice', nextMessage);
        }
        router.replace(
          buildMailboxRedirectUrl({
            type: 'notice',
            message: nextMessage,
          }),
        );
      } catch (errorValue) {
        if (cancelled) return;
        const nextMessage =
          errorValue instanceof Error ? errorValue.message : '메일 계정 연결을 완료하지 못했습니다.';
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('mailbox-oauth-error', nextMessage);
        }
        router.replace(
          buildMailboxRedirectUrl({
            type: 'error',
            message: nextMessage,
          }),
        );
      }
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
