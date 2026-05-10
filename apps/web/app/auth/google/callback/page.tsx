'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeGoogleWorkspaceAuthCallback } from '@/lib/sessionAuthFlow';

function GoogleWorkspaceAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('구글 로그인 확인 중입니다.');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const authCode = searchParams.get('code') || '';
      const state = searchParams.get('state') || '';
      const providerError = searchParams.get('error') || '';

      if (providerError) {
        router.replace(
          `/account?authError=${encodeURIComponent('구글 로그인을 완료하지 못했습니다. 다시 시도해 주세요.')}`,
        );
        return;
      }

      if (!authCode || !state) {
        router.replace(
          `/account?authError=${encodeURIComponent('구글 로그인 확인에 필요한 정보가 부족합니다.')}`,
        );
        return;
      }

      try {
        const result = await completeGoogleWorkspaceAuthCallback({
          authCode,
          state,
        });
        if (cancelled) return;
        setMessage('계정을 연결했습니다. 작업 화면으로 이동합니다.');
        router.replace(result.nextPath);
      } catch (error) {
        if (cancelled) return;
        router.replace(
          `/account?authError=${encodeURIComponent(
            error instanceof Error ? error.message : '구글 로그인 확인에 실패했습니다.',
          )}`,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="erp-page">
      <section className="erp-panel">
        <h1 className="page-title">구글 로그인 확인</h1>
        <p className="page-meta-line">{message}</p>
      </section>
    </div>
  );
}

export default function GoogleWorkspaceAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleWorkspaceAuthCallbackContent />
    </Suspense>
  );
}
