'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { buildMobileSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { canArchiveReportsForSite } from '@/lib/reportArchivePermissions';
import {
  readEnumParam,
  readStringParam,
  useUrlQueryUpdater,
} from '@/hooks/useUrlQueryState';
import { filterMobileQuarterlyRows, buildMobileQuarterlyRows } from './mobileQuarterlyListHelpers';
import { useMobileQuarterlyCreateDialog } from './useMobileQuarterlyCreateDialog';
import type { MobileQuarterlyListSortMode } from './types';

interface UseMobileQuarterlyListScreenStateOptions {
  siteKey: string;
}

const MOBILE_QUARTERLY_LIST_QUERY_DEFAULTS = {
  quarterlyQuery: '',
  quarterlySort: 'recent',
};

export function useMobileQuarterlyListScreenState({
  siteKey,
}: UseMobileQuarterlyListScreenStateOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateUrlQuery = useUrlQueryUpdater();
  const urlQuery = readStringParam(searchParams, 'quarterlyQuery');
  const urlSortMode = readEnumParam(
    searchParams,
    'quarterlySort',
    ['recent', 'name', 'period'] as const,
    'recent',
  );
  const [query, setQueryState] = useState(urlQuery);
  const [sortMode, setSortModeState] = useState<MobileQuarterlyListSortMode>(urlSortMode);
  const [dialogReportId, setDialogReportId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const {
    authError,
    canArchiveReports: canArchiveReportsForAccount,
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
  const canArchiveReports =
    canArchiveReportsForAccount ||
    canArchiveReportsForSite({ currentSite, currentUser });
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
    setQueryState(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSortModeState(urlSortMode);
  }, [urlSortMode]);

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
    setQuery: (value: string) => {
      setQueryState(value);
      updateUrlQuery({ quarterlyQuery: value }, MOBILE_QUARTERLY_LIST_QUERY_DEFAULTS);
    },
    setSortMode: (value: MobileQuarterlyListSortMode) => {
      setSortModeState(value);
      updateUrlQuery({ quarterlySort: value }, MOBILE_QUARTERLY_LIST_QUERY_DEFAULTS);
    },
  };
}
