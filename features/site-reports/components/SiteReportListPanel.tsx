'use client';

import { useMemo, useState } from 'react';
import { ReportList } from '@/features/site-reports/components/ReportList';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import { getSiteReportSummary } from '@/features/site-reports/report-list/reportListHelpers';
import { SiteReportCreateDialog } from '@/features/site-reports/report-list/SiteReportCreateDialog';
import { SiteReportDeleteDialog } from '@/features/site-reports/report-list/SiteReportDeleteDialog';
import { SiteReportListToolbar } from '@/features/site-reports/report-list/SiteReportListToolbar';
import type { CreateSiteReportInput, SiteReportSortMode } from '@/features/site-reports/report-list/types';
import { useSiteReportCreateDialog } from '@/features/site-reports/report-list/useSiteReportCreateDialog';
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
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
  setReportQuery: (value: string) => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
  showSummaryBar?: boolean;
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
  reportQuery,
  reportSortMode,
  setReportQuery,
  setReportSortMode,
  showSummaryBar = true,
}: SiteReportListPanelProps) {
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const deletingSession = dialogSessionId
    ? reportItems.find((item) => item.reportKey === dialogSessionId) ?? null
    : null;
  const { addressDisplay, amountDisplay, periodDisplay, siteNameDisplay } =
    useMemo(() => getSiteReportSummary(currentSite), [currentSite]);
  const showTableTools = reportIndexStatus === 'loaded' && reportItems.length > 0;
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

  const panelBody = (
    <>
      {showTableTools ? (
        <SiteReportListToolbar
          canCreateReport={canCreateReport}
          onCreateReport={openCreateDialog}
          reportQuery={reportQuery}
          reportSortMode={reportSortMode}
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
        reportIndexStatus={reportIndexStatus}
        reportItems={reportIndexStatus === 'loaded' ? filteredReportItems : []}
        totalReportCount={reportItems.length}
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
