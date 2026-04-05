'use client';

import MailboxPanel from '@/features/mailbox/components/MailboxPanel';

interface MailboxSectionProps {
  currentUserName?: string | null;
}

export function MailboxSection({ currentUserName }: MailboxSectionProps) {
  return (
    <MailboxPanel
      currentUserName={currentUserName}
      mode="admin"
    />
  );
}

export default MailboxSection;
