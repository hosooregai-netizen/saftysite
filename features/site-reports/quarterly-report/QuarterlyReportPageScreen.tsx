import { useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import shellStyles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import { QuarterlyReportEditor } from './QuarterlyReportEditor';
import type { QuarterlyReportPageScreenProps } from './types';
import { useQuarterlyReportPageState } from './useQuarterlyReportPageState';

export function QuarterlyReportPageScreen({
  quarterKey,
  siteKey,
}: QuarterlyReportPageScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const state = useQuarterlyReportPageState(siteKey, quarterKey);
  const backLabel = '분기 종합 보고서 목록';

  if (!state.isReady || state.existingReportLoading || state.isResolvingSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>분기 보고서를 불러오는 중입니다.</section>
        </div>
      </main>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <LoginPanel
        error={state.authError}
        onSubmit={state.login}
        title="분기 보고서 로그인"
        description="분기 보고서를 작성하려면 다시 로그인해 주세요."
      />
    );
  }

  if (state.existingReportError) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>{state.existingReportError}</section>
        </div>
      </main>
    );
  }

  if (!state.currentSite || !state.initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>
              현장 또는 보고서 정보를 확인하지 못했습니다.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${shellStyles.shell}`}>
          <WorkerAppHeader
            brandHref={state.isAdminView ? '/admin' : '/'}
            currentUserName={state.currentUser?.name}
            onLogout={state.logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {state.isAdminView ? (
                <AdminMenuPanel activeSection="headquarters" currentSiteKey={state.currentSite.id} />
              ) : (
                <WorkerMenuPanel currentSiteKey={state.currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={shellStyles.contentColumn}>
              <header className={shellStyles.hero}>
                <div className={shellStyles.heroBody}>
                  <PageBackControl href={state.backHref} label={backLabel} ariaLabel="이전 페이지로" />
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>{state.initialDraft.title}</h1>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <QuarterlyReportEditor
                  key={`${state.initialDraft.id}:${state.initialDraft.updatedAt}`}
                  currentSite={state.currentSite}
                  initialDraft={state.initialDraft}
                  isExistingReport={Boolean(state.existingReport)}
                  isSaving={state.isSaving}
                  error={state.error}
                  onSave={state.saveQuarterlyReport}
                />
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {state.isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
          currentSiteKey={state.currentSite.id}
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={state.currentSite.id}
        />
      )}
    </main>
  );
}
