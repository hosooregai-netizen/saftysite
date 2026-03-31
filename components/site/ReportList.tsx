'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ActionMenu from '@/components/ui/ActionMenu';
import { getSessionProgress, getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface ReportListProps {
  assignedUserDisplay?: string;
  currentSite: InspectionSite;
  /** 검색·정렬이 적용된 목록 */
  siteSessions: InspectionSession[];
  /** 필터 전 전체 보고서 수(빈 현장 vs 검색 무결과 구분) */
  totalSessionCount: number;
  canArchiveReports: boolean;
  formatDateTime: (value: string | null) => string;
  onCreateReport: () => void;
  onDeleteRequest: (sessionId: string) => void;
  styles: Record<string, string>;
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

export default function ReportList({
  assignedUserDisplay,
  currentSite,
  siteSessions,
  totalSessionCount,
  canArchiveReports,
  formatDateTime,
  onCreateReport,
  onDeleteRequest,
  styles,
}: ReportListProps) {
  const router = useRouter();

  if (totalSessionCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>아직 작성된 보고서가 없습니다.</p>
        <button
          type="button"
          onClick={onCreateReport}
          className="app-button app-button-primary"
        >
          첫 보고서 시작
        </button>
      </div>
    );
  }

  if (siteSessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>검색 조건에 맞는 보고서가 없습니다.</p>
        <p className={styles.emptySearchHint}>검색어나 정렬을 바꿔 다시 시도해 보세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.listViewport}>
      <div className={styles.listTrack}>
        <div className={styles.listHead} aria-hidden="true">
          <span>보고서명</span>
          <span className={styles.desktopOnly}>작업일</span>
          <span>작성자</span>
          <span>진행률</span>
          <span className={styles.desktopOnly}>마지막 저장</span>
          <span>메뉴</span>
        </div>

        <div className={styles.reportList}>
          {siteSessions.map((session) => {
            const progress = getSessionProgress(session);
            const sessionHref = `/sessions/${session.id}`;
            const menuItems = [
              { label: '이어서 작성', href: sessionHref },
              ...(canArchiveReports
                ? [
                    {
                      label: '삭제',
                      tone: 'danger' as const,
                      onSelect: () => onDeleteRequest(session.id),
                    },
                  ]
                : []),
            ];

            return (
              <article
                key={session.id}
                className={`${styles.reportRow} ${styles.reportRowClickable ?? ''}`}
                tabIndex={0}
                role="link"
                onClick={(event) => {
                  if (shouldIgnoreRowClick(event.target)) return;
                  router.push(sessionHref);
                }}
                onKeyDown={(event) => {
                  if (shouldIgnoreRowClick(event.target)) return;
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  router.push(sessionHref);
                }}
              >
                <div className={`${styles.primaryCell} ${styles.titleCell}`}>
                  <Link href={sessionHref} className={styles.reportLink}>
                    {getSessionTitle(session)}
                  </Link>
                </div>

                <div className={`${styles.dataCell} ${styles.reportDateCell} ${styles.desktopOnly}`}>
                  <span className={styles.dataValue}>{session.meta.reportDate || '미입력'}</span>
                </div>

                <div className={`${styles.dataCell} ${styles.drafterCell}`}>
                  <span className={styles.dataValue}>
                    {session.meta.drafter ||
                      assignedUserDisplay ||
                      currentSite.assigneeName ||
                      '미입력'}
                  </span>
                </div>

                <div className={`${styles.progressCell} ${styles.progressArea}`}>
                  <div className={styles.progressStack}>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <span
                        className={styles.progressFill}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {progress.completed}/{progress.total}
                      <span className={styles.desktopProgressSuffix}> 완료</span>
                    </span>
                  </div>
                </div>

                <div className={`${styles.dataCell} ${styles.lastSavedCell} ${styles.desktopOnly}`}>
                  <span className={styles.dataValue}>{formatDateTime(session.lastSavedAt)}</span>
                </div>

                <div
                  className={`${styles.actionCell} ${styles.actionsCell}`}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <ActionMenu
                    items={menuItems}
                    label={`${getSessionTitle(session)} 작업 메뉴 열기`}
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

