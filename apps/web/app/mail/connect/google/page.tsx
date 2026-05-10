import { Suspense } from 'react';
import MailConnectCallback from '@/features/mailbox/components/MailConnectCallback';

export default function GoogleMailConnectPage() {
  return (
    <Suspense fallback={null}>
      <MailConnectCallback provider="google" />
    </Suspense>
  );
}
