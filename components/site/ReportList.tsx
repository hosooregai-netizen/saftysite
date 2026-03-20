import Link from 'next/link';
import { getSessionProgress, getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface ReportListProps {
  assignedUserDisplay?: string;
  currentSite: InspectionSite;
  siteSessions: InspectionSession[];
  canArchiveReports: boolean;
  formatDateTime: (value: string | null) => string;
  onCreateReport: () => void;
  onDeleteRequest: (sessionId: string) => void;
  styles: Record<string, string>;
}

export default function ReportList({
  assignedUserDisplay,
  currentSite,
  siteSessions,
  canArchiveReports,
  formatDateTime,
  onCreateReport,
  onDeleteRequest,
  styles,
}: ReportListProps) {
  if (siteSessions.length === 0) {
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

  return (
    <>
      <div className={styles.listHead} aria-hidden="true">
        <span>보고서명</span>
        <span>작성일</span>
        <span>작성자</span>
        <span>진행률</span>
        <span>마지막 저장</span>
        <span>작업</span>
      </div>

      <div className={styles.reportList}>
        {siteSessions.map((session) => {
          const progress = getSessionProgress(session);
          const sessionHref = `/sessions/${session.id}`;

          return (
            <article key={session.id} className={styles.reportRow}>
              <div className={`${styles.primaryCell} ${styles.titleCell}`}>
                <span className={styles.mobileLabel}>보고서명</span>
                <Link href={sessionHref} className={styles.reportLink}>
                  {getSessionTitle(session)}
                </Link>
              </div>

              <div className={`${styles.dataCell} ${styles.reportDateCell}`}>
                <span className={styles.mobileLabel}>작성일</span>
                <span className={styles.dataValue}>{session.meta.reportDate || '미입력'}</span>
              </div>

              <div className={`${styles.dataCell} ${styles.drafterCell}`}>
                <span className={styles.mobileLabel}>작성자</span>
                <span className={styles.dataValue}>
                  {session.meta.drafter || assignedUserDisplay || currentSite.assigneeName || '미입력'}
                </span>
              </div>

              <div className={`${styles.progressCell} ${styles.progressArea}`}>
                <span className={styles.mobileLabel}>진행률</span>
                <div className={styles.progressStack}>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <span
                      className={styles.progressFill}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {progress.completed}/{progress.total} 완료
                  </span>
                </div>
              </div>

              <div className={`${styles.dataCell} ${styles.lastSavedCell}`}>
                <span className={styles.mobileLabel}>마지막 저장</span>
                <span className={styles.dataValue}>{formatDateTime(session.lastSavedAt)}</span>
              </div>

              <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                <Link href={sessionHref} className="app-button app-button-primary">
                  이어서 작성
                </Link>
                {canArchiveReports ? (
                  <button
                    type="button"
                    className="app-button app-button-danger"
                    onClick={() => onDeleteRequest(session.id)}
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
