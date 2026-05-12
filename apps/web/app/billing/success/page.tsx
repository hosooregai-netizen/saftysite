import { Suspense } from 'react';
import { BillingSuccessScreen } from '@/components/BillingSuccessScreen';

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BillingSuccessScreen />
    </Suspense>
  );
}
