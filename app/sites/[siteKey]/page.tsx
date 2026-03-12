'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, use, useEffect, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import {
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import styles from './page.module.css';

interface SiteReportsPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

function formatDateTime(value: string | null): string {
  if (!value) return '기록 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function closeOpenMenus() {
  document
    .querySelectorAll<HTMLDetailsElement>('details[data-menu-root][open]')
    .forEach((element) => element.removeAttribute('open'));
}

function closeMenuFromEvent(event: MouseEvent<HTMLElement>) {
  event.currentTarget.closest('details')?.removeAttribute('open');
}

type ReportDialogState =
  | { type: 'pdf' }
  | { type: 'delete'; sessionId: string }
  | null;

export default function SiteReportsPage({ params }: SiteReportsPageProps) {
  const { siteKey } = use(params);
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(siteKey);
  const { sites, sessions, isReady, createSession, deleteSession } = useInspectionSessions();
  const [dialogState, setDialogState] = useState<ReportDialogState>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-menu-root]')) return;
      closeOpenMenus();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOpenMenus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites]
  );

  const siteSessions = useMemo(
    () => sessions.filter((session) => getSessionSiteKey(session) === decodedSiteKey),
    [decodedSiteKey, sessions]
  );

  const latestSession = siteSessions[0] ?? null;

  const handleCreateReport = () => {
    if (!currentSite) return;

    const nextSession = createSession(
      {
        businessName: currentSite.title,
        projectName: latestSession?.cover.projectName ?? '',
        siteAddress: latestSession?.cover.siteAddress ?? '',
        contractorName: latestSession?.cover.contractorName ?? '',
      },
      currentSite.id
    );

    router.push(`/sessions/${nextSession.id}`);
  };

  const closeDialog = () => setDialogState(null);

  const submitDeleteSession = () => {
    if (!dialogState || dialogState.type !== 'delete') return;
    deleteSession(dialogState.sessionId);
    setDialogState(null);
  };

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
              <p className={styles.heroKicker}>현장 보고서</p>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{currentSite.title}</h1>
              </div>
            </div>

            <div className={styles.heroActions}>
              <span className="app-chip">총 {siteSessions.length}건</span>
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
                    <span>담당</span>
                    <span>진행</span>
                    <span>점검일</span>
                    <span>마지막 저장</span>
                    <span>작업</span>
                  </div>

                  <div className={styles.reportList}>
                    {siteSessions.map((session) => {
                      const progress = getSessionProgress(session);
                      const sessionHref = `/sessions/${session.id}`;
                      const sessionTitle = getSessionTitle(session);

                      return (
                        <article key={session.id} className={styles.reportRow}>
                          <div className={styles.primaryCell}>
                            <Link href={sessionHref} className={styles.reportLink}>
                              <h2 className={styles.reportTitle}>{sessionTitle}</h2>
                            </Link>
                          </div>

                          <div className={styles.dataCell}>
                            <span className={styles.mobileLabel}>담당</span>
                            <span className={styles.dataValue}>
                              {session.cover.consultantName || '미입력'}
                            </span>
                          </div>

                          <div className={styles.progressCell}>
                            <span className={styles.mobileLabel}>진행</span>
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

                          <div className={styles.dataCell}>
                            <span className={styles.mobileLabel}>점검일</span>
                            <span className={styles.dataValue}>
                              {session.cover.inspectionDate || '미입력'}
                            </span>
                          </div>

                          <div className={styles.dataCell}>
                            <span className={styles.mobileLabel}>마지막 저장</span>
                            <span className={styles.dataValue}>
                              {formatDateTime(session.lastSavedAt)}
                            </span>
                          </div>

                          <details className={styles.menuShell} data-menu-root="report-menu">
                            <summary
                              className={styles.menuButton}
                              aria-label={`${sessionTitle} 작업 열기`}
                            >
                              ...
                            </summary>
                            <div className={styles.menuList}>
                              <Link
                                href={sessionHref}
                                className={styles.menuItem}
                                onClick={closeMenuFromEvent}
                              >
                                이어서 작성
                              </Link>
                              <button
                                type="button"
                                className={styles.menuItem}
                                onClick={(event) => {
                                  closeMenuFromEvent(event);
                                  setDialogState({ type: 'pdf' });
                                }}
                              >
                                PDF 출력
                              </button>
                              <button
                                type="button"
                                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                onClick={(event) => {
                                  closeMenuFromEvent(event);
                                  setDialogState({
                                    type: 'delete',
                                    sessionId: session.id,
                                  });
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          </details>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>이 현장에는 아직 보고서가 없습니다.</p>
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
        open={dialogState?.type === 'pdf'}
        title="PDF 출력"
        onClose={closeDialog}
        actions={
          <button type="button" className="app-button app-button-primary" onClick={closeDialog}>
            확인
          </button>
        }
      />

      <AppModal
        open={dialogState?.type === 'delete'}
        title="보고서 삭제"
        onClose={closeDialog}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeDialog}>
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={submitDeleteSession}
            >
              삭제
            </button>
          </>
        }
      />
    </main>
  );
}
