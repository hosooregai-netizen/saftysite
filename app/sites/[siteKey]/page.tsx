'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import ReportList from '@/components/site/ReportList';
import AppModal from '@/components/ui/AppModal';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { getSessionSiteKey, getSessionTitle } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { formatDateTime } from '@/lib/formatDateTime';
import styles from './page.module.css';

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
  const {
    sites,
    sessions,
    isReady,
    isAuthenticated,
    currentUser,
    authError,
    login,
    logout,
    createSession,
    deleteSession,
    canArchiveReports,
  } = useInspectionSessions();
  const [dialogState, setDialogState] = useState<ReportDialogState>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites]
  );

  const siteSessions = useMemo(
    () => sessions.filter((session) => getSessionSiteKey(session) === decodedSiteKey),
    [decodedSiteKey, sessions]
  );

  const assignedUserDisplay = [currentUser?.name, currentUser?.position]
    .filter(Boolean)
    .join(' / ');

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
    void deleteSession(dialogState.sessionId);
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

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="보고서 목록 로그인"
        description="현장별 보고서 목록과 저장된 데이터를 불러오려면 다시 로그인해 주세요."
      />
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
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <div className={styles.shellBody}>
            <aside className={styles.menuSidebar}>
              <WorkerMenuPanel />
            </aside>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>
                      기술 지도 - {currentSite.siteName} 보고서 목록
                    </h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <section className={styles.panel}>
                  <ReportList
                    assignedUserDisplay={assignedUserDisplay}
                    currentSite={currentSite}
                    siteSessions={siteSessions}
                    canArchiveReports={canArchiveReports}
                    formatDateTime={formatDateTime}
                    onCreateReport={handleCreateReport}
                    onDeleteRequest={(sessionId) => setDialogState({ type: 'delete', sessionId })}
                    styles={styles}
                  />
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AppModal
        open={canArchiveReports && dialogState?.type === 'delete'}
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

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
