import { Suspense } from 'react';
import { AccountSettingsScreen } from '@/components/AccountSettingsScreen';

function AccountPageFallback() {
  return (
    <div className="erp-page">
      <section className="erp-panel">
        <h1 className="page-title">설정 화면을 불러오는 중입니다.</h1>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountPageFallback />}>
      <AccountSettingsScreen />
    </Suspense>
  );
}
