'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  bootstrapDemoSession,
  isAuthenticatedSession,
  startBillingCheckout,
} from '@/lib/reportApi';

const VALID_PACKAGES = new Set(['starter-10', 'team-30', 'agency-100']);

export function BillingCheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('결제창을 준비하고 있습니다.');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const packageId = searchParams.get('package') || '';
      if (!VALID_PACKAGES.has(packageId)) {
        router.replace(
          '/account?billingError=' + encodeURIComponent('선택한 결제 패키지를 찾을 수 없습니다.') + '#billing',
        );
        return;
      }

      try {
        const session = await bootstrapDemoSession();
        if (!isAuthenticatedSession(session)) {
          router.replace(
            '/account?auth=required&intent=billing&package=' +
              encodeURIComponent(packageId) +
              '&billingError=' +
              encodeURIComponent('크레딧 결제 전에 Google 로그인이 필요합니다.') +
              '#billing',
          );
          return;
        }

        const response = await startBillingCheckout(session, packageId as 'starter-10' | 'team-30' | 'agency-100');
        if (!response.checkoutUrl) {
          throw new Error('토스 결제창 URL을 받지 못했습니다.');
        }
        if (!cancelled) {
          setMessage('토스 결제창으로 이동합니다.');
          window.location.assign(response.checkoutUrl);
        }
      } catch (error) {
        if (!cancelled) {
          router.replace(
            '/account?billingError=' +
              encodeURIComponent(error instanceof Error ? error.message : '결제 준비에 실패했습니다.') +
              '#billing',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="erp-page">
      <section className="erp-panel">
        <h1 className="page-title">크레딧 결제 준비</h1>
        <p className="page-meta-line">{message}</p>
      </section>
    </div>
  );
}
