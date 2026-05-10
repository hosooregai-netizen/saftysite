import { Suspense } from 'react';
import { BillingFailScreen } from '@/components/BillingFailScreen';

export default function BillingFailPage() {
  return (
    <Suspense fallback={null}>
      <BillingFailScreen />
    </Suspense>
  );
}
