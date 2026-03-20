import Link from 'next/link';
import type { SiteSummary } from '@/components/home/siteSummaries';

interface AssignedSitesTableProps {
  siteSummaries: SiteSummary[];
  styles: Record<string, string>;
  formatDateTime: (value: string | null) => string;
}

export default function AssignedSitesTable({
  siteSummaries,
  styles,
  formatDateTime,
}: AssignedSitesTableProps) {
  if (siteSummaries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>배정된 현장이 없습니다.</p>
        <p className={styles.emptyDescription}>
          현재 로그인한 계정에 연결된 현장이 없거나, 배정 데이터가 아직 등록되지
          않았습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.listHead} aria-hidden="true">
        <span>고객사명</span>
        <span>현장명</span>
        <span>담당</span>
        <span>최근 작성일</span>
        <span>보고서 수</span>
        <span>마지막 저장</span>
        <span>작업</span>
      </div>

      <div className={styles.siteList}>
        {siteSummaries.map(({ site, latestSession, sessionCount }) => {
          const siteHref = `/sites/${encodeURIComponent(site.id)}`;

          return (
            <article key={site.id} className={styles.siteRow}>
              <div className={`${styles.cell} ${styles.customerCell}`}>
                <span className={styles.mobileLabel}>고객사명</span>
                <span className={styles.cellValue}>{site.customerName || '미입력'}</span>
              </div>

              <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
                <span className={styles.mobileLabel}>현장명</span>
                <Link href={siteHref} className={styles.siteLink}>
                  {site.siteName || '미입력'}
                </Link>
              </div>

              <div className={`${styles.cell} ${styles.assigneeCell}`}>
                <span className={styles.mobileLabel}>담당</span>
                <span className={styles.cellValue}>{site.assigneeName || '미입력'}</span>
              </div>

              <div className={`${styles.cell} ${styles.dateCell}`}>
                <span className={styles.mobileLabel}>최근 작성일</span>
                <span className={styles.cellValue}>{latestSession?.meta.reportDate || '-'}</span>
              </div>

              <div className={`${styles.cell} ${styles.countCell}`}>
                <span className={styles.mobileLabel}>보고서 수</span>
                <span className={styles.cellValue}>{sessionCount}건</span>
              </div>

              <div className={`${styles.cell} ${styles.savedCell}`}>
                <span className={styles.mobileLabel}>마지막 저장</span>
                <span className={styles.cellValue}>
                  {latestSession ? formatDateTime(latestSession.lastSavedAt) : '-'}
                </span>
              </div>

              <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                <Link href={siteHref} className="app-button app-button-primary">
                  보고서 보기
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
