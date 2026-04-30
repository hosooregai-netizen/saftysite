'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { buildSiteHubHref } from '@/features/home/lib/siteEntry';
import { PhotoAlbumPanel } from '@/features/photos/components/PhotoAlbumPanel';
import { useResolvedSiteRoute } from '@/features/site-reports/hooks/useResolvedSiteRoute';
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

const LOADING_TITLE = '\uC0AC\uC9C4\uCCA9\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.';
const MISSING_TITLE = '\uD574\uB2F9 \uD604\uC7A5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.';
const SITE_LIST_LABEL = '\uD604\uC7A5 \uBAA9\uB85D\uC73C\uB85C';
const BACK_LABEL = '\uC774\uC804';
const BACK_ARIA_LABEL = '\uC774\uC804 \uD654\uBA74\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30';
const BACK_TO_PREVIOUS_LABEL = '\uC774\uC804 \uD654\uBA74\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30';
const LOGIN_TITLE = '\uD604\uC7A5 \uC0AC\uC9C4\uCCA9 \uB85C\uADF8\uC778';
const LOGIN_DESCRIPTION =
  '\uB85C\uADF8\uC778\uD558\uBA74 \uBC30\uC815\uB41C \uD604\uC7A5 \uC0AC\uC9C4\uC744 \uD655\uC778\uD558\uACE0 \uC6D0\uBCF8 \uADF8\uB300\uB85C \uB2E4\uC6B4\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.';
const TITLE_PREFIX = '\uD604\uC7A5 \uC0AC\uC9C4\uCCA9 - ';
const HEADQUARTER_FALLBACK = '\uAC74\uC124\uC0AC';

function LoadingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>{LOADING_TITLE}</p>
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
            <p className={styles.emptyTitle}>{MISSING_TITLE}</p>
            <Link href="/" className="app-button app-button-secondary">
              {SITE_LIST_LABEL}
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
  const { authError, currentUser, isAuthenticated, isReady, login, logout } =
    useInspectionSessions();
  const { currentSite: resolvedSite, isResolvingSite } = useResolvedSiteRoute(siteKey);

  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const defaultBackHref = resolvedSite
    ? isAdminView
      ? getAdminSectionHref('photos', {
          headquarterId: resolvedSite.headquarterId,
          siteId: resolvedSite.id,
        })
      : buildSiteHubHref(resolvedSite.id)
    : '/';

  if (!isReady) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title={LOGIN_TITLE}
        description={LOGIN_DESCRIPTION}
      />
    );
  }

  if (isResolvingSite) {
    return <LoadingState />;
  }

  if (!resolvedSite) {
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
                <AdminMenuPanel
                  activeSection="photos"
                  currentHeadquarterId={resolvedSite.headquarterId ?? null}
                  currentSiteKey={resolvedSite.id}
                />
              ) : (
                <WorkerMenuPanel currentSiteKey={resolvedSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={styles.contentColumn}>
              <header className={styles.hero}>
                <div className={styles.heroBody}>
                  <PageBackControl
                    href={backHref || defaultBackHref}
                    label={backLabel || BACK_LABEL}
                    ariaLabel={backLabel || BACK_ARIA_LABEL}
                  />
                  <div className={styles.heroMain}>
                    <h1 className={styles.heroTitle}>{`${TITLE_PREFIX}${resolvedSite.siteName}`}</h1>
                  </div>
                </div>
              </header>

              <div className={styles.pageGrid}>
                <PhotoAlbumPanel
                  backHref={backHref || defaultBackHref}
                  backLabel={backLabel || BACK_TO_PREVIOUS_LABEL}
                  initialHeadquarterId={resolvedSite.headquarterId}
                  initialReportKey={reportKey || null}
                  initialReportTitle={reportTitle || null}
                  initialSiteId={resolvedSite.id}
                  lockedHeadquarterId={resolvedSite.headquarterId}
                  lockedSiteId={resolvedSite.id}
                  mode={isAdminView ? 'admin' : 'worker'}
                  sites={[
                    {
                      headquarterId: resolvedSite.headquarterId || '',
                      headquarterName: resolvedSite.customerName || HEADQUARTER_FALLBACK,
                      id: resolvedSite.id,
                      siteName: resolvedSite.siteName,
                      totalRounds: resolvedSite.totalRounds ?? null,
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
          currentHeadquarterId={resolvedSite.headquarterId ?? null}
          currentSiteKey={resolvedSite.id}
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={resolvedSite.id}
        />
      )}
    </main>
  );
}
