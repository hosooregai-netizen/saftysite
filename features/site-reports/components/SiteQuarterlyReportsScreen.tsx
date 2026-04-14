'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { buildSiteHubHref, buildSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { buildToggledReportDispatch } from '@/lib/reportDispatch';
import { updateReportDispatch } from '@/lib/reportDispatchApi';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import { QuarterlyReportCreateDialog } from '../quarterly-list/QuarterlyReportCreateDialog';
import { QuarterlyReportDeleteDialog } from '../quarterly-list/QuarterlyReportDeleteDialog';
import { QuarterlyReportsListPanel } from '../quarterly-list/QuarterlyReportsListPanel';
import { QuarterlyReportsStatePanel } from '../quarterly-list/QuarterlyReportsStatePanel';
import { SiteQuarterlyReportsFrame } from '../quarterly-list/SiteQuarterlyReportsFrame';
import type {
  QuarterlyListDispatchFilter,
  QuarterlyListRow,
  QuarterlyListSortMode,
} from '../quarterly-list/types';
import { useQuarterlyCreateDialog } from '../quarterly-list/useQuarterlyCreateDialog';
import { useQuarterlyListRows } from '../quarterly-list/useQuarterlyListRows';

interface SiteQuarterlyReportsScreenProps {
  siteKey: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '발송 여부 변경에 실패했습니다.';
}

export function SiteQuarterlyReportsScreen({
  siteKey,
}: SiteQuarterlyReportsScreenProps) {
  const router = useRouter();
  const [dialogReportId, setDialogReportId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dispatchFilter, setDispatchFilter] =
    useState<QuarterlyListDispatchFilter>('all');
  const [sortMode, setSortMode] = useState<QuarterlyListSortMode>('number');
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);
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
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const {
    quarterlyReports,
    isLoading,
    error,
    reload,
  } = useSiteOperationalReportIndex(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );
  const {
    deleteOperationalReport,
    isSaving,
    error: mutationError,
    saveQuarterlyReport,
  } = useSiteOperationalReportMutations(currentSite);
  const operationalError = dispatchError ?? mutationError ?? error;
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
  const deletingRow = dialogReportId
    ? rows.find((row) => row.reportId === dialogReportId) ?? null
    : null;
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

  const handleToggleDispatch = useCallback(
    async (row: QuarterlyListRow) => {
      if (!currentUser) {
        setDispatchError('로그인 정보를 확인한 뒤 다시 시도해 주세요.');
        return;
      }

      try {
        const token = readSafetyAuthToken();
        if (!token) {
          throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
        }

        setDispatchError(null);
        setDispatchNotice(null);

        const report = await fetchSafetyReportByKey(token, row.reportId);
        const nextCompleted = !row.dispatchCompleted;
        const nextDispatch = buildToggledReportDispatch(report.dispatch, {
          currentUserId: currentUser.id,
          historyMemo: nextCompleted
            ? '현장 분기보고서 목록에서 발송으로 변경'
            : '현장 분기보고서 목록에서 미발송으로 변경',
          nextCompleted,
        });

        await updateReportDispatch(row.reportId, nextDispatch);
        await reload({ force: true });
        setDispatchNotice(
          nextCompleted
            ? '분기 보고서 발송 여부를 발송으로 변경했습니다.'
            : '분기 보고서 발송 여부를 미발송으로 변경했습니다.',
        );
      } catch (error) {
        setDispatchError(getErrorMessage(error));
      }
    },
    [currentUser, reload],
  );

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
          dispatchFilter={dispatchFilter}
          filteredRows={filteredRows}
          isBusy={isBusy}
          isLoading={isLoading}
          notice={dispatchNotice}
          onChangeDispatchFilter={setDispatchFilter}
          onChangeQuery={setQuery}
          onChangeSortMode={setSortMode}
          onDeleteRequest={setDialogReportId}
          onOpenCreateDialog={openCreateDialog}
          onOpenReport={(href) => router.push(href)}
          onToggleDispatch={handleToggleDispatch}
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
