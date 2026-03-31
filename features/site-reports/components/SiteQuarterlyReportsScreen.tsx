'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  formatQuarterLabel,
  getQuarterKeyForDate,
  getQuarterTargetsForConstructionPeriod,
  parseQuarterKey,
} from '@/lib/erpReports/shared';
import { buildSiteHubHref, buildSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { SiteReportsSummaryBar } from './SiteReportsSummaryBar';
import styles from './SiteReportsScreen.module.css';

interface SiteQuarterlyReportsScreenProps {
  siteKey: string;
}

type QuarterlyListSortMode = 'recent' | 'name' | 'status';

interface QuarterlyListRow {
  href: string;
  quarterKey: string;
  reportTitle: string;
  status: string;
  selectedCount: number | null;
  calculatedAt: string;
  periodLabel: string;
}

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getStatusLabel(status?: 'draft' | 'completed') {
  if (status === 'completed') return '완료';
  if (status === 'draft') return '작성 중';
  return '미작성';
}

function getStatusOrder(status: string) {
  if (status === '완료') return 0;
  if (status === '작성 중') return 1;
  return 2;
}

export function SiteQuarterlyReportsScreen({ siteKey }: SiteQuarterlyReportsScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<QuarterlyListSortMode>('recent');
  const deferredQuery = useDeferredValue(query);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const { authError, currentUser, isAuthenticated, isReady, login, logout, sites } =
    useInspectionSessions();

  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const { quarterlyReports, isLoading, error } = useSiteOperationalReports(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );

  const quarterTargets = useMemo(() => {
    if (!currentSite) return [];
    return getQuarterTargetsForConstructionPeriod(
      currentSite.adminSiteSnapshot.constructionPeriod || '',
    );
  }, [currentSite]);

  const currentQuarterTarget = useMemo(() => {
    const currentQuarterKey = getQuarterKeyForDate(new Date());
    return currentQuarterKey ? parseQuarterKey(currentQuarterKey) : null;
  }, []);

  const availableTargets = useMemo(() => {
    const byKey = new Map<string, NonNullable<typeof currentQuarterTarget>>();

    quarterTargets.forEach((target) => {
      byKey.set(target.quarterKey, target);
    });

    quarterlyReports.forEach((report) => {
      const parsed = parseQuarterKey(report.quarterKey);
      if (parsed) {
        byKey.set(parsed.quarterKey, parsed);
      }
    });

    if (currentQuarterTarget) {
      byKey.set(currentQuarterTarget.quarterKey, currentQuarterTarget);
    }

    return [...byKey.values()];
  }, [currentQuarterTarget, quarterTargets, quarterlyReports]);

  const rows = useMemo<QuarterlyListRow[]>(() => {
    if (!currentSite) return [];

    const reportByKey = new Map(quarterlyReports.map((report) => [report.quarterKey, report]));

    return availableTargets.map((target) => {
      const report = reportByKey.get(target.quarterKey);
      return {
        href: buildSiteQuarterlyHref(currentSite.id, target.quarterKey),
        quarterKey: target.quarterKey,
        reportTitle: report?.title || `${formatQuarterLabel(target)} 종합보고서`,
        status: getStatusLabel(report?.status),
        selectedCount: report ? report.generatedFromSessionIds.length : null,
        calculatedAt: report?.lastCalculatedAt || report?.updatedAt || '',
        periodLabel: `${target.startDate} ~ ${target.endDate}`,
      };
    });
  }, [availableTargets, currentSite, quarterlyReports]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const matchingRows = !normalizedQuery
      ? rows
      : rows.filter((row) =>
          [row.reportTitle, row.status, row.periodLabel, row.quarterKey]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        );

    return [...matchingRows].sort((left, right) => {
      if (sortMode === 'name') {
        return left.reportTitle.localeCompare(right.reportTitle, 'ko');
      }

      if (sortMode === 'status') {
        return (
          getStatusOrder(left.status) - getStatusOrder(right.status) ||
          right.quarterKey.localeCompare(left.quarterKey)
        );
      }

      const leftTime = left.calculatedAt ? new Date(left.calculatedAt).getTime() : 0;
      const rightTime = right.calculatedAt ? new Date(right.calculatedAt).getTime() : 0;
      return rightTime - leftTime || right.quarterKey.localeCompare(left.quarterKey);
    });
  }, [deferredQuery, rows, sortMode]);

  const currentQuarterHref = useMemo(() => {
    if (!currentSite) return null;
    const fallbackTarget = currentQuarterTarget || availableTargets[0];
    return fallbackTarget ? buildSiteQuarterlyHref(currentSite.id, fallbackTarget.quarterKey) : null;
  }, [availableTargets, currentQuarterTarget, currentSite]);

  const backHref = !isAdminView
    ? currentSite
      ? buildSiteHubHref(currentSite.id, 'quarterly')
      : '/'
    : currentSite
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : getAdminSectionHref('headquarters');
  const backLabel = isAdminView ? '본사 상세' : '현장 메뉴';

  const snapshot = currentSite?.adminSiteSnapshot;
  const siteNameDisplay = currentSite?.siteName?.trim() || snapshot?.siteName?.trim() || '-';
  const addressDisplay = snapshot?.siteAddress?.trim() || '-';
  const periodDisplay = snapshot?.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot?.constructionAmount?.trim() || '-';

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>분기 종합보고서 목록을 불러오는 중입니다.</p>
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
        title="분기 종합보고서 로그인"
        description="분기 종합보고서 목록을 보려면 다시 로그인해 주세요."
      />
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>현장 정보를 찾을 수 없습니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="headquarters" />
              ) : (
                <WorkerMenuPanel currentSiteKey={currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <Link href={backHref} className={styles.heroBackLink}>
                    {'<'} {backLabel}
                  </Link>
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>분기 종합보고서 목록</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <SiteReportsSummaryBar
                  addressDisplay={addressDisplay}
                  amountDisplay={amountDisplay}
                  periodDisplay={periodDisplay}
                  siteNameDisplay={siteNameDisplay}
                />

                <section className={styles.panel}>
                  <div className={styles.tableTools}>
                    <input
                      className={`app-input ${styles.tableSearch}`}
                      placeholder="보고서명, 상태, 기간 검색"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      aria-label="분기 종합보고서 검색"
                    />
                    <select
                      className={`app-select ${styles.tableSort}`}
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value as QuarterlyListSortMode)}
                      aria-label="분기 종합보고서 정렬"
                    >
                      <option value="recent">최근 재계산순</option>
                      <option value="name">보고서명순</option>
                      <option value="status">상태순</option>
                    </select>
                    {currentQuarterHref ? (
                      <Link
                        href={currentQuarterHref}
                        className={`app-button app-button-primary ${styles.tableCreateButton}`}
                      >
                        보고서 추가
                      </Link>
                    ) : null}
                  </div>

                  {error ? (
                    <div className={styles.tableTools}>
                      <span>{error}</span>
                    </div>
                  ) : null}

                  {(isLoading || (!error && rows.length === 0)) && rows.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>
                        {isLoading
                          ? '분기 종합보고서 목록을 불러오는 중입니다.'
                          : '아직 작성된 분기 종합보고서가 없습니다.'}
                      </p>
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>검색 조건에 맞는 분기 보고서가 없습니다.</p>
                      <p className={styles.emptySearchHint}>검색어나 정렬을 바꿔 다시 확인해 보세요.</p>
                    </div>
                  ) : (
                    <div className={styles.listViewport}>
                      <div className={styles.listTrack}>
                        <div className={styles.listHead} aria-hidden="true">
                          <span>보고서명</span>
                          <span>상태</span>
                          <span>선택 보고서</span>
                          <span className={styles.desktopOnly}>마지막 재계산</span>
                          <span className={styles.desktopOnly}>대상 기간</span>
                          <span>메뉴</span>
                        </div>

                        <div className={styles.reportList}>
                          {filteredRows.map((row) => (
                            <article key={row.quarterKey} className={styles.reportRow}>
                              <div className={`${styles.primaryCell} ${styles.titleCell}`}>
                                <Link href={row.href} className={styles.reportLink}>
                                  {row.reportTitle}
                                </Link>
                              </div>

                              <div className={styles.dataCell}>
                                <span className={styles.dataValue}>{row.status}</span>
                              </div>

                              <div className={styles.dataCell}>
                                <span className={styles.dataValue}>
                                  {row.selectedCount === null ? '-' : `${row.selectedCount}건`}
                                </span>
                              </div>

                              <div className={`${styles.dataCell} ${styles.desktopOnly}`}>
                                <span className={styles.dataValue}>
                                  {formatDateTimeLabel(row.calculatedAt)}
                                </span>
                              </div>

                              <div className={`${styles.dataCell} ${styles.desktopOnly}`}>
                                <span className={styles.dataValue}>{row.periodLabel}</span>
                              </div>

                              <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                                <ActionMenu
                                  label={`${row.reportTitle} 작업 메뉴 열기`}
                                  items={[
                                    {
                                      label: row.selectedCount === null ? '작성 시작' : '열기',
                                      href: row.href,
                                    },
                                  ]}
                                />
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={currentSite.id}
        />
      )}
    </main>
  );
}
