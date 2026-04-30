'use client';

import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import {
  buildMobileHomeHref,
  buildMobileSiteHomeHref,
  buildSitePhotoAlbumHref,
} from '@/features/home/lib/siteEntry';
import { PhotoAlbumPanel } from '@/features/photos/components/PhotoAlbumPanel';
import { useResolvedSiteRoute } from '@/features/site-reports/hooks/useResolvedSiteRoute';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import { MobileShell } from './MobileShell';
import styles from './MobileShell.module.css';
import { MobileTabBar } from './MobileTabBar';

interface MobileSitePhotoAlbumScreenProps {
  siteKey: string;
}

const LOADING_TITLE = '\uD604\uC7A5 \uC0AC\uC9C4\uCCA9\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.';
const MISSING_TITLE = '\uD604\uC7A5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.';
const SITE_LIST_LABEL = '\uD604\uC7A5 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30';
const LOGIN_TITLE = '\uBAA8\uBC14\uC77C \uC0AC\uC9C4\uCCA9 \uB85C\uADF8\uC778';
const LOGIN_DESCRIPTION =
  '\uD604\uC7A5 \uC0AC\uC9C4\uC744 \uD655\uC778\uD558\uACE0 \uC5C5\uB85C\uB4DC\uD55C \uD30C\uC77C\uC744 \uC6D0\uBCF8 \uADF8\uB300\uB85C \uB2E4\uC6B4\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.';
const MOBILE_HOME_LABEL = '\uD604\uC7A5 \uD648';
const HEADQUARTER_FALLBACK = '\uAC74\uC124\uC0AC';

function LoadingState() {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <h1 className={styles.sectionTitle}>{LOADING_TITLE}</h1>
          </section>
        </div>
      </div>
    </main>
  );
}

function MissingState() {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <h1 className={styles.sectionTitle}>{MISSING_TITLE}</h1>
            <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
              {SITE_LIST_LABEL}
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

export function MobileSitePhotoAlbumScreen({
  siteKey,
}: MobileSitePhotoAlbumScreenProps) {
  const { authError, currentUser, isAuthenticated, isReady, login, logout } =
    useInspectionSessions();
  const { currentSite: resolvedSite, isResolvingSite } = useResolvedSiteRoute(siteKey);

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

  const mobileSiteHomeHref = buildMobileSiteHomeHref(resolvedSite.id);

  return (
    <MobileShell
      backHref={mobileSiteHomeHref}
      backLabel={MOBILE_HOME_LABEL}
      currentUserName={currentUser?.name}
      onLogout={logout}
      tabBar={<MobileTabBar tabs={buildSiteTabs(resolvedSite.id, 'photos')} />}
      title={resolvedSite.siteName}
      webHref={buildSitePhotoAlbumHref(resolvedSite.id)}
    >
      <PhotoAlbumPanel
        initialHeadquarterId={resolvedSite.headquarterId}
        initialSiteId={resolvedSite.id}
        lockedHeadquarterId={resolvedSite.headquarterId}
        lockedSiteId={resolvedSite.id}
        mode="worker"
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
    </MobileShell>
  );
}
