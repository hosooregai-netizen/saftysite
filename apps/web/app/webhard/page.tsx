import { Suspense } from 'react';
import { WebhardScreen } from '@/components/WebhardScreen';

export default function WebhardPage() {
  return (
    <Suspense fallback={null}>
      <WebhardScreen />
    </Suspense>
  );
}
