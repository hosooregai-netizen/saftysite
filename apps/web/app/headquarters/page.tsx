import { Suspense } from 'react';
import { HeadquartersHubScreen } from '@/components/HeadquartersHubScreen';

function HeadquartersPageFallback() {
  return (
    <div className="erp-page">
      <section className="erp-panel">
        <h1 className="page-title">건설사/현장 화면을 불러오는 중입니다.</h1>
      </section>
    </div>
  );
}

export default function HeadquartersPage() {
  return (
    <Suspense fallback={<HeadquartersPageFallback />}>
      <HeadquartersHubScreen />
    </Suspense>
  );
}
