import { Suspense } from 'react';
import { MailboxHubScreen } from '@/components/MailboxHubScreen';

function MailboxPageFallback() {
  return <div style={{ minHeight: '100vh', background: '#f8fafd' }} aria-hidden="true" />;
}

export default function MailboxPage() {
  return (
    <Suspense fallback={<MailboxPageFallback />}>
      <MailboxHubScreen />
    </Suspense>
  );
}
