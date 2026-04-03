'use client';

import { useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ActionMenu from '@/components/ui/ActionMenu';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { formatDateTime } from '@/lib/formatDateTime';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';
import styles from './SiteReportsScreen.module.css';

interface ReportListProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  canCreateReport: boolean;
  currentSite: InspectionSite;
  onCreateReport: () => void;
  onDeleteRequest: (reportKey: string) => void;
  reportIndexStatus: ReportIndexStatus;
  reportItems: InspectionReportListItem[];
  totalReportCount: number;
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

function getDrafterDisplay(
  item: InspectionReportListItem,
  assignedUserDisplay: string | undefined,
  currentSite: InspectionSite,
) {
  return (
    (typeof item.meta.drafter === 'string' && item.meta.drafter) ||
    assignedUserDisplay ||
    currentSite.assigneeName ||
    '미입력'
  );
}

export function ReportList({
  assignedUserDisplay,
  canArchiveReports,
  canCreateReport,
  currentSite,
  onCreateReport,
  onDeleteRequest,
  reportIndexStatus,
  reportItems,
  totalReportCount,
}: ReportListProps) {
  const router = useRouter();
  const { ensureSessionLoaded } = useInspectionSessions();
  const prefetchedReportKeysRef = useRef<Set<string>>(new Set());

  const warmSession = useCallback(
    (reportKey: string) => {
      if (prefetchedReportKeysRef.current.has(reportKey)) {
        return;
      }

      prefetchedReportKeysRef.current.add(reportKey);
      void ensureSessionLoaded(reportKey).catch(() => {
        prefetchedReportKeysRef.current.delete(reportKey);
      });
    },
    [ensureSessionLoaded],
  );

  if (
    (reportIndexStatus === 'idle' || reportIndexStatus === 'loading') &&
    totalReportCount === 0
  ) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>보고서 목록을 불러오는 중입니다.</p>
      </div>
    );
  }

  if (reportIndexStatus === 'error' && totalReportCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>보고서 목록을 아직 불러오지 못했습니다.</p>
        <p className={styles.emptySearchHint}>
          다시 불러오기를 눌러 목록을 새로 받아오세요.
        </p>
      </div>
    );
  }

  if (totalReportCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>아직 작성한 보고서가 없습니다.</p>
        {canCreateReport ? (
          <button
            type="button"
            onClick={onCreateReport}
            className="app-button app-button-primary"
          >
            첫 보고서 작성
          </button>
        ) : null}
      </div>
    );
  }

  if (reportItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>검색 조건에 맞는 보고서가 없습니다.</p>
        <p className={styles.emptySearchHint}>
          검색어나 정렬을 바꿔 다시 시도해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listViewport}>
      <div className={styles.listTrack}>
        <div className={styles.listHead} aria-hidden="true">
          <span>차수</span>
          <span>보고서명</span>
          <span className={styles.desktopOnly}>지도일</span>
          <span>작성자</span>
          <span>진행률</span>
          <span className={styles.desktopOnly}>마지막 저장</span>
          <span>메뉴</span>
        </div>

        <div className={styles.reportList}>
          {reportItems.map((item) => {
            const progressRate = Math.max(0, Math.min(100, item.progressRate ?? 0));
            const sessionHref = `/sessions/${item.reportKey}`;
            const menuItems = [
              { label: '이어서 작성', href: sessionHref },
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
                key={item.reportKey}
                className={`${styles.reportRow} ${styles.reportRowClickable}`}
                tabIndex={0}
                role="link"
                onPointerEnter={() => {
                  router.prefetch(sessionHref);
                  warmSession(item.reportKey);
                }}
                onFocus={() => {
                  router.prefetch(sessionHref);
                  warmSession(item.reportKey);
                }}
                onClick={(event) => {
                  if (shouldIgnoreRowClick(event.target)) return;
                  warmSession(item.reportKey);
                  router.push(sessionHref);
                }}
                onKeyDown={(event) => {
                  if (shouldIgnoreRowClick(event.target)) return;
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  warmSession(item.reportKey);
                  router.push(sessionHref);
                }}
              >
                <div className={`${styles.dataCell} ${styles.roundCell}`}>
                  <span className={styles.dataValue}>{item.visitRound ?? '-'}</span>
                </div>

                <div className={`${styles.primaryCell} ${styles.titleCell}`}>
                  <Link
                    href={sessionHref}
                    className={styles.reportLink}
                    onMouseEnter={() => {
                      router.prefetch(sessionHref);
                      warmSession(item.reportKey);
                    }}
                    onFocus={() => {
                      router.prefetch(sessionHref);
                      warmSession(item.reportKey);
                    }}
                  >
                    {item.reportTitle}
                  </Link>
                </div>

                <div
                  className={`${styles.dataCell} ${styles.reportDateCell} ${styles.desktopOnly}`}
                >
                  <span className={styles.dataValue}>{item.visitDate || '미입력'}</span>
                </div>

                <div className={`${styles.dataCell} ${styles.drafterCell}`}>
                  <span className={styles.dataValue}>
                    {getDrafterDisplay(item, assignedUserDisplay, currentSite)}
                  </span>
                </div>

                <div className={`${styles.progressCell} ${styles.progressArea}`}>
                  <div className={styles.progressStack}>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <span
                        className={styles.progressFill}
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>{Math.round(progressRate)}%</span>
                  </div>
                </div>

                <div
                  className={`${styles.dataCell} ${styles.lastSavedCell} ${styles.desktopOnly}`}
                >
                  <span className={styles.dataValue}>
                    {formatDateTime(item.lastAutosavedAt || item.updatedAt)}
                  </span>
                </div>

                <div
                  className={`${styles.actionCell} ${styles.actionsCell}`}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <ActionMenu
                    items={menuItems}
                    label={`${item.reportTitle} 작업 메뉴 열기`}
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
