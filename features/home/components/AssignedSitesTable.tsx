import Link from 'next/link';
import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu';
import { getSessionGuidanceDate } from '@/constants/inspectionSession';
import { formatDateTime } from '@/lib/formatDateTime';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import styles from './HomeScreen.module.css';

interface AssignedSitesTableProps {
  buildActionMenuItems?: (summary: HomeSiteSummary) => ActionMenuItem[];
  currentUserName?: string;
  currentUserPosition?: string | null;
  getSiteHref?: (summary: HomeSiteSummary) => string;
  isLoading?: boolean;
  siteSummaries: HomeSiteSummary[];
}

function formatCompactReportDate(value: string | null | undefined): string {
  if (!value) return '-';

  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return normalized;
  }

  return `${match[2]}.${match[3]}`;
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
    return (
      <div className={styles.listViewport} aria-busy="true">
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
            {Array.from({ length: 5 }).map((_, index) => (
              <article
                key={`assigned-site-skeleton-${index + 1}`}
                className={`${styles.siteRow} ${styles.siteRowLoading}`}
                aria-hidden="true"
              >
                <div className={`${styles.cell} ${styles.customerCell}`}>
                  <span
                    className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonShort}`}
                  />
                </div>

                <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
                  <span className={`${styles.loadingSkeleton} ${styles.loadingSkeletonLong}`} />
                </div>

                <div className={`${styles.cell} ${styles.assigneeCell} ${styles.desktopOnly}`}>
                  <span
                    className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonShort}`}
                  />
                </div>

                <div className={`${styles.cell} ${styles.statusCell} ${styles.desktopOnly}`}>
                  <span
                    className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonTiny}`}
                  />
                </div>

                <div className={`${styles.cell} ${styles.dateCell}`}>
                  <span
                    className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonTiny}`}
                  />
                </div>

                <div className={`${styles.cell} ${styles.countCell}`}>
                  <span
                    className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonTiny}`}
                  />
                </div>

                <div className={`${styles.cell} ${styles.savedCell} ${styles.desktopOnly}`}>
                  <span
                    className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonShort}`}
                  />
                </div>

                <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                  <span
                    className={`${styles.loadingSkeleton} ${styles.loadingSkeletonIcon}`}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
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
            const { site, latestProgress, latestSession, sessionCount } = summary;
            const siteHref =
              getSiteHref?.(summary) ?? `/sites/${encodeURIComponent(site.id)}`;
            const progressLabel =
              latestProgress >= 100 ? '완료' : latestProgress > 0 ? '진행중' : '미작성';
            const actionItems =
              buildActionMenuItems?.(summary) ?? [{ label: '보고서 목록', href: siteHref }];

            return (
              <article key={site.id} className={styles.siteRow}>
                <div className={`${styles.cell} ${styles.customerCell}`}>
                  <span className={styles.cellValue}>{site.customerName || '미입력'}</span>
                </div>

                <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
                  <Link href={siteHref} className={styles.siteLink}>
                    {site.siteName || '미입력'}
                  </Link>
                </div>

                <div className={`${styles.cell} ${styles.assigneeCell} ${styles.desktopOnly}`}>
                  <span className={styles.cellValue}>
                    {assigneeDisplay || site.assigneeName || '미입력'}
                  </span>
                </div>

                <div className={`${styles.cell} ${styles.statusCell} ${styles.desktopOnly}`}>
                  <span className={styles.cellValue}>{progressLabel}</span>
                </div>

                <div className={`${styles.cell} ${styles.dateCell}`}>
                  <span className={`${styles.cellValue} ${styles.desktopDate}`}>
                    {latestSession ? getSessionGuidanceDate(latestSession) || '-' : '-'}
                  </span>
                  <span className={`${styles.cellValue} ${styles.compactDate}`}>
                    {formatCompactReportDate(
                      latestSession ? getSessionGuidanceDate(latestSession) : null,
                    )}
                  </span>
                </div>

                <div className={`${styles.cell} ${styles.countCell}`}>
                  <span className={styles.cellValue}>{sessionCount}건</span>
                </div>

                <div className={`${styles.cell} ${styles.savedCell} ${styles.desktopOnly}`}>
                  <span className={styles.cellValue}>
                    {latestSession ? formatDateTime(latestSession.lastSavedAt) : '-'}
                  </span>
                </div>

                <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                  <ActionMenu
                    items={actionItems}
                    label={`${site.siteName || '현장'} 작업 메뉴 열기`}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
