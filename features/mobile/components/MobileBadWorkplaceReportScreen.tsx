'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import {
  buildMobileSiteHomeHref,
  buildSiteBadWorkplaceHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from '@/features/mobile/components/MobileShell';
import { MobileTabBar } from '@/features/mobile/components/MobileTabBar';
import { MobileBadWorkplaceDocumentInfoModal } from '@/features/mobile/bad-workplace/MobileBadWorkplaceDocumentInfoModal';
import { MobileBadWorkplaceNotificationSection } from '@/features/mobile/bad-workplace/MobileBadWorkplaceNotificationSection';
import { MobileBadWorkplaceSiteInfoSection } from '@/features/mobile/bad-workplace/MobileBadWorkplaceSiteInfoSection';
import { MobileBadWorkplaceSourceModal } from '@/features/mobile/bad-workplace/MobileBadWorkplaceSourceModal';
import { MobileBadWorkplaceSourceSection } from '@/features/mobile/bad-workplace/MobileBadWorkplaceSourceSection';
import { MobileBadWorkplaceSummarySection } from '@/features/mobile/bad-workplace/MobileBadWorkplaceSummarySection';
import { MobileBadWorkplaceViolationsSection } from '@/features/mobile/bad-workplace/MobileBadWorkplaceViolationsSection';
import { useMobileBadWorkplaceScreenState } from '@/features/mobile/bad-workplace/useMobileBadWorkplaceScreenState';
import { buildSiteTabs } from '@/features/mobile/lib/buildSiteTabs';
import { formatReportMonthLabel } from '@/lib/erpReports/shared';
import { MobileQuarterlyReportStatePanel } from '@/features/mobile/quarterly-report/MobileQuarterlyReportStatePanel';
import styles from './MobileShell.module.css';

interface MobileBadWorkplaceReportScreenProps {
  reportMonth: string;
  siteKey: string;
}

export function MobileBadWorkplaceReportScreen({
  reportMonth,
  siteKey,
}: MobileBadWorkplaceReportScreenProps) {
  const {
    authError,
    currentSite,
    currentUserName,
    decodedReportMonth,
    documentError,
    documentInfoOpen,
    draft,
    handleDownloadHwpx,
    handleDownloadPdf,
    handleSaveWithFeedback,
    handleSourceSessionChange,
    isAuthenticated,
    isGeneratingHwpx,
    isGeneratingPdf,
    isLoading,
    isReady,
    isSaving,
    loadError,
    login,
    logout,
    mutationError,
    notice,
    selectedSession,
    setDocumentInfoOpen,
    setSourceModalOpen,
    sourceModalOpen,
    siteSessions,
    updateDraft,
    updateSiteSnapshot,
    updateViolation,
  } = useMobileBadWorkplaceScreenState({ reportMonth, siteKey });

  if (!isReady) {
    return <MobileQuarterlyReportStatePanel message="불량사업장 신고서를 준비하고 있습니다." />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 불량사업장 신고 로그인"
        description="모바일에서 원본 보고서를 선택하고 불량사업장 신고서를 작성할 수 있습니다."
      />
    );
  }

  if (!currentSite) {
    return (
      <MobileQuarterlyReportStatePanel
        message="현장을 찾을 수 없습니다."
        actionHref="/mobile"
        actionLabel="현장 목록"
      />
    );
  }

  if (isLoading && !draft) {
    return <MobileQuarterlyReportStatePanel message="불량사업장 신고서를 불러오는 중입니다." />;
  }

  if (!draft) {
    return (
      <MobileQuarterlyReportStatePanel
        message="불량사업장 신고서를 열 수 없습니다."
        detail={loadError || '보고서를 찾지 못했습니다.'}
      />
    );
  }

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteHomeHref(currentSite.id)}
        backLabel="현장 메인"
        currentUserName={currentUserName}
        fullHeight
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'bad-workplace')} />}
        title={draft.title || `${formatReportMonthLabel(decodedReportMonth)} 불량사업장 신고`}
        webHref={buildSiteBadWorkplaceHref(currentSite.id, draft.reportMonth || decodedReportMonth)}
      >
        <MobileBadWorkplaceSummarySection
          draft={draft}
          isGeneratingHwpx={isGeneratingHwpx}
          isGeneratingPdf={isGeneratingPdf}
          isSaving={isSaving}
          onDownloadHwpx={() => void handleDownloadHwpx()}
          onDownloadPdf={() => void handleDownloadPdf()}
          onOpenDocumentInfo={() => setDocumentInfoOpen(true)}
          onSave={() => void handleSaveWithFeedback()}
        />

        <div className={styles.mobileScreenScrollBody}>
          <div style={{ display: 'grid', gap: '14px', padding: '14px' }}>
            {loadError ? <div className={styles.errorNotice}>{loadError}</div> : null}
            {mutationError ? <div className={styles.errorNotice}>{mutationError}</div> : null}
            {documentError ? <div className={styles.errorNotice}>{documentError}</div> : null}
            {notice ? <div className={styles.inlineNotice}>{notice}</div> : null}

            <MobileBadWorkplaceSourceSection
              selectedSession={selectedSession}
              siteSessions={siteSessions}
              onOpenSourceModal={() => setSourceModalOpen(true)}
            />
            <MobileBadWorkplaceSiteInfoSection
              draft={draft}
              onUpdateDraft={updateDraft}
              onUpdateSiteSnapshot={updateSiteSnapshot}
            />
            <MobileBadWorkplaceNotificationSection
              draft={draft}
              onUpdateDraft={updateDraft}
            />
            <MobileBadWorkplaceViolationsSection
              draft={draft}
              onUpdateViolation={updateViolation}
            />
          </div>
        </div>
      </MobileShell>

      <MobileBadWorkplaceSourceModal
        open={sourceModalOpen}
        selectedSessionId={selectedSession?.id ?? null}
        siteSessions={siteSessions}
        onClose={() => setSourceModalOpen(false)}
        onSelectSession={handleSourceSessionChange}
      />
      <MobileBadWorkplaceDocumentInfoModal
        draft={draft}
        open={documentInfoOpen}
        selectedSession={selectedSession}
        onClose={() => setDocumentInfoOpen(false)}
      />
    </>
  );
}
