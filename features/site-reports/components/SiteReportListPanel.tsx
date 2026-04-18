'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReportList } from '@/features/site-reports/components/ReportList';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import { getSiteReportSummary } from '@/features/site-reports/report-list/reportListHelpers';
import { SiteReportCreateDialog } from '@/features/site-reports/report-list/SiteReportCreateDialog';
import { SiteReportDeleteDialog } from '@/features/site-reports/report-list/SiteReportDeleteDialog';
import { SiteReportListToolbar } from '@/features/site-reports/report-list/SiteReportListToolbar';
import type {
  CreateSiteReportInput,
  SiteReportDispatchFilter,
  SiteReportSortMode,
} from '@/features/site-reports/report-list/types';
import { useSiteReportCreateDialog } from '@/features/site-reports/report-list/useSiteReportCreateDialog';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { updateReportDispatch } from '@/lib/reportDispatchApi';
import { buildToggledReportDispatch } from '@/lib/reportDispatch';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';
import styles from './SiteReportsScreen.module.css';

interface SiteReportListPanelProps {
  assignedUserDisplay?: string;
  canArchiveReports: boolean;
  canCreateReport: boolean;
  createReport: (input: CreateSiteReportInput) => Promise<void>;
  currentSite: InspectionSite;
  deleteSession: (sessionId: string) => Promise<void>;
  filteredReportItems: InspectionReportListItem[];
  getCreateReportTitleSuggestion: (reportDate: string) => string;
  reloadReportIndex: () => void;
  reportIndexError: string | null;
  reportIndexStatus: ReportIndexStatus;
  reportItems: InspectionReportListItem[];
  reportQueryInput: string;
  reportSortMode: SiteReportSortMode;
  dispatchFilter: SiteReportDispatchFilter;
  setDispatchFilter: (value: SiteReportDispatchFilter) => void;
  setReportQuery: (value: string) => void;
  submitReportQuery: () => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
  showSummaryBar?: boolean;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '발송 여부 변경에 실패했습니다.';
}

export function SiteReportListPanel({
  assignedUserDisplay,
  canArchiveReports,
  canCreateReport,
  createReport,
  currentSite,
  deleteSession,
  filteredReportItems,
  getCreateReportTitleSuggestion,
  reloadReportIndex,
  reportIndexError,
  reportIndexStatus,
  reportItems,
  reportQueryInput,
  reportSortMode,
  dispatchFilter,
  setDispatchFilter,
  setReportQuery,
  submitReportQuery,
  setReportSortMode,
  showSummaryBar = true,
}: SiteReportListPanelProps) {
  const { currentUser, ensureSessionLoaded, ensureSiteReportIndexLoaded } =
    useInspectionSessions();
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);
  const [dispatchOverrides, setDispatchOverrides] = useState<Record<string, boolean>>({});
  const deletingSession = dialogSessionId
    ? reportItems.find((item) => item.reportKey === dialogSessionId) ?? null
    : null;
  const { addressDisplay, amountDisplay, periodDisplay, siteNameDisplay } = useMemo(
    () => getSiteReportSummary(currentSite),
    [currentSite],
  );
  const showTableTools = reportIndexStatus === 'loaded' && reportItems.length > 0;
  const displayReportItems = useMemo(
    () =>
      reportItems.map((item) =>
        dispatchOverrides[item.reportKey] == null
          ? item
          : {
              ...item,
              dispatchCompleted: dispatchOverrides[item.reportKey],
            },
      ),
    [dispatchOverrides, reportItems],
  );
  const displayFilteredReportItems = useMemo(
    () =>
      filteredReportItems.map((item) =>
        dispatchOverrides[item.reportKey] == null
          ? item
          : {
              ...item,
              dispatchCompleted: dispatchOverrides[item.reportKey],
            },
      ),
    [dispatchOverrides, filteredReportItems],
  );
  const {
    closeCreateDialog,
    createError,
    createForm,
    handleCreateDateChange,
    handleCreateSubmit,
    handleCreateTitleChange,
    isCreateDialogOpen,
    isCreatingReport,
    openCreateDialog,
  } = useSiteReportCreateDialog({
    canCreateReport,
    createReport,
    getCreateReportTitleSuggestion,
  });

  useEffect(() => {
    setDispatchOverrides({});
  }, [currentSite.id]);

  const handleToggleDispatch = useCallback(
    async (item: InspectionReportListItem) => {
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

        const report = await fetchSafetyReportByKey(token, item.reportKey);
        const nextCompleted = !item.dispatchCompleted;
        const nextDispatch = buildToggledReportDispatch(report.dispatch, {
          currentUserId: currentUser.id,
          historyMemo: nextCompleted
            ? '현장 기술지도보고서 목록에서 발송으로 변경'
            : '현장 기술지도보고서 목록에서 미발송으로 변경',
          nextCompleted,
        });

        await updateReportDispatch(item.reportKey, nextDispatch);
        setDispatchOverrides((current) => ({
          ...current,
          [item.reportKey]: nextCompleted,
        }));
        await ensureSessionLoaded(item.reportKey, { force: true });
        void ensureSiteReportIndexLoaded(currentSite.id, { force: true });
        setDispatchNotice(
          nextCompleted
            ? '보고서 발송 여부를 발송으로 변경했습니다.'
            : '보고서 발송 여부를 미발송으로 변경했습니다.',
        );
      } catch (error) {
        setDispatchError(getErrorMessage(error));
      }
    },
    [
      currentSite.id,
      currentUser,
      ensureSessionLoaded,
      ensureSiteReportIndexLoaded,
    ],
  );

  const panelBody = (
    <>
      {dispatchError ? <div className={styles.bannerError}>{dispatchError}</div> : null}
      {dispatchNotice ? <div className={styles.bannerInfo}>{dispatchNotice}</div> : null}

      {showTableTools ? (
        <SiteReportListToolbar
          canCreateReport={canCreateReport}
          dispatchFilter={dispatchFilter}
          onCreateReport={openCreateDialog}
          onSubmitReportQuery={submitReportQuery}
          reportQuery={reportQueryInput}
          reportSortMode={reportSortMode}
          setDispatchFilter={setDispatchFilter}
          setReportQuery={setReportQuery}
          setReportSortMode={setReportSortMode}
        />
      ) : null}

      {reportIndexError ? (
        <div className={styles.tableTools}>
          <span>{reportIndexError}</span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={reloadReportIndex}
            disabled={reportIndexStatus === 'loading'}
          >
            다시 불러오기
          </button>
        </div>
      ) : null}

      <ReportList
        assignedUserDisplay={assignedUserDisplay}
        canArchiveReports={canArchiveReports}
        canCreateReport={canCreateReport}
        currentSite={currentSite}
        onCreateReport={openCreateDialog}
        onDeleteRequest={setDialogSessionId}
        onToggleDispatch={handleToggleDispatch}
        reportIndexStatus={reportIndexStatus}
        reportItems={reportIndexStatus === 'loaded' ? displayFilteredReportItems : []}
        totalReportCount={displayReportItems.length}
      />
    </>
  );

  return (
    <>
      {showSummaryBar ? (
        <SiteReportsSummaryBar
          addressDisplay={addressDisplay}
          amountDisplay={amountDisplay}
          periodDisplay={periodDisplay}
          siteNameDisplay={siteNameDisplay}
        />
      ) : null}

      <section className={styles.panel}>{panelBody}</section>

      <SiteReportCreateDialog
        createError={createError}
        createForm={createForm}
        handleCreateDateChange={handleCreateDateChange}
        handleCreateSubmit={handleCreateSubmit}
        handleCreateTitleChange={handleCreateTitleChange}
        isCreatingReport={isCreatingReport}
        open={isCreateDialogOpen}
        onClose={closeCreateDialog}
      />

      <SiteReportDeleteDialog
        canArchiveReports={canArchiveReports}
        deletingSession={deletingSession}
        open={Boolean(dialogSessionId)}
        onClose={() => setDialogSessionId(null)}
        onConfirm={() => {
          if (!dialogSessionId) return;
          void deleteSession(dialogSessionId);
          setDialogSessionId(null);
        }}
      />
    </>
  );
}
