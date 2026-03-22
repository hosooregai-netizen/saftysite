'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import AssignedSitesTable from '@/components/home/AssignedSitesTable';
import ControllerDashboard from '@/components/controller/ControllerDashboard';
import { buildSiteSummaries } from '@/components/home/siteSummaries';
import LoginPanel from '@/components/auth/LoginPanel';
import { isAdminUserRole } from '@/components/controller/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { formatDateTime } from '@/lib/formatDateTime';
import styles from './page.module.css';

export default function HomePage() {
  const {
    sites,
    sessions,
    isReady,
    isAuthenticated,
    currentUser,
    authError,
    dataError,
    login,
    logout,
    reload,
  } = useInspectionSessions();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'name' | 'reports'>('recent');

  const siteSummaries = useMemo(() => buildSiteSummaries(sites, sessions), [sessions, sites]);
  const deferredQuery = useDeferredValue(query);
  const filteredSiteSummaries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const filtered = !normalizedQuery
      ? siteSummaries
      : siteSummaries.filter(({ site }) =>
      [site.customerName, site.siteName, site.assigneeName].join(' ').toLowerCase().includes(normalizedQuery)
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

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={`app-shell ${styles.shell}`}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>배정 현장 정보를 불러오는 중입니다.</p>
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
        title="한국종합안전 업무 시스템"
        description="API 서버에 로그인하면 배정된 현장과 보고서 목록을 바로 이어서 불러올 수 있습니다."
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
            <div className={styles.heroMain}>
              <div className={styles.heroMeta}>
                <span className="app-chip">지도요원</span>
                <span className="app-chip">{currentUser?.name || '현장 사용자'}</span>
              </div>
              <div className={styles.heroTitleRow}>
                <div>
                  <h1 className={styles.heroTitle}>배정된 고객사 현장</h1>
                  <p className={styles.heroDescription}>
                    로그인한 계정에 배정된 현장과 보고서를 API 서버에서 불러옵니다.
                    현장 기본 정보는 관리자 기준 데이터 스냅샷으로 자동 반영됩니다.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.heroActions}>
              <span className="app-chip">총 {siteSummaries.length}개 현장</span>
              <span className="app-chip">검색 결과 {filteredSiteSummaries.length}개</span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void reload()}
              >
                새로고침
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={logout}
              >
                로그아웃
              </button>
            </div>
          </header>

          {dataError ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>일부 데이터를 새로 불러오지 못했습니다.</p>
              <p className={styles.emptyDescription}>{dataError}</p>
            </div>
          ) : null}

          <div className={styles.pageGrid}>
            <section className={styles.summaryBar}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>전체 현장</span>
                <strong className={styles.summaryCardValue}>{siteSummaries.length}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>진행 보고서</span>
                <strong className={styles.summaryCardValue}>{siteSummaries.filter((item) => item.sessionCount > 0).length}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>최근 작성 현장</span>
                <strong className={styles.summaryCardValue}>{siteSummaries[0]?.site.siteName || '-'}</strong>
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
              <AssignedSitesTable
                currentUserName={currentUser?.name}
                currentUserPosition={currentUser?.position}
                siteSummaries={filteredSiteSummaries}
                styles={styles}
                formatDateTime={formatDateTime}
              />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
