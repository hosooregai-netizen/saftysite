import Link from 'next/link';
import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu';
import { getSessionGuidanceDate } from '@/constants/inspectionSession';
import { formatDateTime } from '@/lib/formatDateTime';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import styles from './HomeScreen.module.css';

function formatCompactReportDate(value: string | null | undefined): string {
  if (!value) return '-';
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized;
  return `${match[2]}.${match[3]}`;
}

interface AssignedSitesTableRowProps {
  actionItems: ActionMenuItem[];
  assigneeDisplay: string;
  siteHref: string;
  summary: HomeSiteSummary;
}

export function AssignedSitesTableRow({
  actionItems,
  assigneeDisplay,
  siteHref,
  summary,
}: AssignedSitesTableRowProps) {
  const { site, latestProgress, latestSession, sessionCount } = summary;
  const progressLabel =
    latestProgress >= 100 ? '완료' : latestProgress > 0 ? '진행중' : '미작성';

  return (
    <article className={styles.siteRow}>
      <div className={`${styles.cell} ${styles.customerCell}`}>
        <span className={styles.cellValue}>{site.customerName || '미입력'}</span>
      </div>
      <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
        <Link href={siteHref} className={styles.siteLink}>
          {site.siteName || '미입력'}
        </Link>
      </div>
      <div className={`${styles.cell} ${styles.assigneeCell} ${styles.desktopOnly}`}>
        <span className={styles.cellValue}>{assigneeDisplay || site.assigneeName || '미입력'}</span>
      </div>
      <div className={`${styles.cell} ${styles.statusCell} ${styles.desktopOnly}`}>
        <span className={styles.cellValue}>{progressLabel}</span>
      </div>
      <div className={`${styles.cell} ${styles.dateCell}`}>
        <span className={`${styles.cellValue} ${styles.desktopDate}`}>
          {latestSession ? getSessionGuidanceDate(latestSession) || '-' : '-'}
        </span>
        <span className={`${styles.cellValue} ${styles.compactDate}`}>
          {formatCompactReportDate(latestSession ? getSessionGuidanceDate(latestSession) : null)}
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
        <ActionMenu items={actionItems} label={`${site.siteName || '현장'} 작업 메뉴 열기`} />
      </div>
    </article>
  );
}
