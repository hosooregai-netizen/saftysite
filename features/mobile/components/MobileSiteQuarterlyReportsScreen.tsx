'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import {
  buildMobileSiteHomeHref,
  buildSiteQuarterlyListHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from '@/features/mobile/components/MobileShell';
import { MobileTabBar } from '@/features/mobile/components/MobileTabBar';
import { MobileQuarterlyCreateDialog } from '@/features/mobile/quarterly-list/MobileQuarterlyCreateDialog';
import { MobileQuarterlyDeleteDialog } from '@/features/mobile/quarterly-list/MobileQuarterlyDeleteDialog';
import { MobileQuarterlyReportsListSection } from '@/features/mobile/quarterly-list/MobileQuarterlyReportsListSection';
import { useMobileQuarterlyListScreenState } from '@/features/mobile/quarterly-list/useMobileQuarterlyListScreenState';
import { MobileQuarterlyReportStatePanel } from '@/features/mobile/quarterly-report/MobileQuarterlyReportStatePanel';
import { buildSiteTabs } from '@/features/mobile/lib/buildSiteTabs';

interface MobileSiteQuarterlyReportsScreenProps {
  siteKey: string;
}

export function MobileSiteQuarterlyReportsScreen({
  siteKey,
}: MobileSiteQuarterlyReportsScreenProps) {
  const {
    authError,
    canArchiveReports,
    createDialog,
    currentSite,
    currentUserName,
    deleteError,
    deletingRow,
    filteredRows,
    isAuthenticated,
    isBusy,
    isDeletingReport,
    isLoading,
    isReady,
    login,
    logout,
    operationalError,
    query,
    rows,
    sortMode,
    closeDeleteDialog,
    handleDeleteSubmit,
    openDeleteDialog,
    setQuery,
    setSortMode,
  } = useMobileQuarterlyListScreenState({ siteKey });

  if (!isReady) {
    return <MobileQuarterlyReportStatePanel message="분기 보고서 목록을 준비하고 있습니다." />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        description="모바일에서 분기 종합보고서를 만들고 수정할 수 있습니다."
        error={authError}
        onSubmit={login}
        title="모바일 분기 보고 로그인"
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

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteHomeHref(currentSite.id)}
        backLabel="현장 홈"
        currentUserName={currentUserName}
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'quarterly')} />}
        title={currentSite.siteName}
        webHref={buildSiteQuarterlyListHref(currentSite.id)}
      >
        <MobileQuarterlyReportsListSection
          canArchiveReports={canArchiveReports}
          filteredRows={filteredRows}
          isBusy={isBusy}
          isLoading={isLoading}
          operationalError={operationalError}
          query={query}
          rows={rows}
          sortMode={sortMode}
          onChangeQuery={setQuery}
          onChangeSortMode={setSortMode}
          onDeleteRequest={openDeleteDialog}
          onOpenCreateDialog={createDialog.openCreateDialog}
        />
      </MobileShell>

      <MobileQuarterlyCreateDialog
        createDialogError={createDialog.createDialogError}
        createForm={createDialog.createForm}
        createQuarterSelection={createDialog.createQuarterSelection}
        isCreateDialogOpen={createDialog.isCreateDialogOpen}
        isCreateDisabled={createDialog.isCreateDisabled}
        isCreateRangeInvalid={createDialog.isCreateRangeInvalid}
        isCreatingReport={createDialog.isCreatingReport}
        onChangeField={createDialog.handleCreateFieldChange}
        onChangeQuarter={createDialog.handleCreateQuarterChange}
        onChangeTitle={createDialog.handleCreateTitleChange}
        onClose={createDialog.closeCreateDialog}
        onSubmit={() => void createDialog.handleCreateReport()}
      />
      <MobileQuarterlyDeleteDialog
        deleteError={deleteError}
        isDeletingReport={isDeletingReport}
        open={canArchiveReports && Boolean(deletingRow)}
        reportTitle={deletingRow?.reportTitle ?? null}
        onClose={closeDeleteDialog}
        onSubmit={() => void handleDeleteSubmit()}
      />
    </>
  );
}
