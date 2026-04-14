'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { OverviewDispatchQueueTable } from './OverviewDispatchQueueTable';
import { OverviewMaterialGapSection } from './OverviewMaterialGapSection';
import { OverviewUnsentReportsSection } from './OverviewUnsentReportsSection';
import { OverviewVisualCards } from './OverviewVisualCards';
import { formatSyncTimestamp } from './overviewSectionHelpers';
import { useAdminOverviewSectionState } from './useAdminOverviewSectionState';

interface AdminOverviewSectionProps {
  currentUserId: string;
}

function OverviewSkeleton() {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>운영 개요</h2>
          <div className={styles.sectionHeaderMeta}>개요를 불러오는 중입니다.</div>
        </div>
      </div>
      <div className={`${styles.sectionBody} ${styles.kpiPanelBody}`}>
        <div className={styles.contentTableSkeleton} aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`overview-skeleton-${index + 1}`} className={styles.contentTableSkeletonRow}>
              <span className={styles.contentTableSkeletonLine} />
              <span className={`${styles.contentTableSkeletonLine} ${styles.contentTableSkeletonLineMedium}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminOverviewSection({ currentUserId }: AdminOverviewSectionProps) {
  const state = useAdminOverviewSectionState(currentUserId);

  if (state.isInitialLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>운영 개요</h2>
            <div className={styles.sectionHeaderMeta}>마지막 갱신 {formatSyncTimestamp(state.lastSyncedAt)}</div>
          </div>
          <div className={styles.sectionHeaderActions}>
            <button type="button" className="app-button app-button-secondary" onClick={() => void state.refreshOverview({ force: true })} disabled={state.isRefreshing}>
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
        title="20억 이상 발송 대상 현장"
        rows={state.overview.priorityTargetSiteRows ?? []}
        emptyLabel="현재 우선 발송 대상으로 분류된 현장이 없습니다."
      />
      <OverviewDispatchQueueTable
        title="현장대리인 메일 미등록 현장"
        rows={state.overview.recipientMissingSiteRows ?? []}
        emptyLabel="현재 메일 정보 보완이 필요한 현장이 없습니다."
      />
      <OverviewDispatchQueueTable
        title="발송 필요하지만 아직 미발송인 현장"
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
