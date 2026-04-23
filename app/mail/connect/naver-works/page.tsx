import { Suspense } from 'react';
import MailConnectCallback from '@/features/mailbox/components/MailConnectCallback';

export default function NaverWorksMailConnectPage() {
  return (
    <Suspense fallback={null}>
      <MailConnectCallback provider="naver-works" />
    </Suspense>
  );
}
