'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { getSessionSiteKey, groupSessionsBySite } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import styles from './page.module.css';

function formatDateTime(value: string | null): string {
  if (!value) return '저장 이력 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function HomePage() {
  const router = useRouter();
  const { sessions, isReady, createSession, updateSessions, deleteSessions } =
    useInspectionSessions();
  const sites = useMemo(() => groupSessionsBySite(sessions), [sessions]);

  const handleCreateSession = () => {
    const session = createSession();
    router.push(`/sessions/${session.id}`);
  };

  const handleRenameSite = (siteKey: string, currentTitle: string) => {
    const nextTitle = window.prompt('현장명을 입력하세요.', currentTitle)?.trim();
    if (!nextTitle || nextTitle === currentTitle) return;

    updateSessions(
      (session) => getSessionSiteKey(session) === siteKey,
      (session) => ({
        ...session,
        cover: {
          ...session.cover,
          businessName: nextTitle,
        },
      })
    );
  };

  const handleDeleteSite = (siteKey: string, title: string) => {
    if (!window.confirm(`"${title}" 현장과 관련된 보고서를 모두 삭제하시겠습니까?`)) {
      return;
    }

    deleteSessions((session) => getSessionSiteKey(session) === siteKey);
  };

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <header className={styles.hero}>
            <div className={styles.heroBody}>
              <p className={styles.heroKicker}>현장 작성 모드</p>
              <h1 className={styles.heroTitle}>현장 목록</h1>
              <p className={styles.heroDescription}>
                첫 화면에서는 현장만 모아 보고, 각 현장에 들어가면 해당 현장의 보고서
                목록을 확인할 수 있습니다.
              </p>
            </div>
          </header>

          <div className={styles.pageGrid}>
            <section className={styles.sessionPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>현장 리스트</h2>
                  <p className={styles.panelDescription}>
                    동일한 사업장명과 공사명을 기준으로 보고서를 묶어 표시합니다.
                  </p>
                </div>
                <div className={styles.panelActions}>
                  <span className="app-chip">총 {sites.length}개 현장</span>
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    className="app-button app-button-primary"
                  >
                    새현장 시작
                  </button>
                </div>
              </div>

              {isReady ? (
                sites.length > 0 ? (
                  <>
                    <div className={styles.listHead} aria-hidden="true">
                      <span>현장명</span>
                      <span>최근 점검일</span>
                      <span>보고서 수</span>
                      <span>마지막 저장</span>
                      <span>작업</span>
                    </div>

                    <div className={styles.siteList}>
                      {sites.map((site) => {
                        const siteHref = `/sites/${encodeURIComponent(site.key)}`;

                        return (
                          <article key={site.key} className={styles.siteRow}>
                            <div className={styles.primaryCell}>
                              <Link href={siteHref} className={styles.siteLink}>
                                <h3 className={styles.siteTitle}>{site.title}</h3>
                              </Link>
                            </div>

                            <div className={styles.dataCell}>
                              <span className={styles.mobileLabel}>최근 점검일</span>
                              <span className={styles.dataValue}>
                                {site.latestSession.cover.inspectionDate || '미입력'}
                              </span>
                            </div>

                            <div className={styles.dataCell}>
                              <span className={styles.mobileLabel}>보고서 수</span>
                              <span className={styles.dataValue}>{site.sessionCount}건</span>
                            </div>

                            <div className={styles.dataCell}>
                              <span className={styles.mobileLabel}>마지막 저장</span>
                              <span className={styles.dataValue}>
                                {formatDateTime(site.latestSession.lastSavedAt)}
                              </span>
                            </div>

                            <details className={styles.menuShell}>
                              <summary
                                className={styles.menuButton}
                                aria-label={`${site.title} 작업 열기`}
                              >
                                ⋯
                              </summary>
                              <div className={styles.menuList}>
                                <Link href={siteHref} className={styles.menuItem}>
                                  현장 보기
                                </Link>
                                <button
                                  type="button"
                                  className={styles.menuItem}
                                  onClick={() => handleRenameSite(site.key, site.title)}
                                >
                                  이름 수정
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                  onClick={() => handleDeleteSite(site.key, site.title)}
                                >
                                  삭제
                                </button>
                              </div>
                            </details>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyTitle}>등록된 현장이 없습니다.</p>
                    <p className={styles.emptyDescription}>
                      새현장을 시작하면 현장 목록과 첫 보고서가 함께 생성됩니다.
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateSession}
                      className="app-button app-button-primary"
                    >
                      첫 현장 시작
                    </button>
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
