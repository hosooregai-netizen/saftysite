'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
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

function closeOpenMenus() {
  document
    .querySelectorAll<HTMLDetailsElement>('details[data-menu-root][open]')
    .forEach((element) => element.removeAttribute('open'));
}

function closeMenuFromEvent(event: MouseEvent<HTMLElement>) {
  event.currentTarget.closest('details')?.removeAttribute('open');
}

type SiteDialogState =
  | { type: 'create'; value: string }
  | { type: 'rename'; siteId: string; currentTitle: string; value: string }
  | { type: 'delete'; siteId: string }
  | null;

export default function HomePage() {
  const router = useRouter();
  const { sites, sessions, isReady, createSite, updateSite, deleteSite, updateSessions } =
    useInspectionSessions();
  const [dialogState, setDialogState] = useState<SiteDialogState>(null);

  const siteSummaries = useMemo(
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

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-menu-root]')) return;
      closeOpenMenus();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOpenMenus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const closeDialog = () => setDialogState(null);

  const handleCreateSite = () => {
    closeOpenMenus();
    setDialogState({ type: 'create', value: '' });
  };

  const handleRenameSite = (siteId: string, currentTitle: string) => {
    closeOpenMenus();
    setDialogState({
      type: 'rename',
      siteId,
      currentTitle,
      value: currentTitle,
    });
  };

  const handleDeleteSite = (siteId: string) => {
    closeOpenMenus();
    setDialogState({ type: 'delete', siteId });
  };

  const submitCreateSite = () => {
    if (!dialogState || dialogState.type !== 'create') return;

    const siteTitle = dialogState.value.trim();
    if (!siteTitle) return;

    const site = createSite(siteTitle);
    setDialogState(null);
    router.push(`/sites/${site.id}`);
  };

  const submitRenameSite = () => {
    if (!dialogState || dialogState.type !== 'rename') return;

    const nextTitle = dialogState.value.trim();
    if (!nextTitle || nextTitle === dialogState.currentTitle) {
      setDialogState(null);
      return;
    }

    updateSite(dialogState.siteId, (site) => ({
      ...site,
      title: nextTitle,
    }));

    updateSessions(
      (session) => getSessionSiteKey(session) === dialogState.siteId,
      (session) => ({
        ...session,
        cover: {
          ...session.cover,
          businessName: nextTitle,
        },
      })
    );

    setDialogState(null);
  };

  const submitDeleteSite = () => {
    if (!dialogState || dialogState.type !== 'delete') return;
    deleteSite(dialogState.siteId);
    setDialogState(null);
  };

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <div className={styles.heroMain}>
              <span className={styles.heroBackLinkPlaceholder} aria-hidden="true">
                현장 목록으로
              </span>
              <div className={styles.heroMetaSpacer} aria-hidden="true" />
              <div className={styles.heroTitleRow}>
                <div className={styles.heroBody}>
                  <h1 className={styles.heroTitle}>현장 목록</h1>
                </div>
              </div>
            </div>

            <div className={styles.heroActions}>
              <span className="app-chip">총 {siteSummaries.length}개 현장</span>
              <button
                type="button"
                onClick={handleCreateSite}
                className="app-button app-button-primary"
              >
                새 현장 시작
              </button>
            </div>
          </header>

          <div className={styles.pageGrid}>
            <section className={styles.sessionPanel}>
              {isReady ? (
                siteSummaries.length > 0 ? (
                  <>
                    <div className={styles.listHead} aria-hidden="true">
                      <span>현장명</span>
                      <span>최근 점검일</span>
                      <span>보고서 수</span>
                      <span>마지막 저장</span>
                      <span>작업</span>
                    </div>

                    <div className={styles.siteList}>
                      {siteSummaries.map(({ site, latestSession, sessionCount }) => {
                        const siteHref = `/sites/${encodeURIComponent(site.id)}`;

                        return (
                          <article key={site.id} className={styles.siteRow}>
                            <div className={styles.primaryCell}>
                              <Link href={siteHref} className={styles.siteLink}>
                                <h3 className={styles.siteTitle}>{site.title}</h3>
                              </Link>
                            </div>

                            <div className={styles.dataCell}>
                              <span className={styles.mobileLabel}>최근 점검일</span>
                              <span className={styles.dataValue}>
                                {latestSession?.cover.inspectionDate || '-'}
                              </span>
                            </div>

                            <div className={styles.dataCell}>
                              <span className={styles.mobileLabel}>보고서 수</span>
                              <span className={styles.dataValue}>{sessionCount}건</span>
                            </div>

                            <div className={styles.dataCell}>
                              <span className={styles.mobileLabel}>마지막 저장</span>
                              <span className={styles.dataValue}>
                                {latestSession ? formatDateTime(latestSession.lastSavedAt) : '-'}
                              </span>
                            </div>

                            <div className={styles.mobileActions}>
                              <Link href={siteHref} className="app-button app-button-primary">
                                현장 보기
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleRenameSite(site.id, site.title)}
                                className="app-button app-button-secondary"
                              >
                                이름 수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSite(site.id)}
                                className={`${styles.mobileDangerButton} app-button app-button-secondary`}
                              >
                                삭제
                              </button>
                            </div>

                            <details className={styles.menuShell} data-menu-root="site-menu">
                              <summary
                                className={styles.menuButton}
                                aria-label={`${site.title} 작업 열기`}
                              >
                                ...
                              </summary>
                              <div className={styles.menuList}>
                                <Link
                                  href={siteHref}
                                  className={styles.menuItem}
                                  onClick={closeMenuFromEvent}
                                >
                                  현장 보기
                                </Link>
                                <button
                                  type="button"
                                  className={styles.menuItem}
                                  onClick={(event) => {
                                    closeMenuFromEvent(event);
                                    handleRenameSite(site.id, site.title);
                                  }}
                                >
                                  이름 수정
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                  onClick={(event) => {
                                    closeMenuFromEvent(event);
                                    handleDeleteSite(site.id);
                                  }}
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
                    <button
                      type="button"
                      onClick={handleCreateSite}
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

      <AppModal
        open={dialogState?.type === 'create'}
        title="새 현장 만들기"
        onClose={closeDialog}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeDialog}>
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={submitCreateSite}
              disabled={dialogState?.type !== 'create' || !dialogState.value.trim()}
            >
              생성
            </button>
          </>
        }
      >
        <input
          autoFocus
          className="app-input"
          placeholder="예: 사업장1"
          value={dialogState?.type === 'create' ? dialogState.value : ''}
          onChange={(event) => {
            if (dialogState?.type !== 'create') return;
            setDialogState({
              ...dialogState,
              value: event.target.value,
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitCreateSite();
            }
          }}
        />
      </AppModal>

      <AppModal
        open={dialogState?.type === 'rename'}
        title="현장 이름 수정"
        onClose={closeDialog}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeDialog}>
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={submitRenameSite}
              disabled={dialogState?.type !== 'rename' || !dialogState.value.trim()}
            >
              저장
            </button>
          </>
        }
      >
        <input
          autoFocus
          className="app-input"
          value={dialogState?.type === 'rename' ? dialogState.value : ''}
          onChange={(event) => {
            if (dialogState?.type !== 'rename') return;
            setDialogState({
              ...dialogState,
              value: event.target.value,
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitRenameSite();
            }
          }}
        />
      </AppModal>

      <AppModal
        open={dialogState?.type === 'delete'}
        title="현장 삭제"
        onClose={closeDialog}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeDialog}>
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={submitDeleteSite}
            >
              삭제
            </button>
          </>
        }
      />
    </main>
  );
}
