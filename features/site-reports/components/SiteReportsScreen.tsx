'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import OperationalReportsPanel from '@/components/site/OperationalReportsPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { SiteReportListPanel } from '@/features/site-reports/components/SiteReportListPanel';
import {
  SiteReportsLoadingState,
  SiteReportsMissingState,
} from '@/features/site-reports/components/SiteReportsStatePanels';
import { useSiteReportsScreen } from '@/features/site-reports/hooks/useSiteReportsScreen';
import styles from './SiteReportsScreen.module.css';

interface SiteReportsScreenProps {
  siteKey: string;
}

export function SiteReportsScreen({ siteKey }: SiteReportsScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    assignedUserDisplay,
    authError,
    canArchiveReports,
    createReport,
    currentSite,
    currentUser,
    currentUserName,
    deleteSession,
    filteredSiteSessions,
    isAdminView,
    isAuthenticated,
    isLoadingSiteReports,
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

  if (!isReady) {
    return <SiteReportsLoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="보고서 목록 로그인"
        description="현장별 보고서 목록과 저장된 데이터를 보려면 다시 로그인해 주세요."
      />
    );
  }

  if (!currentSite) {
    return <SiteReportsMissingState />;
  }

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
                <AdminMenuPanel activeSection="headquarters" />
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
                <SiteReportListPanel
                  assignedUserDisplay={assignedUserDisplay}
                  canArchiveReports={canArchiveReports}
                  createReport={createReport}
                  currentSite={currentSite}
                  deleteSession={deleteSession}
                  filteredSiteSessions={filteredSiteSessions}
                  isLoadingSiteReports={isLoadingSiteReports}
                  reportQuery={reportQuery}
                  reportSortMode={reportSortMode}
                  setReportQuery={setReportQuery}
                  setReportSortMode={setReportSortMode}
                  siteSessions={siteSessions}
                />

                <OperationalReportsPanel
                  currentSite={currentSite}
                  currentUser={currentUser}
                  siteSessions={siteSessions}
                />
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
        />
      ) : (
        <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
    </main>
  );
}
