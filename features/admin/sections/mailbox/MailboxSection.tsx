'use client';

import MailboxPanel from '@/features/mailbox/components/MailboxPanel';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';

interface MailboxSectionProps {
  currentUserName?: string | null;
  reports?: SafetyReportListItem[];
  sites?: SafetySite[];
}

export function MailboxSection({ currentUserName, reports = [], sites = [] }: MailboxSectionProps) {
  return (
    <MailboxPanel
      adminReports={reports}
      adminSites={sites}
      currentUserName={currentUserName}
      mode="admin"
    />
  );
}

export default MailboxSection;
