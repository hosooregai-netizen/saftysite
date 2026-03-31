'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { AssignedSitesTable } from '@/features/home/components/AssignedSitesTable';
import { useHomeScreenState } from '@/features/home/hooks/useHomeScreenState';
import {
  buildSiteHubHref,
  buildSiteReportsHref,
  getWorkerSiteEntryDescription,
  getWorkerSiteEntryTitle,
  type WorkerSitePickerIntent,
} from '@/features/home/lib/siteEntry';
import homeStyles from './HomeScreen.module.css';
import entryStyles from './SiteEntryScreens.module.css';

interface WorkerSitePickerScreenProps {
  intent: WorkerSitePickerIntent;
}

export function WorkerSitePickerScreen({
  intent,
}: WorkerSitePickerScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    authError,
    currentUserName,
    currentUserPosition,
    dataError,
    filteredSiteSummaries,
    isControllerView,
    isInitialHydration,
    login,
    logout,
    query,
    setQuery,
    shouldShowLogin,
    sortMode,
    setSortMode,
  } = useHomeScreenState();

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title={`${getWorkerSiteEntryTitle(intent)} 로그인`}
        description="로그인하면 현장을 먼저 선택한 뒤 해당 업무를 이어서 진행할 수 있습니다."
      />
    );
  }

  if (isControllerView) {
    return null;
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${homeStyles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUserName}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={homeStyles.contentColumn}>
              {dataError ? (
                <div className={homeStyles.emptyState}>
                  <p className={homeStyles.emptyTitle}>데이터를 불러오지 못했습니다.</p>
                  <p className={homeStyles.emptyDescription}>{dataError}</p>
                </div>
              ) : (
                <>
                  <header className={homeStyles.hero}>
                    <div className={homeStyles.heroBody}>
                      <Link href="/" className={entryStyles.heroBackLink}>
                        {'<'} 현장 목록
                      </Link>
                      <div className={homeStyles.heroMain}>
                        <h1 className={homeStyles.heroTitle}>{getWorkerSiteEntryTitle(intent)}</h1>
                      </div>
                    </div>
                  </header>

                  <div className={homeStyles.pageGrid}>
                    <section className={entryStyles.entryCard}>
                      <div className={entryStyles.entryBody}>
                        <h2 className={entryStyles.entryTitle}>현장을 먼저 선택하세요.</h2>
                        <p className={entryStyles.entryMeta}>
                          {getWorkerSiteEntryDescription(intent)}
                        </p>
                      </div>
                    </section>

                    <section className={homeStyles.tablePanel}>
                      <div className={homeStyles.tableTools}>
                        <input
                          className={`app-input ${homeStyles.tableSearch}`}
                          placeholder="고객명, 현장명, 담당자로 검색"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          disabled={isInitialHydration}
                        />
                        <select
                          className={`app-select ${homeStyles.tableSort}`}
                          value={sortMode}
                          onChange={(event) =>
                            setSortMode(event.target.value as typeof sortMode)
                          }
                          disabled={isInitialHydration}
                        >
                          <option value="recent">최근 작업순</option>
                          <option value="name">현장명순</option>
                          <option value="reports">보고서 많은 순</option>
                        </select>
                      </div>

                      <AssignedSitesTable
                        currentUserName={currentUserName}
                        currentUserPosition={currentUserPosition}
                        getSiteHref={(summary) => buildSiteHubHref(summary.site.id, intent)}
                        buildActionMenuItems={(summary) => [
                          {
                            label: `${getWorkerSiteEntryTitle(intent)} 준비`,
                            href: buildSiteHubHref(summary.site.id, intent),
                          },
                          {
                            label: '현장 열기',
                            href: buildSiteHubHref(summary.site.id),
                          },
                          {
                            label: '기술지도 보고서',
                            href: buildSiteReportsHref(summary.site.id),
                          },
                        ]}
                        isLoading={isInitialHydration}
                        siteSummaries={filteredSiteSummaries}
                      />
                    </section>
                  </div>
                </>
              )}
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
