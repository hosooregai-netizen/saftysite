import operationalStyles from '@/components/site/OperationalReports.module.css';
import { BAD_WORKPLACE_NOTICE_TITLE } from '@/lib/erpReports/badWorkplace';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { BadWorkplaceHeadquartersPanel } from './BadWorkplaceHeadquartersPanel';
import { BadWorkplaceNotificationPanel } from './BadWorkplaceNotificationPanel';
import { BadWorkplaceSectionHeader } from './BadWorkplaceSectionHeader';
import { BadWorkplaceSitePanel } from './BadWorkplaceSitePanel';

interface BadWorkplaceSiteSnapshotSectionProps {
  draft: BadWorkplaceReport;
  onUpdateDraft: (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => void;
  onUpdateSiteSnapshot: (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => void;
}

export function BadWorkplaceSiteSnapshotSection({
  draft,
  onUpdateDraft,
  onUpdateSiteSnapshot,
}: BadWorkplaceSiteSnapshotSectionProps) {
  return (
    <article className={operationalStyles.reportCard}>
      <BadWorkplaceSectionHeader title="2. 통보서 기본 정보" />

      <div className={operationalStyles.documentHeading}>
        <strong className={operationalStyles.documentTitle}>
          {BAD_WORKPLACE_NOTICE_TITLE}
        </strong>
      </div>

      <div className={operationalStyles.snapshotSectionGrid}>
        <BadWorkplaceSitePanel
          draft={draft}
          onUpdateProgressRate={(value) =>
            onUpdateDraft((current) => ({ ...current, progressRate: value }))
          }
          onUpdateSiteSnapshot={onUpdateSiteSnapshot}
        />
        <BadWorkplaceHeadquartersPanel
          draft={draft}
          onUpdateSiteSnapshot={onUpdateSiteSnapshot}
        />
        <BadWorkplaceNotificationPanel
          draft={draft}
          onUpdateDraft={onUpdateDraft}
        />
      </div>
    </article>
  );
}
