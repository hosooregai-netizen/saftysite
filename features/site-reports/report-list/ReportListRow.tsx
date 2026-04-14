'use client';

import Link from 'next/link';
import ActionMenu from '@/components/ui/ActionMenu';
import { formatDateTime } from '@/lib/formatDateTime';
import type { InspectionReportListItem, InspectionSite } from '@/types/inspectionSession';
import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import { getReportDrafterDisplay } from './reportListHelpers';

interface ReportListRowProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  currentSite: InspectionSite;
  item: InspectionReportListItem;
  onDeleteRequest: (reportKey: string) => void;
  onOpenReport: (reportKey: string, sessionHref: string) => void;
  onWarmReport: (reportKey: string, sessionHref: string) => void;
}

function shouldIgnoreRowClick(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [role="button"], [role="menu"], [role="menuitem"]',
      ),
    )
  );
}

export function ReportListRow({
  assignedUserDisplay,
  canArchiveReports,
  currentSite,
  item,
  onDeleteRequest,
  onOpenReport,
  onWarmReport,
}: ReportListRowProps) {
  const progressRate = Math.max(0, Math.min(100, item.progressRate ?? 0));
  const sessionHref = `/sessions/${item.reportKey}`;
  const menuItems = [
    { label: '열어 작성', href: sessionHref },
    ...(canArchiveReports
      ? [
          {
            label: '삭제',
            tone: 'danger' as const,
            onSelect: () => onDeleteRequest(item.reportKey),
          },
        ]
      : []),
  ];

  return (
    <article
      className={`${styles.reportRow} ${styles.reportRowClickable}`}
      tabIndex={0}
      role="link"
      onPointerEnter={() => onWarmReport(item.reportKey, sessionHref)}
      onFocus={() => onWarmReport(item.reportKey, sessionHref)}
      onClick={(event) => {
        if (shouldIgnoreRowClick(event.target)) return;
        onOpenReport(item.reportKey, sessionHref);
      }}
      onKeyDown={(event) => {
        if (shouldIgnoreRowClick(event.target)) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpenReport(item.reportKey, sessionHref);
      }}
    >
      <div className={`${styles.dataCell} ${styles.roundCell}`}>
        <span className={styles.dataValue}>{item.visitRound ?? '-'}</span>
      </div>

      <div className={`${styles.primaryCell} ${styles.titleCell}`}>
        <Link
          href={sessionHref}
          className={styles.reportLink}
          onMouseEnter={() => onWarmReport(item.reportKey, sessionHref)}
          onFocus={() => onWarmReport(item.reportKey, sessionHref)}
        >
          {item.reportTitle}
        </Link>
      </div>

      <div className={`${styles.dataCell} ${styles.reportDateCell} ${styles.desktopOnly}`}>
        <span className={styles.dataValue}>{item.visitDate || '미입력'}</span>
      </div>

      <div className={`${styles.dataCell} ${styles.drafterCell}`}>
        <span className={styles.dataValue}>
          {getReportDrafterDisplay(item, assignedUserDisplay, currentSite)}
        </span>
      </div>

      <div className={`${styles.dataCell} ${styles.dispatchStatusCell}`}>
        <span className={styles.dataValue}>{item.dispatchCompleted ? '발송완료' : '미발송'}</span>
      </div>

      <div className={`${styles.progressCell} ${styles.progressArea}`}>
        <div className={styles.progressStack}>
          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: `${progressRate}%` }} />
          </div>
          <span className={styles.progressText}>{Math.round(progressRate)}%</span>
        </div>
      </div>

      <div className={`${styles.dataCell} ${styles.lastSavedCell} ${styles.desktopOnly}`}>
        <span className={styles.dataValue}>
          {formatDateTime(item.lastAutosavedAt || item.updatedAt)}
        </span>
      </div>

      <div
        className={`${styles.actionCell} ${styles.actionsCell}`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <ActionMenu items={menuItems} label={`${item.reportTitle} 작업 메뉴 열기`} />
      </div>
    </article>
  );
}
