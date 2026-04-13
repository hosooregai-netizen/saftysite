import { type ActionMenuItem } from '@/components/ui/ActionMenu';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import { AssignedSitesTableRow } from './AssignedSitesTableRow';
import { AssignedSitesTableSkeleton } from './AssignedSitesTableSkeleton';
import styles from './HomeScreen.module.css';
export interface AssignedSitesTableProps {
  buildActionMenuItems?: (summary: HomeSiteSummary) => ActionMenuItem[];
  currentUserName?: string;
  currentUserPosition?: string | null;
  getSiteHref?: (summary: HomeSiteSummary) => string;
  isLoading?: boolean;
  siteSummaries: HomeSiteSummary[];
}

export function AssignedSitesTable({
  buildActionMenuItems,
  currentUserName,
  currentUserPosition,
  getSiteHref,
  isLoading = false,
  siteSummaries,
}: AssignedSitesTableProps) {
  const assigneeDisplay = [currentUserName, currentUserPosition].filter(Boolean).join(' / ');

  if (isLoading) {
    return <AssignedSitesTableSkeleton />;
  }

  if (siteSummaries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>배정된 현장이 없습니다.</p>
        <p className={styles.emptyDescription}>
          현재 로그인한 계정에 연결된 현장 데이터가 아직 등록되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listViewport}>
      <div className={styles.listTrack}>
        <div className={styles.listHead} aria-hidden="true">
          <span>고객명</span>
          <span>현장명</span>
          <span className={styles.desktopOnly}>담당</span>
          <span className={styles.desktopOnly}>진행상태</span>
          <span>최근 지도일</span>
          <span>보고서 수</span>
          <span className={styles.desktopOnly}>마지막 저장</span>
          <span>메뉴</span>
        </div>

        <div className={styles.siteList}>
          {siteSummaries.map((summary) => {
            const { site } = summary;
            const siteHref =
              getSiteHref?.(summary) ?? `/sites/${encodeURIComponent(site.id)}`;
            const actionItems =
              buildActionMenuItems?.(summary) ?? [{ label: '보고서 목록', href: siteHref }];

            return (
              <AssignedSitesTableRow
                key={site.id}
                actionItems={actionItems}
                assigneeDisplay={assigneeDisplay}
                siteHref={siteHref}
                summary={summary}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
