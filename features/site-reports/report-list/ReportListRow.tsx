'use client';

import Link from 'next/link';
import ActionMenu from '@/components/ui/ActionMenu';
import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import { formatDateTime } from '@/lib/formatDateTime';
import {
  isLegacyTechnicalGuidanceCreateTarget,
  isLegacyTechnicalGuidanceReportItem,
} from '@/lib/siteReports/legacyTechnicalGuidance';
import type { InspectionReportListItem, InspectionSite } from '@/types/inspectionSession';
import { getReportDrafterDisplay } from './reportListHelpers';

interface ReportListRowProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  currentSite: InspectionSite;
  item: InspectionReportListItem;
  onDeleteRequest: (reportKey: string) => void;
  onOpenReport: (item: InspectionReportListItem) => void;
  onToggleDispatch: (item: InspectionReportListItem) => void;
  onWarmReport: (item: InspectionReportListItem) => void;
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
  onToggleDispatch,
  onWarmReport,
}: ReportListRowProps) {
  const progressRate = Math.max(0, Math.min(100, item.progressRate ?? 0));
  const isLegacyTechnicalGuidance = isLegacyTechnicalGuidanceReportItem(item);
  const isLegacyCreateTarget = isLegacyTechnicalGuidanceCreateTarget(item);
  const sessionHref = isLegacyCreateTarget
    ? undefined
    : item.reportOpenHref || `/sessions/${item.reportKey}`;
  const canToggleDispatch = !item.readOnly || isLegacyTechnicalGuidance;
  const menuItems = [
    ...(isLegacyCreateTarget
      ? [{ label: '문서 생성', onSelect: () => onOpenReport(item) }]
      : []),
    { label: '열기', href: sessionHref },
    ...(canToggleDispatch
      ? [
          {
            label: item.dispatchCompleted ? '미발송으로 변경' : '발송으로 변경',
            onSelect: () => onToggleDispatch(item),
          },
        ]
      : []),
    ...(!item.readOnly && canArchiveReports
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
      onPointerEnter={() => onWarmReport(item)}
      onFocus={() => onWarmReport(item)}
      onClick={(event) => {
        if (shouldIgnoreRowClick(event.target)) return;
        onOpenReport(item);
      }}
      onKeyDown={(event) => {
        if (shouldIgnoreRowClick(event.target)) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpenReport(item);
      }}
    >
      <div className={`${styles.dataCell} ${styles.roundCell}`}>
        <span className={styles.dataValue}>{item.visitRound ?? '-'}</span>
      </div>

      <div className={`${styles.primaryCell} ${styles.titleCell}`}>
        {isLegacyCreateTarget ? (
          <button
            type="button"
            className={`${styles.reportLink} ${styles.reportLinkButton}`}
            onClick={() => onOpenReport(item)}
            onMouseEnter={() => onWarmReport(item)}
            onFocus={() => onWarmReport(item)}
          >
            {item.reportTitle}
          </button>
        ) : (
          <Link
            href={sessionHref || `/sessions/${item.reportKey}`}
            className={styles.reportLink}
            onMouseEnter={() => onWarmReport(item)}
            onFocus={() => onWarmReport(item)}
          >
            {item.reportTitle}
          </Link>
        )}
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
        <span className={styles.dataValue}>
          {item.dispatchCompleted ? '발송완료' : '미발송'}
        </span>
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
