'use client';

import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import { getSessionGuidanceDate } from '@/constants/inspectionSession';
import { useHomeScreenState } from '@/features/home/hooks/useHomeScreenState';
import { buildMobileSiteHomeHref } from '@/features/home/lib/siteEntry';
import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import { MobileShell } from './MobileShell';
import styles from './MobileShell.module.css';

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
    return '작성 완료';
  }

  if (progress > 0) {
    return '작성 진행 중';
  }

  return '새 보고서 필요';
}

function SiteCard({ summary }: { summary: HomeSiteSummary }) {
  const latestGuidanceDate = summary.latestSession
    ? getSessionGuidanceDate(summary.latestSession)
    : '';

  return (
    <article className={styles.siteCard}>
      <div className={styles.cardTop}>
        <div className={styles.cardTitleWrap}>
          <span className={styles.cardKicker}>{summary.site.customerName || '배정 현장'}</span>
          <h2 className={styles.cardTitle}>{summary.site.siteName}</h2>
          <span className={styles.cardSubTitle}>
            담당자 {summary.site.assigneeName || '미배정'}
          </span>
        </div>
        <span className={styles.roundBadge}>{summary.sessionCount}건</span>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>최근 지도</span>
          <strong className={styles.metaValue}>{formatCompactDate(latestGuidanceDate)}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>진행 상태</span>
          <strong className={styles.metaValue}>{getProgressLabel(summary.latestProgress)}</strong>
        </div>
      </div>

      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>기술지도 보고서 진행률</span>
          <strong className={styles.progressValue}>{summary.latestProgress}%</strong>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span
            className={styles.progressFill}
            style={{ width: `${Math.max(0, Math.min(100, summary.latestProgress))}%` }}
          />
        </div>
      </div>

      <div className={styles.cardActions}>
        <Link
          href={buildMobileSiteHomeHref(summary.site.id)}
          className={`app-button app-button-primary ${styles.cardActionPrimary}`}
        >
          현장 홈 열기
        </Link>
      </div>
    </article>
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
      kicker="현장 수행"
      onLogout={logout}
      subtitle="현장 홈과 기술지도 보고서 중심으로 빠르게 이동할 수 있습니다."
      title="배정 현장"
      webHref="/"
    >
      {dataError ? (
        <section className={styles.stateCard}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>오류</span>
            <h2 className={styles.sectionTitle}>현장 목록을 불러오지 못했습니다.</h2>
          </div>
          <p className={styles.errorNotice}>{dataError}</p>
        </section>
      ) : (
        <>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionEyebrow}>오늘 작업</span>
                <h2 className={styles.sectionTitle}>현장 중심 ERP 모바일</h2>
              </div>
              <span className={styles.sectionMeta}>
                {isInitialHydration ? '불러오는 중' : `${filteredSiteSummaries.length}개 현장`}
              </span>
            </div>

            <div className={styles.statGrid}>
              <article className={styles.statCard}>
                <span className={styles.statLabel}>배정 현장</span>
                <strong className={styles.statValue}>
                  {isInitialHydration ? '...' : siteSummaries.length}
                </strong>
                <span className={styles.statMeta}>로그인 기준 전체 현장</span>
              </article>
              <article className={styles.statCard}>
                <span className={styles.statLabel}>검색 결과</span>
                <strong className={styles.statValue}>
                  {isInitialHydration ? '...' : filteredSiteSummaries.length}
                </strong>
                <span className={styles.statMeta}>현재 조건에 맞는 현장</span>
              </article>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionEyebrow}>목록 제어</span>
                <h2 className={styles.sectionTitle}>현장 찾기</h2>
              </div>
            </div>

            <div className={styles.filterRow}>
              <input
                className="app-input"
                placeholder="고객명, 현장명, 담당자로 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isInitialHydration}
              />
              <select
                className="app-select"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                disabled={isInitialHydration}
              >
                <option value="recent">최근 작업순</option>
                <option value="name">현장명순</option>
                <option value="reports">보고서 많은 순</option>
              </select>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionEyebrow}>현장 목록</span>
                <h2 className={styles.sectionTitle}>기술지도 우선 진입</h2>
              </div>
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
