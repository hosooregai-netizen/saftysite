'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import { buildMobileSiteHomeHref } from '@/features/home/lib/siteEntry';
import { MobileQuarterlyReportStatePanel } from '@/features/mobile/quarterly-report/MobileQuarterlyReportStatePanel';
import { MobileReportCreateDialog } from '@/features/mobile/report-list/MobileReportCreateDialog';
import { MobileReportDeleteDialog } from '@/features/mobile/report-list/MobileReportDeleteDialog';
import { MobileReportsListSection } from '@/features/mobile/report-list/MobileReportsListSection';
import { useMobileSiteReportsScreenState } from '@/features/mobile/report-list/useMobileSiteReportsScreenState';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';

interface MobileSiteReportsScreenProps {
  siteKey: string;
}

export function MobileSiteReportsScreen({ siteKey }: MobileSiteReportsScreenProps) {
  const {
    authError,
    canArchiveReports,
    canCreateReport,
    createError,
    createForm,
    currentSite,
    currentUserName,
    deleteError,
    deletingSession,
    isAuthenticated,
    isCreateDialogOpen,
    isCreatingReport,
    isDeletingReport,
    isLoading,
    isReady,
    login,
    logout,
    reportCards,
    reportCount,
    reportIndexError,
    reportQuery,
    reportSortMode,
    closeCreateDialog,
    closeDeleteDialog,
    handleCreateDateChange,
    handleCreateSubmit,
    handleCreateTitleChange,
    handleDeleteSubmit,
    openCreateDialog,
    reloadReportIndex,
    setDialogSessionId,
    setReportQuery,
    setReportSortMode,
  } = useMobileSiteReportsScreenState(siteKey);

  if (!isReady) {
    return <MobileQuarterlyReportStatePanel message="보고서 목록을 준비하는 중입니다." />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 보고서 로그인"
        description="현장별 기술지도 보고서를 추가하고 핵심 섹션 중심으로 바로 작성합니다."
      />
    );
  }

  if (!currentSite) {
    return (
      <MobileQuarterlyReportStatePanel
        message="현장을 찾을 수 없습니다."
        actionHref="/mobile"
        actionLabel="현장 목록으로 돌아가기"
      />
    );
  }

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteHomeHref(currentSite.id)}
        backLabel="현장 홈"
        currentUserName={currentUserName}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'reports')} />}
        onLogout={logout}
        title={currentSite.siteName}
        webHref={`/sites/${encodeURIComponent(currentSite.id)}`}
      >
        <MobileReportsListSection
          canArchiveReports={canArchiveReports}
          canCreateReport={canCreateReport}
          cards={reportCards}
          isLoading={isLoading}
          query={reportQuery}
          reportIndexError={reportIndexError}
          reportCount={reportCount}
          sortMode={reportSortMode}
          onChangeQuery={setReportQuery}
          onChangeSortMode={setReportSortMode}
          onDeleteRequest={setDialogSessionId}
          onOpenCreateDialog={openCreateDialog}
          onReload={reloadReportIndex}
        />
      </MobileShell>

      <MobileReportCreateDialog
        createError={createError}
        createForm={createForm}
        isCreatingReport={isCreatingReport}
        open={isCreateDialogOpen}
        onChangeDate={handleCreateDateChange}
        onChangeTitle={handleCreateTitleChange}
        onClose={closeCreateDialog}
        onSubmit={() => void handleCreateSubmit()}
      />
      <MobileReportDeleteDialog
        deleteError={deleteError}
        isDeletingReport={isDeletingReport}
        open={canArchiveReports && Boolean(deletingSession)}
        reportTitle={deletingSession?.reportTitle ?? null}
        onClose={closeDeleteDialog}
        onSubmit={() => void handleDeleteSubmit()}
      />
    </>
  );
}
