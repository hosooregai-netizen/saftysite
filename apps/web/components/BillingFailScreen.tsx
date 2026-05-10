'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function BillingFailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code') || '';
    const message = searchParams.get('message') || '결제가 완료되지 않았습니다.';
    const detail = code ? `${message} (${code})` : message;
    router.replace('/account?billingError=' + encodeURIComponent(detail) + '#billing');
  }, [router, searchParams]);

  return (
    <div className="erp-page">
      <section className="erp-panel">
        <h1 className="page-title">결제 결과를 확인하는 중입니다.</h1>
      </section>
    </div>
  );
}
