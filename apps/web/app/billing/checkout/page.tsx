import { Suspense } from 'react';
import { BillingCheckoutScreen } from '@/components/BillingCheckoutScreen';

export default function BillingCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <BillingCheckoutScreen />
    </Suspense>
  );
}
