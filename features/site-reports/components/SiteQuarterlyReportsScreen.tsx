'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
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
import shellStyles from './SiteReportsScreen.module.css';
import operationalStyles from '@/components/site/OperationalReports.module.css';

interface SiteQuarterlyReportsScreenProps {
  siteKey: string;
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

export function SiteQuarterlyReportsScreen({ siteKey }: SiteQuarterlyReportsScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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

    return [...byKey.values()].sort((left, right) => right.quarterKey.localeCompare(left.quarterKey));
  }, [currentQuarterTarget, quarterTargets, quarterlyReports]);

  const quarterlyByKey = useMemo(
    () => new Map(quarterlyReports.map((report) => [report.quarterKey, report])),
    [quarterlyReports],
  );

  const latestUpdatedAt = useMemo(() => {
    if (quarterlyReports.length === 0) return '';
    return [...quarterlyReports]
      .sort(
        (left, right) =>
          new Date(right.updatedAt || right.lastCalculatedAt).getTime() -
          new Date(left.updatedAt || left.lastCalculatedAt).getTime(),
      )[0]?.updatedAt;
  }, [quarterlyReports]);

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
          <section className={operationalStyles.sectionCard}>
            분기 종합보고서 목록을 불러오는 중입니다.
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
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>현장 정보를 찾을 수 없습니다.</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${shellStyles.shell}`}>
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

            <div className={shellStyles.contentColumn}>
              <header className={shellStyles.hero}>
                <div className={shellStyles.heroBody}>
                  <Link href={backHref} className={shellStyles.heroBackLink}>
                    {'<'} {backLabel}
                  </Link>
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>분기 종합보고서 목록</h1>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <SiteReportsSummaryBar
                  addressDisplay={addressDisplay}
                  amountDisplay={amountDisplay}
                  periodDisplay={periodDisplay}
                  siteNameDisplay={siteNameDisplay}
                />

                <section className={shellStyles.panel}>
                  <div className={shellStyles.tableTools}>
                    <div>
                      <strong className={operationalStyles.reportCardTitle}>분기 종합보고서</strong>
                      <p className={operationalStyles.reportCardDescription}>
                        기술지도 보고서 목록처럼 분기별 보고서 상태와 최근 계산 이력을 한 번에 확인할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className={operationalStyles.summaryGrid} style={{ padding: '16px' }}>
                    <article className={operationalStyles.summaryCard}>
                      <span className={operationalStyles.summaryLabel}>대상 분기</span>
                      <strong className={operationalStyles.summaryValue}>{availableTargets.length}개</strong>
                    </article>
                    <article className={operationalStyles.summaryCard}>
                      <span className={operationalStyles.summaryLabel}>저장된 보고서</span>
                      <strong className={operationalStyles.summaryValue}>{quarterlyReports.length}건</strong>
                    </article>
                    <article className={operationalStyles.summaryCard}>
                      <span className={operationalStyles.summaryLabel}>현재 분기</span>
                      <strong className={operationalStyles.summaryValue}>
                        {currentQuarterTarget ? formatQuarterLabel(currentQuarterTarget) : '-'}
                      </strong>
                    </article>
                    <article className={operationalStyles.summaryCard}>
                      <span className={operationalStyles.summaryLabel}>마지막 수정</span>
                      <strong className={operationalStyles.summaryValue}>
                        {formatDateTimeLabel(latestUpdatedAt)}
                      </strong>
                    </article>
                  </div>

                  {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}

                  {availableTargets.length > 0 ? (
                    <div className={shellStyles.listViewport}>
                      <div className={shellStyles.listTrack}>
                        <div className={shellStyles.listHead} aria-hidden="true">
                          <span>보고서명</span>
                          <span>상태</span>
                          <span>선택 보고서</span>
                          <span className={shellStyles.desktopOnly}>마지막 재계산</span>
                          <span className={shellStyles.desktopOnly}>대상 기간</span>
                          <span>열기</span>
                        </div>

                        <div className={shellStyles.reportList}>
                          {availableTargets.map((target) => {
                            const report = quarterlyByKey.get(target.quarterKey);
                            const href = buildSiteQuarterlyHref(currentSite.id, target.quarterKey);
                            const title = report?.title || `${target.label} 종합보고서`;

                            return (
                              <article key={target.quarterKey} className={shellStyles.reportRow}>
                                <div className={`${shellStyles.primaryCell} ${shellStyles.titleCell}`}>
                                  <Link href={href} className={shellStyles.reportLink}>
                                    {title}
                                  </Link>
                                </div>

                                <div className={shellStyles.dataCell}>
                                  <span className={shellStyles.dataValue}>
                                    {getStatusLabel(report?.status)}
                                  </span>
                                </div>

                                <div className={shellStyles.dataCell}>
                                  <span className={shellStyles.dataValue}>
                                    {report ? `${report.generatedFromSessionIds.length}건` : '-'}
                                  </span>
                                </div>

                                <div className={`${shellStyles.dataCell} ${shellStyles.desktopOnly}`}>
                                  <span className={shellStyles.dataValue}>
                                    {formatDateTimeLabel(report?.lastCalculatedAt || report?.updatedAt)}
                                  </span>
                                </div>

                                <div className={`${shellStyles.dataCell} ${shellStyles.desktopOnly}`}>
                                  <span className={shellStyles.dataValue}>
                                    {target.startDate} ~ {target.endDate}
                                  </span>
                                </div>

                                <div className={shellStyles.actionCell}>
                                  <Link href={href} className="app-button app-button-secondary">
                                    {report ? '열기' : '작성'}
                                  </Link>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={shellStyles.emptyState}>
                      <p className={shellStyles.emptyTitle}>표시할 분기 정보가 없습니다.</p>
                      <p className={shellStyles.emptySearchHint}>
                        공사기간 정보가 없거나 아직 분기 대상이 계산되지 않았습니다.
                      </p>
                    </div>
                  )}

                  {isLoading ? (
                    <div className={operationalStyles.bannerInfo} style={{ margin: '0 16px 16px' }}>
                      분기 보고서 목록을 새로 불러오고 있습니다.
                    </div>
                  ) : null}
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
