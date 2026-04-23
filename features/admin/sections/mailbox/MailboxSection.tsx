'use client';

import MailboxPanel from '@/features/mailbox/components/MailboxPanel';
import type { SafetyReportListItem, SafetySite, SafetyUser } from '@/types/backend';

interface MailboxSectionProps {
  currentUser: Pick<SafetyUser, 'email' | 'id' | 'name'>;
  reports?: SafetyReportListItem[];
  sites?: SafetySite[];
}

export function MailboxSection({ currentUser, reports = [], sites = [] }: MailboxSectionProps) {
  return (
    <MailboxPanel
      adminReports={reports}
      adminSites={sites}
      currentUser={currentUser}
      mode="admin"
    />
  );
}

export default MailboxSection;
