'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { getSessionSiteKey, getSessionSortTime } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import styles from './page.module.css';

function formatDateTime(value: string | null): string {
  if (!value) return '기록 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

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

  const rawSiteSummaries = useMemo(
    () =>
      sites
        .map((site) => {
          const siteSessions = sessions.filter(
            (session) => getSessionSiteKey(session) === site.id
          );

          return {
              site,
              sessionCount: siteSessions.length,
              latestSession: siteSessions[0] ?? null,
            sortTime: siteSessions[0]
              ? getSessionSortTime(siteSessions[0])
              : new Date(site.updatedAt).getTime(),
          };
        })
        .sort((left, right) => right.sortTime - left.sortTime),
    [sessions, sites]
  );
  const siteSummaries = rawSiteSummaries;

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

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <div className={styles.heroMain}>
              <div className={styles.heroMeta}>
                <span className="app-chip">배정 현장</span>
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
            <section className={styles.tablePanel}>
              {siteSummaries.length > 0 ? (
                <>
                  <div className={styles.listHead} aria-hidden="true">
                    <span>고객사명</span>
                    <span>현장명</span>
                    <span>담당</span>
                    <span>최근 작성일</span>
                    <span>보고서 수</span>
                    <span>마지막 저장</span>
                    <span>작업</span>
                  </div>

                  <div className={styles.siteList}>
                    {siteSummaries.map(({ site, latestSession, sessionCount }) => {
                      const siteHref = `/sites/${encodeURIComponent(site.id)}`;

                      return (
                        <article key={site.id} className={styles.siteRow}>
                          <div className={`${styles.cell} ${styles.customerCell}`}>
                            <span className={styles.mobileLabel}>고객사명</span>
                            <span className={styles.cellValue}>
                              {site.customerName || '미입력'}
                            </span>
                          </div>

                          <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
                            <span className={styles.mobileLabel}>현장명</span>
                            <Link href={siteHref} className={styles.siteLink}>
                              {site.siteName || '미입력'}
                            </Link>
                          </div>

                          <div className={`${styles.cell} ${styles.assigneeCell}`}>
                            <span className={styles.mobileLabel}>담당</span>
                            <span className={styles.cellValue}>
                              {site.assigneeName || '미입력'}
                            </span>
                          </div>

                          <div className={`${styles.cell} ${styles.dateCell}`}>
                            <span className={styles.mobileLabel}>최근 작성일</span>
                            <span className={styles.cellValue}>
                              {latestSession?.meta.reportDate || '-'}
                            </span>
                          </div>

                          <div className={`${styles.cell} ${styles.countCell}`}>
                            <span className={styles.mobileLabel}>보고서 수</span>
                            <span className={styles.cellValue}>{sessionCount}건</span>
                          </div>

                          <div className={`${styles.cell} ${styles.savedCell}`}>
                            <span className={styles.mobileLabel}>마지막 저장</span>
                            <span className={styles.cellValue}>
                              {latestSession ? formatDateTime(latestSession.lastSavedAt) : '-'}
                            </span>
                          </div>

                          <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                            <Link href={siteHref} className="app-button app-button-primary">
                              보고서 보기
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>배정된 현장이 없습니다.</p>
                  <p className={styles.emptyDescription}>
                    현재 로그인한 계정에 연결된 현장이 없거나, 배정 데이터가 아직 등록되지
                    않았습니다.
                  </p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
