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
  buildWorkerPickerHref,
  getWorkerSiteEntryTitle,
  parseWorkerSiteEntryIntent,
} from '@/features/home/lib/siteEntry';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { SiteEntryHubPanel } from './SiteEntryHubPanel';
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
  const backHref = selectedEntryIntent ? buildWorkerPickerHref(selectedEntryIntent) : '/';
  const backLabel = selectedEntryIntent
    ? getWorkerSiteEntryTitle(selectedEntryIntent)
    : '?꾩옣 紐⑸줉';

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
              <p className={homeStyles.emptyTitle}>?꾩옣 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.</p>
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
              <p className={homeStyles.emptyTitle}>?꾩옣??李얠쓣 ???놁뒿?덈떎.</p>
              <p className={homeStyles.emptyDescription}>
                ?곌껐?섎젮???꾩옣 ?뺣낫媛 ?녾굅?????댁긽 諛곗젙?섏? ?딆븯?듬땲??
              </p>
              <div>
                <Link href="/" className="app-button app-button-secondary">
                  ?꾩옣 紐⑸줉?쇰줈 ?뚯븘媛湲?                </Link>
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
                <SiteEntryHubPanel
                  currentSite={currentSite}
                  reportCount={reportCount}
                  reportIndexStatus={reportIndexState?.status ?? null}
                  selectedEntryIntent={selectedEntryIntent}
                />
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
