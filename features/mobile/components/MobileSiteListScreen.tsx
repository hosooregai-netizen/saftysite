'use client';

import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import { getSessionGuidanceDate } from '@/constants/inspectionSession';
import { useHomeScreenState } from '@/features/home/hooks/useHomeScreenState';
import { buildMobileSiteHomeHref } from '@/features/home/lib/siteEntry';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import styles from './MobileShell.module.css';

const HOME_TABS = [
  {
    label: '사업장/현장',
    href: '/mobile',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    ),
  },
  {
    label: '내 일정',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    label: '메일함',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '미기록';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function getProgressLabel(progress: number) {
  if (progress >= 100) {
    return '완료';
  }
  if (progress > 0) {
    return '작성중';
  }
  return '미작성';
}

function SiteCard({ summary }: { summary: HomeSiteSummary }) {
  const latestGuidanceDate = summary.latestSession
    ? getSessionGuidanceDate(summary.latestSession)
    : '';
  const siteAddress = summary.site.adminSiteSnapshot?.siteAddress;

  return (
    <Link href={buildMobileSiteHomeHref(summary.site.id)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className={styles.siteCard} style={{ cursor: 'pointer', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h2 className={styles.cardTitle} style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {summary.site.siteName}
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {summary.site.assigneeName || '미배정'}
            </span>
          </div>
          <span className={styles.roundBadge} style={{ minWidth: 'auto', height: '24px', minHeight: '24px', padding: '0 8px', fontSize: '12px' }}>
            {summary.sessionCount}건
          </span>
        </div>

        {siteAddress && (
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {siteAddress}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              <strong style={{ fontWeight: 600, color: '#0f172a' }}>최근 지도</strong> {formatCompactDate(latestGuidanceDate)}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {getProgressLabel(summary.latestProgress)}
          </span>
        </div>
      </article>
    </Link>
  );
}

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
      tabBar={<MobileTabBar tabs={HOME_TABS} />}
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
                  <SiteCard key={summary.site.id} summary={summary} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </MobileShell>
  );
}
