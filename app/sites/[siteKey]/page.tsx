'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useDeferredValue, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import ReportList from '@/components/site/ReportList';
import AppModal from '@/components/ui/AppModal';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import {
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
} from '@/constants/inspectionSession';
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
  const [reportQuery, setReportQuery] = useState('');
  const [reportSortMode, setReportSortMode] = useState<'recent' | 'name' | 'progress'>('recent');

  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites]
  );

  const siteSessions = useMemo(
    () => sessions.filter((session) => getSessionSiteKey(session) === decodedSiteKey),
    [decodedSiteKey, sessions]
  );

  const deferredReportQuery = useDeferredValue(reportQuery);

  const assignedUserDisplay = [currentUser?.name, currentUser?.position]
    .filter(Boolean)
    .join(' / ');

  const filteredSiteSessions = useMemo(() => {
    const normalized = deferredReportQuery.trim().toLowerCase();
    const drafterFallback = assignedUserDisplay || currentSite?.assigneeName || '';

    let list = siteSessions;
    if (normalized) {
      list = siteSessions.filter((session) => {
        const title = getSessionTitle(session);
        const drafter = session.meta.drafter || drafterFallback;
        const haystack = [
          title,
          session.meta.reportDate || '',
          drafter,
          session.lastSavedAt || '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalized);
      });
    }

    return [...list].sort((a, b) => {
      if (reportSortMode === 'name') {
        return getSessionTitle(a).localeCompare(getSessionTitle(b), 'ko');
      }
      if (reportSortMode === 'progress') {
        const pa = getSessionProgress(a);
        const pb = getSessionProgress(b);
        return (
          pb.percentage - pa.percentage ||
          pb.completed - pa.completed ||
          getSessionTitle(a).localeCompare(getSessionTitle(b), 'ko')
        );
      }
      const ta = a.lastSavedAt ? new Date(a.lastSavedAt).getTime() : 0;
      const tb = b.lastSavedAt ? new Date(b.lastSavedAt).getTime() : 0;
      return tb - ta;
    });
  }, [
    siteSessions,
    deferredReportQuery,
    reportSortMode,
    assignedUserDisplay,
    currentSite?.assigneeName,
  ]);

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

  const snap = currentSite.adminSiteSnapshot;
  const siteNameDisplay =
    currentSite.siteName?.trim() || snap.siteName?.trim() || '—';
  const addressDisplay = snap.siteAddress?.trim() || '—';
  const periodDisplay = snap.constructionPeriod?.trim() || '—';
  const amountDisplay = snap.constructionAmount?.trim() || '—';

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <Link
                    href="/"
                    className={styles.heroBackLink}
                    aria-label="메인 메뉴로 돌아가기"
                  >
                    {'<'} 이전
                  </Link>
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>
                      기술 지도 - {currentSite.siteName} 보고서 목록
                    </h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <section className={styles.summaryBar} aria-label="현장 정보">
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>현장명</span>
                    <strong className={styles.summaryCardValue}>{siteNameDisplay}</strong>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>현장 주소</span>
                    <strong
                      className={`${styles.summaryCardValue} ${styles.summaryCardValueWide}`}
                    >
                      {addressDisplay}
                    </strong>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>공사기간</span>
                    <strong className={styles.summaryCardValue}>{periodDisplay}</strong>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>공사금액</span>
                    <strong className={styles.summaryCardValue}>{amountDisplay}</strong>
                  </article>
                </section>

                <section className={styles.panel}>
                  {siteSessions.length > 0 ? (
                    <div className={styles.tableTools}>
                      <input
                        className={`app-input ${styles.tableSearch}`}
                        placeholder="보고서명, 작업일, 작성자로 검색"
                        value={reportQuery}
                        onChange={(event) => setReportQuery(event.target.value)}
                        aria-label="보고서 검색"
                      />
                      <select
                        className={`app-select ${styles.tableSort}`}
                        value={reportSortMode}
                        onChange={(event) =>
                          setReportSortMode(
                            event.target.value as 'recent' | 'name' | 'progress'
                          )
                        }
                        aria-label="보고서 정렬"
                      >
                        <option value="recent">최근 저장순</option>
                        <option value="name">보고서명순</option>
                        <option value="progress">진행률 높은 순</option>
                      </select>
                    </div>
                  ) : null}
                  <ReportList
                    assignedUserDisplay={assignedUserDisplay}
                    currentSite={currentSite}
                    siteSessions={filteredSiteSessions}
                    totalSessionCount={siteSessions.length}
                    canArchiveReports={canArchiveReports}
                    formatDateTime={formatDateTime}
                    onCreateReport={handleCreateReport}
                    onDeleteRequest={(sessionId) => setDialogState({ type: 'delete', sessionId })}
                    styles={styles}
                  />
                </section>
              </div>
            </div>
          </WorkerShellBody>
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
