'use client';

import MailboxPanel from '@/features/mailbox/components/MailboxPanel';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';

interface MailboxSectionProps {
  reports?: SafetyReportListItem[];
  sites?: SafetySite[];
}

export function MailboxSection({ reports = [], sites = [] }: MailboxSectionProps) {
  return (
    <MailboxPanel
      adminReports={reports}
      adminSites={sites}
      mode="admin"
    />
  );
}

export default MailboxSection;
