'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { buildMobileSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { filterMobileQuarterlyRows, buildMobileQuarterlyRows } from './mobileQuarterlyListHelpers';
import { useMobileQuarterlyCreateDialog } from './useMobileQuarterlyCreateDialog';
import type { MobileQuarterlyListSortMode } from './types';

interface UseMobileQuarterlyListScreenStateOptions {
  siteKey: string;
}

export function useMobileQuarterlyListScreenState({
  siteKey,
}: UseMobileQuarterlyListScreenStateOptions) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<MobileQuarterlyListSortMode>('recent');
  const [dialogReportId, setDialogReportId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
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
  const { quarterlyReports, error, isLoading } = useSiteOperationalReportIndex(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );
  const {
    deleteOperationalReport,
    error: mutationError,
    isSaving,
    saveQuarterlyReport,
  } = useSiteOperationalReportMutations(currentSite);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) {
      return;
    }

    void ensureSiteReportsLoaded(currentSite.id).catch(() => {
      // Quarterly creation can still fall back to cached local sessions.
    });
  }, [currentSite, ensureSiteReportsLoaded, isAuthenticated, isReady]);

  const rows = useMemo(
    () => (currentSite ? buildMobileQuarterlyRows(currentSite.id, quarterlyReports) : []),
    [currentSite, quarterlyReports],
  );
  const filteredRows = useMemo(
    () => filterMobileQuarterlyRows(rows, deferredQuery, sortMode),
    [deferredQuery, rows, sortMode],
  );
  const existingReportTitles = useMemo(() => rows.map((row) => row.reportTitle), [rows]);
  const createDialog = useMobileQuarterlyCreateDialog({
    currentSite,
    currentUserName: currentUser?.name ?? null,
    ensureSiteReportsLoaded,
    existingReportTitles,
    getSessionsBySiteId,
    isSaving: isSaving || isDeletingReport,
    onCreated: (report) => {
      if (!currentSite) {
        return;
      }
      router.push(buildMobileSiteQuarterlyHref(currentSite.id, report.id));
    },
    saveQuarterlyReport,
  });
  const deletingRow = dialogReportId
    ? rows.find((row) => row.reportId === dialogReportId) ?? null
    : null;
  const operationalError = mutationError ?? error;
  const isBusy = createDialog.isBusy || isDeletingReport;

  const closeDeleteDialog = () => {
    if (isDeletingReport) {
      return;
    }
    setDialogReportId(null);
    setDeleteError(null);
  };

  const openDeleteDialog = (reportId: string) => {
    setDeleteError(null);
    setDialogReportId(reportId);
  };

  const handleDeleteSubmit = async () => {
    if (!dialogReportId) {
      return;
    }

    setDeleteError(null);
    setIsDeletingReport(true);

    try {
      await deleteOperationalReport(dialogReportId);
      closeDeleteDialog();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : '분기 보고서를 삭제하지 못했습니다.',
      );
    } finally {
      setIsDeletingReport(false);
    }
  };

  return {
    authError,
    canArchiveReports,
    createDialog,
    currentSite,
    currentUserName: currentUser?.name ?? null,
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
  };
}
