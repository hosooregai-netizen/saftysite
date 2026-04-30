import { Suspense } from 'react';
import { HomeScreen } from '@/features/home/components/HomeScreen';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeScreen />
    </Suspense>
  );
}

