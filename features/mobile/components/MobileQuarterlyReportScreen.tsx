'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import {
  buildMobileSiteQuarterlyListHref,
  buildSiteQuarterlyHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from '@/features/mobile/components/MobileShell';
import { MobileTabBar } from '@/features/mobile/components/MobileTabBar';
import { MobileQuarterlyDocumentInfoModal } from '@/features/mobile/quarterly-report/MobileQuarterlyDocumentInfoModal';
import { MobileQuarterlyReportStatePanel } from '@/features/mobile/quarterly-report/MobileQuarterlyReportStatePanel';
import { MobileQuarterlySourceModal } from '@/features/mobile/quarterly-report/MobileQuarterlySourceModal';
import { MobileQuarterlyStepContent } from '@/features/mobile/quarterly-report/MobileQuarterlyStepContent';
import { MobileQuarterlySummarySection } from '@/features/mobile/quarterly-report/MobileQuarterlySummarySection';
import { useMobileQuarterlyReportScreenState } from '@/features/mobile/quarterly-report/useMobileQuarterlyReportScreenState';
import { buildSiteTabs } from '@/features/mobile/lib/buildSiteTabs';

interface MobileQuarterlyReportScreenProps {
  quarterKey: string;
  siteKey: string;
}

export function MobileQuarterlyReportScreen({
  quarterKey,
  siteKey,
}: MobileQuarterlyReportScreenProps) {
  const {
    activeStep,
    authError,
    currentSite,
    currentUserName,
    documentInfoOpen,
    documentNotice,
    draft,
    handleAddFuturePlan,
    handleAddImplementationRow,
    handleApplySourceSelection,
    handleChangeDocumentField,
    handleChangeTitle,
    handleDownloadHwpx,
    handleDownloadPdf,
    handlePeriodFieldChange,
    handleQuarterChange,
    handleRemoveFuturePlan,
    handleRemoveImplementationRow,
    handleSave,
    handleSelectOpsAsset,
    handleToggleSourceReport,
    handleUpdateFuturePlan,
    handleUpdateImplementationRow,
    handleUpdateSnapshotField,
    isAuthenticated,
    isGeneratingHwpx,
    isGeneratingPdf,
    isLoading,
    isOpsAssetsLoading,
    isOpsAssetsRefreshing,
    isReady,
    isSaving,
    isSourceLoading,
    loadError,
    login,
    logout,
    mutationError,
    opsAssets,
    saveNotice,
    selectedQuarter,
    selectedSourceKeys,
    setActiveStep,
    setDocumentInfoOpen,
    setSourceModalOpen,
    sourceError,
    sourceModalOpen,
    sourceNotice,
    sourceReports,
  } = useMobileQuarterlyReportScreenState({ quarterKey, siteKey });

  if (!isReady) {
    return <MobileQuarterlyReportStatePanel message="분기 보고서를 준비하고 있습니다." />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 분기 보고 로그인"
        description="모바일에서 분기 종합보고서를 작성할 수 있습니다."
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
    return <MobileQuarterlyReportStatePanel message="분기 보고서를 불러오는 중입니다." />;
  }

  if (!draft) {
    return (
      <MobileQuarterlyReportStatePanel
        message="분기 보고서를 열 수 없습니다."
        detail={loadError || '보고서를 찾지 못했습니다.'}
      />
    );
  }

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteQuarterlyListHref(currentSite.id)}
        backLabel="분기 목록"
        currentUserName={currentUserName}
        fullHeight
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'quarterly')} />}
        title={draft.title || currentSite.siteName}
        webHref={buildSiteQuarterlyHref(currentSite.id, draft.id)}
      >
        <MobileQuarterlySummarySection
          activeStep={activeStep}
          draft={draft}
          isGeneratingHwpx={isGeneratingHwpx}
          isGeneratingPdf={isGeneratingPdf}
          isSaving={isSaving}
          onDownloadHwpx={() => void handleDownloadHwpx()}
          onDownloadPdf={() => void handleDownloadPdf()}
          onOpenDocumentInfo={() => setDocumentInfoOpen(true)}
          onSave={() => void handleSave()}
          onStepChange={setActiveStep}
        >
          <MobileQuarterlyStepContent
            activeStep={activeStep}
            documentNotice={documentNotice}
            draft={draft}
            isOpsAssetsLoading={isOpsAssetsLoading}
            isOpsAssetsRefreshing={isOpsAssetsRefreshing}
            isSourceLoading={isSourceLoading}
            loadError={loadError}
            mutationError={mutationError}
            opsAssets={opsAssets}
            saveNotice={saveNotice}
            selectedQuarter={selectedQuarter}
            selectedSourceKeys={selectedSourceKeys}
            sourceError={sourceError}
            sourceNotice={sourceNotice}
            sourceReports={sourceReports}
            onAddFuturePlan={handleAddFuturePlan}
            onAddImplementationRow={handleAddImplementationRow}
            onApplySourceSelection={() => void handleApplySourceSelection()}
            onChangeTitle={handleChangeTitle}
            onOpenSourceModal={() => setSourceModalOpen(true)}
            onPeriodFieldChange={handlePeriodFieldChange}
            onQuarterChange={handleQuarterChange}
            onRemoveFuturePlan={handleRemoveFuturePlan}
            onRemoveImplementationRow={handleRemoveImplementationRow}
            onSelectOpsAsset={handleSelectOpsAsset}
            onUpdateFuturePlan={handleUpdateFuturePlan}
            onUpdateImplementationRow={handleUpdateImplementationRow}
            onUpdateSnapshotField={handleUpdateSnapshotField}
          />
        </MobileQuarterlySummarySection>
      </MobileShell>

      <MobileQuarterlySourceModal
        isSourceLoading={isSourceLoading}
        open={sourceModalOpen}
        selectedSourceKeys={selectedSourceKeys}
        sourceReports={sourceReports}
        onApply={() => void handleApplySourceSelection()}
        onClose={() => setSourceModalOpen(false)}
        onToggleReport={handleToggleSourceReport}
      />
      <MobileQuarterlyDocumentInfoModal
        draft={draft}
        open={documentInfoOpen}
        onChangeField={handleChangeDocumentField}
        onClose={() => setDocumentInfoOpen(false)}
      />
    </>
  );
}
