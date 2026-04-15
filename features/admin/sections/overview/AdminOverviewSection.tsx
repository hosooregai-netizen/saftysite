'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { OverviewDispatchQueueTable } from './OverviewDispatchQueueTable';
import { OverviewMaterialGapSection } from './OverviewMaterialGapSection';
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
            <div className={styles.sectionHeaderMeta}>마지막 갱신 {formatSyncTimestamp(state.lastSyncedAt)}</div>
          </div>
          <div className={styles.sectionHeaderActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void state.refreshOverview()}
              disabled={state.isRefreshing}
            >
              {state.isRefreshing ? '새로고침 중...' : '새로고침'}
            </button>
            <button type="button" className="app-button app-button-secondary" onClick={() => void state.exportOverview()}>
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
        isRefreshing={state.isRefreshing}
        rows={state.pagedUnsentReportRows}
        setPage={state.setUnsentPage}
        setSort={state.setUnsentSort}
        sort={state.unsentSort}
        totalPages={state.unsentTotalPages}
        totalRows={state.sortedUnsentReportRows.length}
      />

      <OverviewDispatchQueueTable
        title="우선 발송 대상 현장"
        rows={state.overview.priorityTargetSiteRows ?? []}
        emptyLabel="현재 발송 관리 대상으로 표시된 현장이 없습니다."
        isUpdating={Boolean(state.policyUpdatingSiteId)}
        onToggleDispatchAlerts={(siteId, enabled, alertsEnabled) =>
          void state.updateSiteDispatchPolicy(siteId, {
            enabled,
            alerts_enabled: alertsEnabled,
          })
        }
        onToggleDispatchPolicy={(siteId, enabled, alertsEnabled) =>
          void state.updateSiteDispatchPolicy(siteId, {
            enabled,
            alerts_enabled: alertsEnabled,
          })
        }
        updatingSiteId={state.policyUpdatingSiteId}
      />
      <OverviewDispatchQueueTable
        title="현장 대리인 메일 미등록 현장"
        rows={state.overview.recipientMissingSiteRows ?? []}
        emptyLabel="현재 메일 정보 보완이 필요한 현장이 없습니다."
      />
      <OverviewDispatchQueueTable
        title="발송 필요하지만 아직 미발송 보고서가 남은 현장"
        rows={state.overview.dispatchQueueRows ?? []}
        emptyLabel="현재 미발송 보고서가 남아 있는 현장이 없습니다."
      />

      <OverviewMaterialGapSection
        currentPage={state.currentMaterialPage}
        isRefreshing={state.isRefreshing}
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
