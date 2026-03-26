'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import AppModal from '@/components/ui/AppModal';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { getSessionTitle } from '@/constants/inspectionSession';
import { ReportList } from '@/features/site-reports/components/ReportList';
import {
  SiteReportsLoadingState,
  SiteReportsMissingState,
} from '@/features/site-reports/components/SiteReportsStatePanels';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import { useSiteReportsScreen } from '@/features/site-reports/hooks/useSiteReportsScreen';
import styles from './SiteReportsScreen.module.css';

interface SiteReportsScreenProps {
  siteKey: string;
}

export function SiteReportsScreen({ siteKey }: SiteReportsScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const {
    assignedUserDisplay,
    authError,
    canArchiveReports,
    createReport,
    currentSite,
    currentUserName,
    deleteSession,
    filteredSiteSessions,
    isAdminView,
    isAuthenticated,
    isReady,
    login,
    logout,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
    siteSessions,
    workerBackHref,
  } = useSiteReportsScreen(siteKey);
  const deletingSession =
    dialogSessionId
      ? siteSessions.find((session) => session.id === dialogSessionId) ?? null
      : null;

  if (!isReady) {
    return <SiteReportsLoadingState />;
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
    return <SiteReportsMissingState />;
  }

  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUserName}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="sites" />
              ) : (
                <WorkerMenuPanel />
              )}
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <Link href={workerBackHref} className={styles.heroBackLink} aria-label="이전 화면으로 돌아가기">
                    {'<'} 이전
                  </Link>
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>기술 지도 - {currentSite.siteName} 보고서 목록</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <SiteReportsSummaryBar
                  addressDisplay={addressDisplay}
                  amountDisplay={amountDisplay}
                  periodDisplay={periodDisplay}
                  siteNameDisplay={siteNameDisplay}
                />

                <section className={styles.panel}>
                  {siteSessions.length > 0 ? (
                    <div className={styles.tableTools}>
                      <input
                        className={`app-input ${styles.tableSearch}`}
                        placeholder="보고서명, 작성일, 작성자로 검색"
                        value={reportQuery}
                        onChange={(event) => setReportQuery(event.target.value)}
                        aria-label="보고서 검색"
                      />
                      <select
                        className={`app-select ${styles.tableSort}`}
                        value={reportSortMode}
                        onChange={(event) =>
                          setReportSortMode(event.target.value as typeof reportSortMode)
                        }
                        aria-label="보고서 정렬"
                      >
                        <option value="recent">최근 저장순</option>
                        <option value="name">보고서명순</option>
                        <option value="progress">진행률 높은 순</option>
                      </select>
                      <button
                        type="button"
                        className={`app-button app-button-primary ${styles.tableCreateButton}`}
                        onClick={createReport}
                      >
                        보고서 추가
                      </button>
                    </div>
                  ) : null}

                  <ReportList
                    assignedUserDisplay={assignedUserDisplay}
                    canArchiveReports={canArchiveReports}
                    currentSite={currentSite}
                    onCreateReport={createReport}
                    onDeleteRequest={setDialogSessionId}
                    siteSessions={filteredSiteSessions}
                    totalSessionCount={siteSessions.length}
                  />
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <AppModal
        open={canArchiveReports && Boolean(dialogSessionId)}
        title="보고서 삭제"
        onClose={() => setDialogSessionId(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setDialogSessionId(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-danger"
              onClick={() => {
                if (!dialogSessionId) return;
                void deleteSession(dialogSessionId);
                setDialogSessionId(null);
              }}
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

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="sites"
        />
      ) : (
        <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
    </main>
  );
}

