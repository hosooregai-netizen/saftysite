'use client';

import { useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { AssignedSitesTable } from '@/features/home/components/AssignedSitesTable';
import { useHomeScreenState } from '@/features/home/hooks/useHomeScreenState';
import { buildSiteHubHref, buildSiteReportsHref } from '@/features/home/lib/siteEntry';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
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
    siteSummaries,
    sortMode,
    setSortMode,
  } = useHomeScreenState();

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="현장 목록 로그인"
        description="로그인하면 배정된 현장을 선택해 기술지도 보고서, 분기 종합보고서, 불량사업장 신고를 이어서 진행할 수 있습니다."
      />
    );
  }

  if (isControllerView) {
    return null;
  }

  return (
    <div className="app-page-root">
      <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <WorkerAppHeader
                currentUserName={currentUserName}
                fullBleed={false}
                onLogout={logout}
                onOpenMenu={() => setMenuOpen(true)}
              />

              {dataError ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>데이터를 불러오지 못했습니다.</p>
                  <p className={styles.emptyDescription}>{dataError}</p>
                </div>
              ) : (
                <div className="app-main-frame">
                  <header className={styles.hero}>
                    <div className={styles.heroBody}>
                      <div className={styles.heroMain}>
                        <h1 className={styles.heroTitle}>현장 목록</h1>
                      </div>
                    </div>
                  </header>

                  <div className={styles.pageGrid}>
                    <section className={styles.summaryBar}>
                      <article className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>배정 현장</span>
                        <strong className={styles.summaryCardValue}>
                          {isInitialHydration ? '...' : siteSummaries.length}
                        </strong>
                      </article>
                      <article className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>검색 결과</span>
                        <strong className={styles.summaryCardValue}>
                          {isInitialHydration ? '...' : filteredSiteSummaries.length}
                        </strong>
                      </article>
                      <article className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>최근 작업 현장</span>
                        <strong className={styles.summaryCardValue}>
                          {isInitialHydration ? '...' : siteSummaries[0]?.site.siteName || '-'}
                        </strong>
                      </article>
                    </section>

                    <section className={styles.tablePanel}>
                      <div className={styles.tableTools}>
                        <input
                          className={`app-input ${styles.tableSearch}`}
                          placeholder="고객명, 현장명, 담당자로 검색"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          disabled={isInitialHydration}
                        />
                        <select
                          className={`app-select ${styles.tableSort}`}
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
                        getSiteHref={(summary) => buildSiteHubHref(summary.site.id)}
                        buildActionMenuItems={(summary) => [
                          {
                            label: '현장 열기',
                            href: buildSiteHubHref(summary.site.id),
                          },
                          {
                            label: '기술지도 보고서',
                            href: buildSiteReportsHref(summary.site.id),
                          },
                          {
                            label: '분기 종합보고서',
                            href: buildSiteHubHref(summary.site.id, 'quarterly'),
                          },
                          {
                            label: '불량사업장 신고',
                            href: buildSiteHubHref(summary.site.id, 'bad-workplace'),
                          },
                        ]}
                        isLoading={isInitialHydration}
                        siteSummaries={filteredSiteSummaries}
                      />
                    </section>
                  </div>
                </div>
              )}
            </div>
          </WorkerShellBody>
        </section>
      </div>
      </main>

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
