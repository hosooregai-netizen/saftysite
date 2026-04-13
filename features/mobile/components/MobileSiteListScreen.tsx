'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import { useHomeScreenState } from '@/features/home/hooks/useHomeScreenState';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { MobileSiteCard } from '../site-list/MobileSiteCard';
import { MOBILE_SITE_LIST_TABS } from '../site-list/mobileSiteListTabs';
import styles from './MobileShell.module.css';

export function MobileSiteListScreen() {
  const {
    authError,
    currentUserName,
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
        title="작업자 모바일 로그인"
        description="배정 현장을 열고 기술지도 보고서를 모바일 흐름으로 이어서 작성합니다."
      />
    );
  }

  if (isControllerView) {
    return null;
  }

  return (
    <MobileShell
      currentUserName={currentUserName}
      onLogout={logout}
      title="배정 현장"
      webHref="/"
      tabBar={<MobileTabBar tabs={[...MOBILE_SITE_LIST_TABS]} />}
    >
      {dataError ? (
        <section className={styles.stateCard}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>현장 목록을 불러오지 못했습니다.</h2>
          </div>
          <p className={styles.errorNotice}>{dataError}</p>
        </section>
      ) : (
        <>
          <section className={styles.sectionCard} style={{ padding: '16px 12px' }}>
            <div className={styles.sectionHeader} style={{ paddingBottom: '12px' }}>
              <div className={styles.sectionTitleWrap}>
                <h2 className={styles.sectionTitle}>현장 목록</h2>
              </div>
              <span className={styles.sectionMeta}>
                {isInitialHydration ? '불러오는 중' : `총 ${siteSummaries.length}개 / 검색 ${filteredSiteSummaries.length}개`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                className="app-input"
                style={{ flex: 1, minWidth: 0, fontSize: '13px' }}
                placeholder="고객명, 현장명, 담당자로 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isInitialHydration}
              />
              <select
                className="app-select"
                style={{ width: '110px', flexShrink: 0, fontSize: '13px', padding: '0 8px' }}
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                disabled={isInitialHydration}
              >
                <option value="recent">최근 작업순</option>
                <option value="name">현장명순</option>
                <option value="reports">보고서 많은 순</option>
              </select>
            </div>

            {isInitialHydration ? (
              <p className={styles.inlineNotice}>현장 정보를 불러오는 중입니다.</p>
            ) : filteredSiteSummaries.length === 0 ? (
              <p className={styles.inlineNotice}>
                검색 조건에 맞는 현장이 없습니다. 검색어 또는 정렬을 다시 확인해 주세요.
              </p>
            ) : (
              <div className={styles.cardStack}>
                {filteredSiteSummaries.map((summary) => (
                  <MobileSiteCard key={summary.site.id} summary={summary} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </MobileShell>
  );
}
