import Link from 'next/link';
import type { SiteSummary } from '@/components/home/siteSummaries';
import ActionMenu from '@/components/ui/ActionMenu';

interface AssignedSitesTableProps {
  currentUserName?: string;
  currentUserPosition?: string | null;
  siteSummaries: SiteSummary[];
  styles: Record<string, string>;
  formatDateTime: (value: string | null) => string;
}

export default function AssignedSitesTable({
  currentUserName,
  currentUserPosition,
  siteSummaries,
  styles,
  formatDateTime,
}: AssignedSitesTableProps) {
  const assigneeDisplay = [currentUserName, currentUserPosition]
    .filter(Boolean)
    .join(' / ');

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
          <span>고객사명</span>
          <span>현장명</span>
          <span>담당</span>
          <span>진행상태</span>
          <span>최근 작성일</span>
          <span>보고서 수</span>
          <span>마지막 저장</span>
          <span>작업</span>
        </div>

        <div className={styles.siteList}>
          {siteSummaries.map(({ site, latestProgress, latestSession, sessionCount }) => {
            const siteHref = `/sites/${encodeURIComponent(site.id)}`;
            const progressLabel =
              latestProgress >= 100 ? '완료' : latestProgress > 0 ? '진행중' : '미작성';

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

                <div className={`${styles.cell} ${styles.assigneeCell}`}>
                  <span className={styles.cellValue}>
                    {assigneeDisplay || site.assigneeName || '미입력'}
                  </span>
                </div>

                <div className={`${styles.cell} ${styles.statusCell}`}>
                  <span className={styles.cellValue}>{progressLabel}</span>
                </div>

                <div className={`${styles.cell} ${styles.dateCell}`}>
                  <span className={styles.cellValue}>{latestSession?.meta.reportDate || '-'}</span>
                </div>

                <div className={`${styles.cell} ${styles.countCell}`}>
                  <span className={styles.cellValue}>{sessionCount}건</span>
                </div>

                <div className={`${styles.cell} ${styles.savedCell}`}>
                  <span className={styles.cellValue}>
                    {latestSession ? formatDateTime(latestSession.lastSavedAt) : '-'}
                  </span>
                </div>

                <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                  <ActionMenu
                    items={[{ label: '보고서 보기', href: siteHref }]}
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
