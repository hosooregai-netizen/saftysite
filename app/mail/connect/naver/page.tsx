import { Suspense } from 'react';
import MailConnectCallback from '@/features/mailbox/components/MailConnectCallback';

export default function NaverMailConnectPage() {
  return (
    <Suspense fallback={null}>
      <MailConnectCallback provider="naver" />
    </Suspense>
  );
}
