'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  buildSiteBadWorkplaceHref,
  buildSiteQuarterlyHref,
  buildSiteReportsHref,
  buildWorkerPickerHref,
  getWorkerSiteEntryTitle,
  parseWorkerSiteEntryIntent,
} from '@/features/home/lib/siteEntry';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import {
  getCurrentReportMonth,
  getQuarterTargetsForConstructionPeriod,
} from '@/lib/erpReports/shared';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import homeStyles from './HomeScreen.module.css';
import entryStyles from './SiteEntryScreens.module.css';

interface SiteEntryHubScreenProps {
  initialEntry?: string | null;
  siteKey: string;
}

export function SiteEntryHubScreen({
  initialEntry,
  siteKey,
}: SiteEntryHubScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(siteKey);
  const selectedEntryIntent = parseWorkerSiteEntryIntent(initialEntry);
  const {
    authError,
    currentUser,
    ensureSiteReportIndexLoaded,
    getReportIndexBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();

  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const adminHref = useMemo(() => {
    if (!currentSite?.headquarterId) {
      return getAdminSectionHref('headquarters');
    }

    return getAdminSectionHref('headquarters', {
      headquarterId: currentSite.headquarterId,
      siteId: currentSite.id,
    });
  }, [currentSite]);
  const reportIndexState = currentSite ? getReportIndexBySiteId(currentSite.id) : null;
  const reportCount = reportIndexState?.items.length ?? 0;
  const snapshot = currentSite?.adminSiteSnapshot;
  const siteNameDisplay = currentSite?.siteName?.trim() || snapshot?.siteName?.trim() || '-';
  const addressDisplay = snapshot?.siteAddress?.trim() || '-';
  const periodDisplay = snapshot?.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot?.constructionAmount?.trim() || '-';
  const quarterTargets = useMemo(() => {
    if (!currentSite) return [];
    return getQuarterTargetsForConstructionPeriod(
      currentSite.adminSiteSnapshot.constructionPeriod || '',
    ).slice().reverse();
  }, [currentSite]);
  const badWorkplaceHref = currentSite
    ? buildSiteBadWorkplaceHref(currentSite.id, getCurrentReportMonth())
    : null;
  const backHref = selectedEntryIntent ? buildWorkerPickerHref(selectedEntryIntent) : '/';
  const backLabel = selectedEntryIntent
    ? getWorkerSiteEntryTitle(selectedEntryIntent)
    : '현장 목록';

  useEffect(() => {
    if (isAdminView) {
      router.replace(adminHref);
    }
  }, [adminHref, isAdminView, router]);

  useEffect(() => {
    if (!currentSite) return;
    void ensureSiteReportIndexLoaded(currentSite.id);
  }, [currentSite, ensureSiteReportIndexLoaded]);

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={homeStyles.emptyState}>
              <p className={homeStyles.emptyTitle}>현장 정보를 불러오는 중입니다.</p>
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
        title="현장 허브 로그인"
        description="로그인하면 선택한 현장의 기술지도 보고서와 추가 업무 문서를 이어서 진행할 수 있습니다."
      />
    );
  }

  if (isAdminView) {
    return null;
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={homeStyles.emptyState}>
              <p className={homeStyles.emptyTitle}>현장을 찾을 수 없습니다.</p>
              <p className={homeStyles.emptyDescription}>
                연결하려는 현장 정보가 없거나 더 이상 배정되지 않았습니다.
              </p>
              <div>
                <Link href="/" className="app-button app-button-secondary">
                  현장 목록으로 돌아가기
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${homeStyles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel currentSiteKey={currentSite.id} />
            </WorkerMenuSidebar>

            <div className={homeStyles.contentColumn}>
              <header className={homeStyles.hero}>
                <div className={homeStyles.heroBody}>
                  <Link href={backHref} className={entryStyles.heroBackLink}>
                    {'<'} {backLabel}
                  </Link>
                  <div className={homeStyles.heroMain}>
                    <h1 className={homeStyles.heroTitle}>{currentSite.siteName}</h1>
                  </div>
                </div>
              </header>

              <div className={homeStyles.pageGrid}>
                <SiteReportsSummaryBar
                  addressDisplay={addressDisplay}
                  amountDisplay={amountDisplay}
                  periodDisplay={periodDisplay}
                  siteNameDisplay={siteNameDisplay}
                />

                <section className={entryStyles.entryGrid}>
                  <article
                    className={`${entryStyles.entryCard} ${
                      !selectedEntryIntent ? entryStyles.entryCardActive : ''
                    }`}
                  >
                    <div className={entryStyles.entryHeader}>
                      <span className="app-chip">기술지도</span>
                      <span className="app-chip">
                        {reportIndexState?.status === 'loading' ? '불러오는 중' : `${reportCount}건`}
                      </span>
                    </div>
                    <div className={entryStyles.entryBody}>
                      <h2 className={entryStyles.entryTitle}>기술지도 보고서</h2>
                      <p className={entryStyles.entryDescription}>
                        이 현장의 기술지도 보고서 목록을 확인하고 새 보고서를 작성합니다.
                      </p>
                      <p className={entryStyles.entryMeta}>
                        {reportIndexState?.status === 'loading'
                          ? '보고서 목록을 불러오고 있습니다.'
                          : reportCount > 0
                            ? `등록된 기술지도 보고서 ${reportCount}건`
                            : '아직 등록된 기술지도 보고서가 없습니다.'}
                      </p>
                    </div>
                    <div className={entryStyles.entryActions}>
                      <Link
                        href={buildSiteReportsHref(currentSite.id)}
                        className="app-button app-button-primary"
                      >
                        보고서 목록 열기
                      </Link>
                    </div>
                  </article>

                  <article
                    className={`${entryStyles.entryCard} ${
                      selectedEntryIntent === 'quarterly' ? entryStyles.entryCardActive : ''
                    }`}
                  >
                    <div className={entryStyles.entryHeader}>
                      <span className="app-chip">분기</span>
                      <span className="app-chip">대상 {quarterTargets.length}개</span>
                    </div>
                    <div className={entryStyles.entryBody}>
                      <h2 className={entryStyles.entryTitle}>분기 종합 보고서</h2>
                      <p className={entryStyles.entryDescription}>
                        공사기간을 기준으로 대상 분기를 고른 뒤 기술지도 보고서를 묶어 분기
                        종합보고서를 작성합니다.
                      </p>
                    </div>
                    {quarterTargets.length > 0 ? (
                      <div className={entryStyles.subLinkList}>
                        {quarterTargets.map((target) => (
                          <Link
                            key={target.quarterKey}
                            href={buildSiteQuarterlyHref(currentSite.id, target.quarterKey)}
                            className={entryStyles.subLink}
                          >
                            {target.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className={entryStyles.emptyHint}>
                        공사기간이 3개월 미만이거나 기간 정보가 없어 대상 분기를 계산하지
                        못했습니다.
                      </p>
                    )}
                  </article>

                  <article
                    className={`${entryStyles.entryCard} ${
                      selectedEntryIntent === 'bad-workplace'
                        ? entryStyles.entryCardActive
                        : ''
                    }`}
                  >
                    <div className={entryStyles.entryHeader}>
                      <span className="app-chip">신고</span>
                      <span className="app-chip">{getCurrentReportMonth()}</span>
                    </div>
                    <div className={entryStyles.entryBody}>
                      <h2 className={entryStyles.entryTitle}>불량사업장 신고</h2>
                      <p className={entryStyles.entryDescription}>
                        최근 기술지도 보고서의 지적사항을 바탕으로 이번 달 신고 초안을
                        작성합니다.
                      </p>
                      <p className={entryStyles.entryMeta}>
                        기술지도 보고서를 먼저 확인한 뒤 필요한 지적사항을 이어서 가져올 수
                        있습니다.
                      </p>
                    </div>
                    <div className={entryStyles.entryActions}>
                      {badWorkplaceHref ? (
                        <Link href={badWorkplaceHref} className="app-button app-button-primary">
                          이번 달 신고 작성
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </section>
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <WorkerMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentSiteKey={currentSite.id}
      />
    </main>
  );
}
