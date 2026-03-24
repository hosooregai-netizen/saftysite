'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import ControllerDashboard from '@/components/controller/ControllerDashboard';
import AssignedSitesTable from '@/components/home/AssignedSitesTable';
import { buildSiteSummaries } from '@/components/home/siteSummaries';
import {
  WorkerMenuButton,
  WorkerMenuDrawer,
  WorkerMenuPanel,
} from '@/components/worker/WorkerMenu';
import { isAdminUserRole } from '@/components/controller/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { formatDateTime } from '@/lib/formatDateTime';
import styles from './page.module.css';

export default function HomePage() {
  const {
    sites,
    sessions,
    isReady,
    isHydrating,
    isAuthenticated,
    currentUser,
    authError,
    dataError,
    login,
    logout,
  } = useInspectionSessions();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'name' | 'reports'>('recent');
  const [menuOpen, setMenuOpen] = useState(false);

  const siteSummaries = useMemo(() => buildSiteSummaries(sites, sessions), [sessions, sites]);
  const deferredQuery = useDeferredValue(query);
  const filteredSiteSummaries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const filtered = !normalizedQuery
      ? siteSummaries
      : siteSummaries.filter(({ site }) =>
          [site.customerName, site.siteName, site.assigneeName]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        );

    return [...filtered].sort((left, right) => {
      if (sortMode === 'name') {
        return left.site.siteName.localeCompare(right.site.siteName, 'ko');
      }
      if (sortMode === 'reports') {
        return right.sessionCount - left.sessionCount || right.sortTime - left.sortTime;
      }
      return right.sortTime - left.sortTime;
    });
  }, [deferredQuery, siteSummaries, sortMode]);

  const isControllerView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const isInitialHydration = isHydrating && siteSummaries.length === 0;

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={`app-shell ${styles.shell}`}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>배정된 현장 정보를 불러오는 중입니다.</p>
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
        title="현장 안전 점검 시스템"
        description="API 서버로 로그인하면 배정된 현장과 보고서 목록을 바로 이어서 불러옵니다."
      />
    );
  }

  if (currentUser && isControllerView) {
    return <ControllerDashboard currentUser={currentUser} onLogout={logout} />;
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <div className={styles.heroTop}>
              <div className={styles.mobileMenuOnly}>
                <WorkerMenuButton onClick={() => setMenuOpen(true)} />
              </div>
            </div>
            <div className={styles.heroBody}>
              <div className={styles.heroMain}>
                <h1 className={styles.heroTitle}>배정된 고객사 현장</h1>
              </div>
            </div>
          </header>

          {dataError ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>데이터를 불러오지 못했습니다.</p>
              <p className={styles.emptyDescription}>{dataError}</p>
            </div>
          ) : null}

          <div className={styles.shellBody}>
            <aside className={styles.menuSidebar}>
              <WorkerMenuPanel
                currentUserName={currentUser?.name}
                siteCount={siteSummaries.length}
                onLogout={logout}
              />
            </aside>

            <div className={styles.contentColumn}>
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
                    />
                    <select
                      className={`app-select ${styles.tableSort}`}
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                    >
                      <option value="recent">최근 작업순</option>
                      <option value="name">현장명순</option>
                      <option value="reports">보고서 많은 순</option>
                    </select>
                  </div>

                  {isInitialHydration ? (
                    <div className={styles.loadingContent}>
                      <div className={styles.loadingSpinner} aria-hidden="true" />
                      <p className={styles.loadingDescription}>
                        현장과 보고서를 불러오는 중입니다.
                      </p>
                    </div>
                  ) : (
                    <AssignedSitesTable
                      currentUserName={currentUser?.name}
                      currentUserPosition={currentUser?.position}
                      siteSummaries={filteredSiteSummaries}
                      styles={styles}
                      formatDateTime={formatDateTime}
                    />
                  )}
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>

      <WorkerMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentUserName={currentUser?.name}
        siteCount={siteSummaries.length}
        onLogout={logout}
      />
    </main>
  );
}
