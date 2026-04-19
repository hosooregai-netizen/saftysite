import Link from 'next/link';
import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu';
import { formatDateTime } from '@/lib/formatDateTime';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import styles from './HomeScreen.module.css';

const LABEL_UNSET = '\uBBF8\uC785\uB825';
const LABEL_SYNCING = '\uB3D9\uAE30\uD654 \uC911';
const LABEL_NEEDS_ATTENTION = '\uD655\uC778 \uD544\uC694';
const LABEL_NOT_STARTED = '\uBBF8\uC791\uC131';
const LABEL_IN_PROGRESS = '\uC9C4\uD589\uC911';
const LABEL_COMPLETE = '\uC644\uB8CC';
const LABEL_SITE = '\uD604\uC7A5';
const LABEL_OPEN_ACTION_MENU = '\uC791\uC5C5 \uBA54\uB274 \uC5F4\uAE30';

function formatCompactReportDate(value: string | null | undefined): string {
  if (!value) return '-';
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized;
  return `${match[2]}.${match[3]}`;
}

function getProgressLabel(progressRate: number | null) {
  if (typeof progressRate !== 'number') {
    return LABEL_NOT_STARTED;
  }
  if (progressRate >= 100) {
    return LABEL_COMPLETE;
  }
  if (progressRate > 0) {
    return LABEL_IN_PROGRESS;
  }
  return LABEL_NOT_STARTED;
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
  const {
    site,
    latestReportLastSavedAt,
    latestReportProgressRate,
    latestReportVisitDate,
    reportCount,
    reportSyncStatus,
  } = summary;
  const hasResolvedReportIndex = reportSyncStatus === 'loaded';
  const unresolvedLabel =
    reportSyncStatus === 'error' ? LABEL_NEEDS_ATTENTION : LABEL_SYNCING;
  const progressLabel = hasResolvedReportIndex
    ? getProgressLabel(latestReportProgressRate)
    : unresolvedLabel;
  const countLabel = hasResolvedReportIndex ? `${reportCount}\uAC74` : unresolvedLabel;
  const reportDate = hasResolvedReportIndex ? latestReportVisitDate : null;
  const savedLabel = hasResolvedReportIndex
    ? formatDateTime(latestReportLastSavedAt, '-')
    : unresolvedLabel;

  return (
    <article className={styles.siteRow}>
      <div className={`${styles.cell} ${styles.customerCell}`}>
        <span className={styles.cellValue}>{site.customerName || LABEL_UNSET}</span>
      </div>
      <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
        <Link href={siteHref} className={styles.siteLink}>
          {site.siteName || LABEL_UNSET}
        </Link>
      </div>
      <div className={`${styles.cell} ${styles.assigneeCell} ${styles.desktopOnly}`}>
        <span className={styles.cellValue}>{assigneeDisplay || site.assigneeName || LABEL_UNSET}</span>
      </div>
      <div className={`${styles.cell} ${styles.statusCell} ${styles.desktopOnly}`}>
        <span className={styles.cellValue}>{progressLabel}</span>
      </div>
      <div className={`${styles.cell} ${styles.dateCell}`}>
        <span className={`${styles.cellValue} ${styles.desktopDate}`}>
          {hasResolvedReportIndex ? reportDate || '-' : unresolvedLabel}
        </span>
        <span className={`${styles.cellValue} ${styles.compactDate}`}>
          {hasResolvedReportIndex ? formatCompactReportDate(reportDate) : unresolvedLabel}
        </span>
      </div>
      <div className={`${styles.cell} ${styles.countCell}`}>
        <span className={styles.cellValue}>{countLabel}</span>
      </div>
      <div className={`${styles.cell} ${styles.savedCell} ${styles.desktopOnly}`}>
        <span className={styles.cellValue}>{savedLabel}</span>
      </div>
      <div className={`${styles.actionCell} ${styles.actionsCell}`}>
        <ActionMenu
          items={actionItems}
          label={`${site.siteName || LABEL_SITE} ${LABEL_OPEN_ACTION_MENU}`}
        />
      </div>
    </article>
  );
}
