import { Suspense } from 'react';
import { MailboxScreen } from '@/features/mailbox/components/MailboxScreen';

export default function MailboxPage() {
  return (
    <Suspense fallback={null}>
      <MailboxScreen />
    </Suspense>
  );
}
