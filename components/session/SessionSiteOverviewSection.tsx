import SiteOverviewChecklist from '@/components/site-overview/SiteOverviewChecklist';
import SiteOverviewUploadPanel from '@/components/site-overview/SiteOverviewUploadPanel';
import type { CausativeAgentKey, CausativeAgentReport } from '@/types/siteOverview';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionSiteOverviewSectionProps {
  report: CausativeAgentReport;
  onSuccess: (report: CausativeAgentReport) => void;
  onToggle: (key: CausativeAgentKey, checked: boolean) => void;
}

export default function SessionSiteOverviewSection({
  report,
  onSuccess,
  onToggle,
}: SessionSiteOverviewSectionProps) {
  return (
    <div className={styles.overviewGrid}>
      <SiteOverviewUploadPanel
        onSuccess={onSuccess}
        onRawResponse={() => undefined}
      />
      <SiteOverviewChecklist report={report} onAgentToggle={onToggle} />
    </div>
  );
}
