import SiteOverviewChecklist from '@/components/site-overview/SiteOverviewChecklist';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
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
      <SiteOverviewChecklist
        report={report}
        onAgentToggle={onToggle}
        onUploadSuccess={onSuccess}
        onUploadClear={() =>
          onSuccess({
            agents: createEmptyCausativeAgentMap(),
            reasoning: '',
            photoUrl: '',
          })
        }
        onRawResponse={() => undefined}
      />
    </div>
  );
}
