'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { bootstrapDemoSession, confirmBillingPayment } from '@/lib/reportApi';

export function BillingSuccessScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const paymentKey = searchParams.get('paymentKey') || '';
      const orderId = searchParams.get('orderId') || '';
      const amount = Number(searchParams.get('amount') || '0');

      if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
        router.replace(
          '/account?billingError=' + encodeURIComponent('결제 확인에 필요한 정보가 부족합니다.') + '#billing',
        );
        return;
      }

      try {
        const session = await bootstrapDemoSession();
        const response = await confirmBillingPayment(session, { amount, orderId, paymentKey });
        if (!cancelled) {
          router.replace(
            '/account?billingNotice=' +
              encodeURIComponent(`결제가 완료되었습니다. 현재 잔액은 ${response.balance}건입니다.`) +
              '#billing',
          );
        }
      } catch (error) {
        if (!cancelled) {
          router.replace(
            '/account?billingError=' +
              encodeURIComponent(error instanceof Error ? error.message : '결제 확인에 실패했습니다.') +
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
        <h1 className="page-title">결제 확인 중입니다.</h1>
        <p className="page-meta-line">토스 결제 승인 정보를 확인한 뒤 다시 설정 화면으로 이동합니다.</p>
      </section>
    </div>
  );
}
