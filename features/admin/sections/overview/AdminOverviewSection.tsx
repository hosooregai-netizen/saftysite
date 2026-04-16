'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { OverviewEndingSoonSection } from './OverviewEndingSoonSection';
import { OverviewMaterialGapSection } from './OverviewMaterialGapSection';
import { OverviewPriorityQuarterlyManagementSection } from './OverviewPriorityQuarterlyManagementSection';
import { OverviewUnsentReportsSection } from './OverviewUnsentReportsSection';
import { OverviewVisualCards } from './OverviewVisualCards';
import { formatSyncTimestamp } from './overviewSectionHelpers';
import { useAdminOverviewSectionState } from './useAdminOverviewSectionState';

interface AdminOverviewSectionProps {
  currentUserId: string;
  data: ControllerDashboardData;
  onUpdateSiteDispatchPolicy?: (
    siteId: string,
    input: { enabled: boolean; alerts_enabled: boolean },
  ) => Promise<unknown>;
  reports: SafetyReportListItem[];
}

export function AdminOverviewSection({
  currentUserId,
  data,
  onUpdateSiteDispatchPolicy,
  reports,
}: AdminOverviewSectionProps) {
  const state = useAdminOverviewSectionState(currentUserId, data, reports, {
    onUpdateSiteDispatchPolicy,
  });

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>운영 개요</h2>
            <div className={styles.sectionHeaderMeta}>
              마지막 갱신 {formatSyncTimestamp(state.lastSyncedAt)}
            </div>
          </div>
          <div className={styles.sectionHeaderActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void state.refreshOverview()}
              disabled={state.isRefreshing}
            >
              {state.isRefreshing ? '불러오는 중...' : '새로고침'}
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void state.exportOverview()}
            >
              엑셀 내보내기
            </button>
          </div>
        </div>
        <div className={`${styles.sectionBody} ${styles.kpiPanelBody}`}>
          {state.error ? <div className={styles.bannerError}>{state.error}</div> : null}
          <OverviewVisualCards
            deadlineSignalSummary={state.overview.deadlineSignalSummary}
            quarterlyMaterialSummary={state.overview.quarterlyMaterialSummary}
            siteStatusSummary={state.overview.siteStatusSummary}
          />
        </div>
      </section>

      <OverviewUnsentReportsSection
        currentPage={state.currentUnsentPage}
        rows={state.pagedUnsentReportRows}
        setPage={state.setUnsentPage}
        setSort={state.setUnsentSort}
        sort={state.unsentSort}
        totalPages={state.unsentTotalPages}
        totalRows={state.sortedUnsentReportRows.length}
      />

      <OverviewPriorityQuarterlyManagementSection
        currentPage={state.currentPriorityPage}
        rows={state.pagedPriorityQuarterlyManagementRows}
        setPage={state.setPriorityPage}
        totalPages={state.priorityTotalPages}
        totalRows={(state.overview.priorityQuarterlyManagementRows ?? []).length}
      />

      <OverviewEndingSoonSection
        currentPage={state.currentEndingSoonPage}
        rows={state.pagedEndingSoonRows}
        setPage={state.setEndingSoonPage}
        totalPages={state.endingSoonTotalPages}
        totalRows={state.overview.endingSoonRows.length}
      />

      <OverviewMaterialGapSection
        currentPage={state.currentMaterialPage}
        quarterLabel={state.overview.quarterlyMaterialSummary.quarterLabel}
        rows={state.pagedMaterialRows}
        setPage={state.setMaterialPage}
        setSort={state.setMaterialSort}
        sort={state.materialSort}
        totalPages={state.materialTotalPages}
        totalRows={state.sortedMaterialRows.length}
      />
    </div>
  );
}
