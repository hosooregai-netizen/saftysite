'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getSessionSiteKey, getSessionSortTime } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import styles from './page.module.css';

const ASSIGNED_SITES_ENABLED = true;

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
  const { sites, sessions, isReady } = useInspectionSessions();

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
  const siteSummaries = ASSIGNED_SITES_ENABLED ? rawSiteSummaries : [];

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <div className={styles.heroMain}>
              <div className={styles.heroMeta}>
                <span className="app-chip">배정 현장</span>
                <span className="app-chip">목업 데이터 고정</span>
              </div>
              <div className={styles.heroTitleRow}>
                <div>
                  <h1 className={styles.heroTitle}>배정된 고객사 현장</h1>
                  <p className={styles.heroDescription}>
                    현장 기본 데이터는 추후 관리자 페이지에서 관리할 예정입니다. 현재는
                    목업 현장 1건만 노출하며, 신규 현장 등록은 이 화면에서 제공하지
                    않습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.heroActions}>
              <span className="app-chip">총 {siteSummaries.length}개 현장</span>
            </div>
          </header>

          <div className={styles.pageGrid}>
            <section className={styles.tablePanel}>
              {isReady ? (
                siteSummaries.length > 0 ? (
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
                      관리자 페이지 연결 전까지는 배정 현장 데이터가 비어 있는 상태로
                      표시됩니다.
                    </p>
                  </div>
                )
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>현장 목록을 불러오는 중입니다.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
