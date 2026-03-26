'use client';

import { useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { AssignedSitesTable } from '@/features/home/components/AssignedSitesTable';
import { useHomeScreenState } from '@/features/home/hooks/useHomeScreenState';
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
        title="현장 안전 업무 시스템"
        description="API 서버로 로그인하면 배정된 현장과 보고서 목록을 바로 이어서 불러옵니다."
      />
    );
  }

  if (isControllerView) {
    return null;
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
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              {dataError ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>데이터를 불러오지 못했습니다.</p>
                  <p className={styles.emptyDescription}>{dataError}</p>
                </div>
              ) : (
                <>
                  <header className={styles.hero}>
                    <div className={styles.heroBody}>
                      <div className={styles.heroMain}>
                        <h1 className={styles.heroTitle}>기술 지도 - 배정된 고객사 현장</h1>
                      </div>
                    </div>
                  </header>

                  <div className={styles.pageGrid}>
                    <section className={styles.summaryBar}>
                      <article className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>전체 현장</span>
                        <strong className={styles.summaryCardValue}>
                          {isInitialHydration ? '...' : siteSummaries.length}
                        </strong>
                      </article>
                      <article className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>진행 보고서</span>
                        <strong className={styles.summaryCardValue}>
                          {isInitialHydration
                            ? '...'
                            : siteSummaries.filter((item) => item.sessionCount > 0).length}
                        </strong>
                      </article>
                      <article className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>최근 작성 현장</span>
                        <strong className={styles.summaryCardValue}>
                          {isInitialHydration ? '...' : siteSummaries[0]?.site.siteName || '-'}
                        </strong>
                      </article>
                    </section>

                    <section className={styles.tablePanel}>
                      <div className={styles.tableTools}>
                        <input
                          className={`app-input ${styles.tableSearch}`}
                          placeholder="고객사명, 현장명, 담당자로 검색"
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

