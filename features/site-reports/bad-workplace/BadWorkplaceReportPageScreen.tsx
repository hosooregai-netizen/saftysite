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
import { BadWorkplaceReportEditor } from './BadWorkplaceReportEditor';
import type { BadWorkplaceReportPageScreenProps } from './types';
import { useBadWorkplaceReportPageState } from './useBadWorkplaceReportPageState';

export function BadWorkplaceReportPageScreen({
  reportMonth,
  siteKey,
}: BadWorkplaceReportPageScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const state = useBadWorkplaceReportPageState(siteKey, reportMonth);

  if (!state.isReady || state.existingReportLoading) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            불량사업장 신고서를 불러오는 중입니다.
          </section>
        </div>
      </main>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <LoginPanel
        error={state.authError}
        onSubmit={state.login}
        title="불량사업장 신고 로그인"
      />
    );
  }

  if (state.existingReportError) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            {state.existingReportError}
          </section>
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
              현장 또는 신고 대상 정보를 확인하지 못했습니다.
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
                <AdminMenuPanel
                  activeSection="headquarters"
                  currentHeadquarterId={state.currentSite.headquarterId ?? null}
                  currentSiteKey={state.currentSite.id}
                />
              ) : (
                <WorkerMenuPanel currentSiteKey={state.currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={shellStyles.contentColumn}>
              <header className={shellStyles.hero}>
                <div className={shellStyles.heroBody}>
                  <PageBackControl
                    href={state.backHref}
                    label={state.backLabel}
                    ariaLabel="이전 화면으로 돌아가기"
                  />
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>{state.initialDraft.title}</h1>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <BadWorkplaceReportEditor
                  key={`${state.initialDraft.id}:${state.initialDraft.updatedAt}`}
                  error={state.error}
                  initialDraft={state.initialDraft}
                  isSaving={state.isSaving}
                  onSave={state.saveBadWorkplaceReport}
                  siteSessions={state.siteSessions}
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
          currentHeadquarterId={state.currentSite.headquarterId ?? null}
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
