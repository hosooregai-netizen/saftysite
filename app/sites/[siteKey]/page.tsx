'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import {
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
  getSiteDisplayTitle,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import styles from './page.module.css';

const ASSIGNED_SITES_ENABLED = true;

function formatDateTime(value: string | null): string {
  if (!value) return '기록 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

type ReportDialogState = { type: 'delete'; sessionId: string } | null;

interface SiteReportsPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default function SiteReportsPage({ params }: SiteReportsPageProps) {
  const { siteKey } = use(params);
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(siteKey);
  const { sites, sessions, isReady, createSession, deleteSession } = useInspectionSessions();
  const [dialogState, setDialogState] = useState<ReportDialogState>(null);

  const currentSite = useMemo(
    () =>
      ASSIGNED_SITES_ENABLED
        ? sites.find((site) => site.id === decodedSiteKey) ?? null
        : null,
    [decodedSiteKey, sites]
  );

  const siteSessions = useMemo(
    () => sessions.filter((session) => getSessionSiteKey(session) === decodedSiteKey),
    [decodedSiteKey, sessions]
  );

  const handleCreateReport = () => {
    if (!currentSite) return;

    const nextSession = createSession(currentSite, {
      meta: {
        siteName: currentSite.siteName,
        drafter: currentSite.assigneeName,
      },
    });

    router.push(`/sessions/${nextSession.id}`);
  };

  const submitDeleteSession = () => {
    if (!dialogState || dialogState.type !== 'delete') return;
    deleteSession(dialogState.sessionId);
    setDialogState(null);
  };

  const deletingSession =
    dialogState?.type === 'delete'
      ? siteSessions.find((session) => session.id === dialogState.sessionId) ?? null
      : null;

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>보고서 목록을 불러오는 중입니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>해당 현장을 찾을 수 없습니다.</p>
              <Link href="/" className="app-button app-button-secondary">
                현장 목록으로
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <div className={styles.heroMain}>
              <Link href="/" className={styles.backLink}>
                현장 목록으로
              </Link>
              <div className={styles.heroTitleRow}>
                <div>
                  <h1 className={styles.heroTitle}>{currentSite.siteName}</h1>
                  <p className={styles.heroDescription}>
                    {getSiteDisplayTitle(currentSite)}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.heroActions}>
              <span className="app-chip">총 {siteSessions.length}건 보고서</span>
              <button
                type="button"
                onClick={handleCreateReport}
                className="app-button app-button-primary"
              >
                새 보고서 시작
              </button>
            </div>
          </header>

          <div className={styles.pageGrid}>
            <section className={styles.panel}>
              {siteSessions.length > 0 ? (
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
                            <span className={styles.dataValue}>
                              {session.meta.reportDate || '미입력'}
                            </span>
                          </div>

                          <div className={`${styles.dataCell} ${styles.drafterCell}`}>
                            <span className={styles.mobileLabel}>작성자</span>
                            <span className={styles.dataValue}>
                              {session.meta.drafter || currentSite.assigneeName || '미입력'}
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
                            <span className={styles.dataValue}>
                              {formatDateTime(session.lastSavedAt)}
                            </span>
                          </div>

                          <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                            <Link href={sessionHref} className="app-button app-button-primary">
                              이어서 작성
                            </Link>
                            <button
                              type="button"
                              className="app-button app-button-danger"
                              onClick={() =>
                                setDialogState({ type: 'delete', sessionId: session.id })
                              }
                            >
                              삭제
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>아직 작성된 보고서가 없습니다.</p>
                  <button
                    type="button"
                    onClick={handleCreateReport}
                    className="app-button app-button-primary"
                  >
                    첫 보고서 시작
                  </button>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      <AppModal
        open={dialogState?.type === 'delete'}
        title="보고서 삭제"
        onClose={() => setDialogState(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setDialogState(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              onClick={submitDeleteSession}
            >
              삭제
            </button>
          </>
        }
      >
        <p>
          {deletingSession
            ? `"${getSessionTitle(deletingSession)}" 보고서를 삭제합니다.`
            : '선택한 보고서를 삭제합니다.'}
        </p>
      </AppModal>
    </main>
  );
}
