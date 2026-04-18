'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { buildSiteHubHref } from '@/features/home/lib/siteEntry';
import { PhotoAlbumPanel } from '@/features/photos/components/PhotoAlbumPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';

interface SitePhotoAlbumScreenProps {
  backHref?: string;
  backLabel?: string;
  reportKey?: string;
  reportTitle?: string;
  siteKey: string;
}

function LoadingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>사진첩을 불러오는 중입니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MissingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>해당 현장을 찾을 수 없습니다.</p>
            <Link href="/" className="app-button app-button-secondary">
              현장 목록으로
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export function SitePhotoAlbumScreen({
  backHref,
  backLabel,
  reportKey,
  reportTitle,
  siteKey,
}: SitePhotoAlbumScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const {
    authError,
    currentUser,
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
  const defaultBackHref = currentSite
    ? isAdminView
      ? getAdminSectionHref('photos', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : buildSiteHubHref(currentSite.id)
    : '/';

  if (!isReady) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="현장 사진첩 로그인"
        description="로그인하면 배정된 현장의 사진을 업로드하고 원본 그대로 다운로드할 수 있습니다."
      />
    );
  }

  if (!currentSite) {
    return <MissingState />;
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <WorkerAppHeader
            brandHref={isAdminView ? '/admin' : '/'}
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="photos" currentSiteKey={currentSite.id} />
              ) : (
                <WorkerMenuPanel currentSiteKey={currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <PageBackControl
                    href={backHref || defaultBackHref}
                    label={backLabel || '이전'}
                    ariaLabel={backLabel || '이전 화면으로 돌아가기'}
                  />
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>현장 사진첩 - {currentSite.siteName}</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <PhotoAlbumPanel
                  backHref={backHref || defaultBackHref}
                  backLabel={backLabel || '이전 화면으로 돌아가기'}
                  initialHeadquarterId={currentSite.headquarterId}
                  initialReportKey={reportKey || null}
                  initialReportTitle={reportTitle || null}
                  initialSiteId={currentSite.id}
                  lockedHeadquarterId={currentSite.headquarterId}
                  lockedSiteId={currentSite.id}
                  mode={isAdminView ? 'admin' : 'worker'}
                  sites={[
                    {
                      headquarterId: currentSite.headquarterId || '',
                      headquarterName: currentSite.customerName || '사업장',
                      id: currentSite.id,
                      siteName: currentSite.siteName,
                      totalRounds: currentSite.totalRounds ?? null,
                    },
                  ]}
                />
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="photos"
          currentSiteKey={currentSite.id}
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
