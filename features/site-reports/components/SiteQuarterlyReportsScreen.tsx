'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { buildSiteHubHref, buildSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { QuarterlyReportCreateDialog } from '../quarterly-list/QuarterlyReportCreateDialog';
import { QuarterlyReportDeleteDialog } from '../quarterly-list/QuarterlyReportDeleteDialog';
import { QuarterlyReportsListPanel } from '../quarterly-list/QuarterlyReportsListPanel';
import { QuarterlyReportsStatePanel } from '../quarterly-list/QuarterlyReportsStatePanel';
import { SiteQuarterlyReportsFrame } from '../quarterly-list/SiteQuarterlyReportsFrame';
import type {
  QuarterlyListDispatchFilter,
  QuarterlyListSortMode,
} from '../quarterly-list/types';
import { useQuarterlyCreateDialog } from '../quarterly-list/useQuarterlyCreateDialog';
import { useQuarterlyListRows } from '../quarterly-list/useQuarterlyListRows';

interface SiteQuarterlyReportsScreenProps {
  siteKey: string;
}

export function SiteQuarterlyReportsScreen({
  siteKey,
}: SiteQuarterlyReportsScreenProps) {
  const router = useRouter();
  const [dialogReportId, setDialogReportId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dispatchFilter, setDispatchFilter] = useState<QuarterlyListDispatchFilter>('all');
  const [sortMode, setSortMode] = useState<QuarterlyListSortMode>('number');
  const deferredQuery = useDeferredValue(query);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const {
    authError,
    canArchiveReports,
    currentUser,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();
  const currentSite = useMemo(() => sites.find((site) => site.id === decodedSiteKey) ?? null, [decodedSiteKey, sites]);
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const {
    quarterlyReports,
    isLoading,
    error,
  } = useSiteOperationalReportIndex(currentSite, isAuthenticated && isReady && Boolean(currentSite));
  const {
    deleteOperationalReport,
    isSaving,
    error: mutationError,
    saveQuarterlyReport,
  } = useSiteOperationalReportMutations(currentSite);
  const operationalError = mutationError ?? error;
  const { existingReportTitles, filteredRows, rows } = useQuarterlyListRows({
    currentSite,
    deferredQuery,
    dispatchFilter,
    quarterlyReports,
    sortMode,
  });
  const {
    createDialogError,
    createForm,
    createQuarterSelection,
    isBusy,
    isCreateDialogOpen,
    isCreateDisabled,
    isCreatingReport,
    closeCreateDialog,
    handleCreatePeriodChange,
    handleCreateQuarterChange,
    handleCreateReport,
    handleCreateTitleChange,
    openCreateDialog,
  } = useQuarterlyCreateDialog({
    currentSite,
    currentUserName: currentUser?.name,
    ensureSiteReportsLoaded,
    existingReportTitles,
    getSessionsBySiteId,
    isSaving,
    onCreated: (report) => {
      if (!currentSite) return;
      router.push(buildSiteQuarterlyHref(currentSite.id, report.id));
    },
    saveQuarterlyReport,
  });
  const deletingRow = dialogReportId ? rows.find((row) => row.reportId === dialogReportId) ?? null : null;
  const backHref = !isAdminView
    ? currentSite
      ? buildSiteHubHref(currentSite.id, 'quarterly')
      : '/'
    : currentSite
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : getAdminSectionHref('headquarters');
  const backLabel = isAdminView ? '현장 메인' : '현장 메뉴';

  if (!isReady) {
    return <QuarterlyReportsStatePanel message="분기 종합 보고서 목록을 불러오는 중입니다." />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="분기 종합 보고서 로그인"
        description="분기 종합 보고서 목록을 보려면 다시 로그인해 주세요."
      />
    );
  }

  if (!currentSite) {
    return <QuarterlyReportsStatePanel message="현장 정보를 찾을 수 없습니다." />;
  }

  return (
    <>
      <SiteQuarterlyReportsFrame
        backHref={backHref}
        backLabel={backLabel}
        currentSiteId={currentSite.id}
        currentUserName={currentUser?.name}
        isAdminView={isAdminView}
        menuOpen={menuOpen}
        onCloseMenu={() => setMenuOpen(false)}
        onLogout={logout}
        onOpenMenu={() => setMenuOpen(true)}
      >
        <QuarterlyReportsListPanel
          canArchiveReports={canArchiveReports}
          filteredRows={filteredRows}
          isBusy={isBusy}
          isLoading={isLoading}
          dispatchFilter={dispatchFilter}
          onChangeQuery={setQuery}
          onChangeDispatchFilter={setDispatchFilter}
          onChangeSortMode={setSortMode}
          onDeleteRequest={setDialogReportId}
          onOpenCreateDialog={openCreateDialog}
          onOpenReport={(href) => router.push(href)}
          operationalError={operationalError}
          query={query}
          rows={rows}
          sortMode={sortMode}
        />
      </SiteQuarterlyReportsFrame>

      <QuarterlyReportCreateDialog
        createQuarterSelection={createQuarterSelection}
        error={createDialogError}
        form={createForm}
        isBusy={isBusy}
        isCreateDisabled={isCreateDisabled}
        isCreatingReport={isCreatingReport}
        open={isCreateDialogOpen}
        onChangePeriod={handleCreatePeriodChange}
        onChangeQuarter={handleCreateQuarterChange}
        onChangeTitle={handleCreateTitleChange}
        onClose={closeCreateDialog}
        onSubmit={() => void handleCreateReport()}
      />

      <QuarterlyReportDeleteDialog
        canArchiveReports={canArchiveReports}
        isSaving={isSaving}
        open={Boolean(dialogReportId)}
        reportTitle={deletingRow?.reportTitle ?? null}
        onClose={() => setDialogReportId(null)}
        onConfirm={() => {
          if (!dialogReportId) return;
          void deleteOperationalReport(dialogReportId);
          setDialogReportId(null);
        }}
      />
    </>
  );
}
