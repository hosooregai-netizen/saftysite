'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import {
  buildMobileHomeHref,
  buildMobileSiteHomeHref,
  buildSitePhotoAlbumHref,
} from '@/features/home/lib/siteEntry';
import { PhotoAlbumPanel } from '@/features/photos/components/PhotoAlbumPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { MobileShell } from './MobileShell';
import styles from './MobileShell.module.css';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';

interface MobileSitePhotoAlbumScreenProps {
  siteKey: string;
}

export function MobileSitePhotoAlbumScreen({
  siteKey,
}: MobileSitePhotoAlbumScreenProps) {
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

  if (!isReady) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>현장 사진첩을 불러오는 중입니다.</h1>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 사진첩 로그인"
        description="현장 사진을 확인하고 업로드한 뒤 원본 그대로 다운로드할 수 있습니다."
      />
    );
  }

  if (!currentSite) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>현장을 찾을 수 없습니다.</h1>
              <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
                현장 목록으로 돌아가기
              </Link>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const mobileSiteHomeHref = buildMobileSiteHomeHref(currentSite.id);

  return (
    <MobileShell
      backHref={mobileSiteHomeHref}
      backLabel="현장 홈"
      currentUserName={currentUser?.name}
      onLogout={logout}
      tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'photos')} />}
      title={currentSite.siteName}
      webHref={buildSitePhotoAlbumHref(currentSite.id)}
    >
      <PhotoAlbumPanel
        initialHeadquarterId={currentSite.headquarterId}
        initialSiteId={currentSite.id}
        lockedHeadquarterId={currentSite.headquarterId}
        lockedSiteId={currentSite.id}
        mode="worker"
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
    </MobileShell>
  );
}
