'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import { buildMobileHomeHref } from '@/features/home/lib/siteEntry';
import { MobileQuarterlyReportStatePanel } from '@/features/mobile/quarterly-report/MobileQuarterlyReportStatePanel';
import { MobileSiteHomeInfoSection } from '@/features/mobile/site-home/MobileSiteHomeInfoSection';
import { MobileSiteHomeLatestReportSection } from '@/features/mobile/site-home/MobileSiteHomeLatestReportSection';
import { MobileSiteHomeQuarterlySection } from '@/features/mobile/site-home/MobileSiteHomeQuarterlySection';
import { MobileSiteHomeSummarySection } from '@/features/mobile/site-home/MobileSiteHomeSummarySection';
import { useMobileSiteHomeScreenState } from '@/features/mobile/site-home/useMobileSiteHomeScreenState';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';

interface MobileSiteHomeScreenProps {
  siteKey: string;
}

export function MobileSiteHomeScreen({ siteKey }: MobileSiteHomeScreenProps) {
  const {
    authError,
    contactModel,
    currentSite,
    currentUserName,
    directSignatureHref,
    isAuthenticated,
    isReady,
    latestGuidanceDate,
    latestReportHref,
    latestReportProgressLabel,
    latestReportTitle,
    login,
    logout,
    photoAlbumHref,
    photoUpload,
    quarterlyListHref,
    quarterlyStatusLabel,
    reportIndexStatus,
  } = useMobileSiteHomeScreenState(siteKey);

  if (!isReady) {
    return <MobileQuarterlyReportStatePanel message="현장 정보를 불러오는 중입니다." />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="현장 메뉴 로그인"
        description="현장별 최신 보고 상태를 확인하고 모바일 보고서 흐름으로 이동합니다."
      />
    );
  }

  if (!currentSite || !contactModel || !photoAlbumHref || !quarterlyListHref || !latestReportHref) {
    return (
      <MobileQuarterlyReportStatePanel
        message="현장을 찾을 수 없습니다."
        actionHref={buildMobileHomeHref()}
        actionLabel="현장 목록으로 돌아가기"
      />
    );
  }

  return (
    <MobileShell
      backHref={buildMobileHomeHref()}
      backLabel="현장 목록"
      currentUserName={currentUserName}
      tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'site-home')} />}
      onLogout={logout}
      title={currentSite.siteName}
      webHref={`/sites/${encodeURIComponent(currentSite.id)}/entry`}
    >
      <MobileSiteHomeSummarySection
        directSignatureHref={directSignatureHref}
        isUploadingPhoto={photoUpload.isUploadingPhoto}
        latestGuidanceDate={latestGuidanceDate}
        photoAlbumHref={photoAlbumHref}
        photoUploadError={photoUpload.photoUploadError}
        photoUploadNotice={photoUpload.photoUploadNotice}
        reportIndexStatus={reportIndexStatus}
        onPhotoCapture={photoUpload.handlePhotoCapture}
      />
      <MobileSiteHomeInfoSection
        assigneeName={currentSite.assigneeName || contactModel.snapshot.assigneeName}
        businessStartNumber={contactModel.snapshot.businessStartNumber}
        companyName={contactModel.snapshot.companyName}
        constructionAmount={contactModel.snapshot.constructionAmount}
        constructionPeriod={contactModel.snapshot.constructionPeriod}
        customerName={currentSite.customerName}
        headquartersAddress={contactModel.snapshot.headquartersAddress}
        headquartersContact={contactModel.headquartersContact}
        headquartersContactHref={contactModel.headquartersContactHref}
        managementNumber={contactModel.snapshot.siteManagementNumber}
        managerPhone={contactModel.managerPhone}
        managerPhoneHref={contactModel.managerPhoneHref}
        showSiteContact={contactModel.showSiteContact}
        siteAddress={contactModel.snapshot.siteAddress}
        siteContact={contactModel.siteContact}
        siteContactHref={contactModel.siteContactHref}
        siteManagerName={contactModel.snapshot.siteManagerName}
      />
      <MobileSiteHomeLatestReportSection
        latestGuidanceDate={latestGuidanceDate}
        latestReportHref={latestReportHref}
        latestReportProgressLabel={latestReportProgressLabel}
        latestReportTitle={latestReportTitle}
      />
      <MobileSiteHomeQuarterlySection
        quarterlyListHref={quarterlyListHref}
        quarterlyStatusLabel={quarterlyStatusLabel}
      />
    </MobileShell>
  );
}
