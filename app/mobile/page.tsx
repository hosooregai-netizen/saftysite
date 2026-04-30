import { Suspense } from 'react';
import { MobileSiteListScreen } from '@/features/mobile/components/MobileSiteListScreen';

export default function MobileHomePage() {
  return (
    <Suspense fallback={null}>
      <MobileSiteListScreen />
    </Suspense>
  );
}
