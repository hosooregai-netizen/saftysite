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
import { fetchInspectionWordDocument, saveBlobAsFile } from '@/lib/api';
import type { InspectionSession } from '@/types/inspectionSession';
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

type ReportDialogState = { type: 'delete'; sessionId: string } | null;

export default function SiteReportsPage({ params }: SiteReportsPageProps) {
  const { siteKey } = use(params);
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(siteKey);
  const { sites, sessions, isReady, createSession, deleteSession } = useInspectionSessions();
  const [dialogState, setDialogState] = useState<ReportDialogState>(null);
  const [downloadingSessionId, setDownloadingSessionId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<{
    sessionId: string;
    message: string;
  } | null>(null);

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

  const handleDownloadWord = async (session: InspectionSession) => {
    if (downloadingSessionId === session.id) return;

    setDownloadError(null);
    setDownloadingSessionId(session.id);

    try {
      const { blob, filename } = await fetchInspectionWordDocument(session);
      saveBlobAsFile(blob, filename);
    } catch (error) {
      setDownloadError({
        sessionId: session.id,
        message:
          error instanceof Error
            ? error.message
            : '워드 다운로드에 실패했습니다.',
      });
    } finally {
      setDownloadingSessionId((current) =>
        current === session.id ? null : current
      );
    }
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
              <div className={styles.heroMetaSpacer} aria-hidden="true" />
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
                    <span className={styles.numberHead}>번호</span>
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
                      const reportListTitle = session.cover.projectName.trim() || sessionTitle;

                      return (
                          <article key={session.id} className={styles.reportRow}>
                            <div className={styles.numberCell} aria-hidden="true">
                              <span className={styles.reportNumberBadge}>
                                {session.reportNumber}
                              </span>
                            </div>

                            <div className={styles.primaryCell}>
                              <Link href={sessionHref} className={styles.reportLink}>
                                <div className={styles.reportTitleRow}>
                                  <span className={styles.reportNumberBadgeMobile}>
                                    {session.reportNumber}
                                  </span>
                                  <h2 className={styles.reportTitle}>{reportListTitle}</h2>
                                </div>
                              </Link>
                            </div>

                          <div className={`${styles.dataCell} ${styles.consultantCell}`}>
                            <span className={styles.mobileLabel}>담당</span>
                            <span className={styles.dataValue}>
                              {session.cover.consultantName || '미입력'}
                            </span>
                          </div>

                          <div className={`${styles.progressCell} ${styles.progressArea}`}>
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

                          <div className={`${styles.dataCell} ${styles.inspectionCell}`}>
                            <span className={styles.mobileLabel}>점검일</span>
                            <span className={styles.dataValue}>
                              {session.cover.inspectionDate || '미입력'}
                            </span>
                          </div>

                          <div className={`${styles.dataCell} ${styles.savedCell}`}>
                            <span className={styles.mobileLabel}>마지막 저장</span>
                            <span className={styles.dataValue}>
                              {formatDateTime(session.lastSavedAt)}
                            </span>
                          </div>

                          <div className={`${styles.mobileActions} ${styles.actionsCell}`}>
                            <Link href={sessionHref} className="app-button app-button-primary">
                              이어서 작성
                            </Link>
                            <button
                              type="button"
                              className="app-button app-button-secondary"
                              onClick={() => {
                                void handleDownloadWord(session);
                              }}
                              disabled={downloadingSessionId === session.id}
                            >
                              {downloadingSessionId === session.id
                                ? '워드 생성 중...'
                                : '다운로드'}
                            </button>
                            <button
                              type="button"
                              className={`${styles.mobileDangerButton} app-button app-button-danger`}
                              onClick={() =>
                                setDialogState({
                                  type: 'delete',
                                  sessionId: session.id,
                                })
                              }
                            >
                              삭제
                            </button>
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
                                  void handleDownloadWord(session);
                                }}
                                disabled={downloadingSessionId === session.id}
                              >
                                {downloadingSessionId === session.id
                                  ? '워드 생성 중...'
                                  : '다운로드'}
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
                          {downloadError?.sessionId === session.id ? (
                            <p className={styles.rowError}>{downloadError.message}</p>
                          ) : null}
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
              className="app-button app-button-danger"
              onClick={submitDeleteSession}
            >
              삭제
            </button>
          </>
        }
      >
        <p>
          삭제된{' '}
          {deletingSession ? `"${getSessionTitle(deletingSession)}" 보고서` : '보고서'}는
          복구할 수 없습니다.
        </p>
      </AppModal>
    </main>
  );
}
