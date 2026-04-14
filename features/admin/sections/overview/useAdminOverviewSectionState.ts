'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getOverviewExportSheets,
  type AdminOverviewModel,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { readAdminSessionCache, writeAdminSessionCache } from '@/features/admin/lib/adminSessionCache';
import { fetchAdminOverview } from '@/lib/admin/apiClient';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import type { SafetyAdminOverviewResponse, TableSortState } from '@/types/admin';
import {
  clampPage,
  compareNumber,
  compareText,
  OVERVIEW_TABLE_PAGE_SIZE,
} from './overviewSectionHelpers';

export function useAdminOverviewSectionState(
  currentUserId: string,
) {
  const emptyOverview = useMemo(
    () =>
      ({
        alerts: [],
        completionRows: [],
        coverageRows: [],
        deadlineRows: [],
        deadlineSignalSummary: { entries: [], totalReportCount: 0 },
        dispatchQueueRows: [],
        metricCards: [],
        overdueSiteRows: [],
        pendingReviewRows: [],
        priorityTargetSiteRows: [],
        quarterlyMaterialSummary: {
          entries: [],
          missingSiteRows: [],
          quarterKey: '',
          quarterLabel: '',
          totalSiteCount: 0,
        },
        recipientMissingSiteRows: [],
        scheduleRows: [],
        siteStatusSummary: { entries: [], totalSiteCount: 0 },
        summaryRows: [],
        unsentReportRows: [],
        workerLoadRows: [],
      } satisfies SafetyAdminOverviewResponse),
    [],
  );
  const [overviewResponse, setOverviewResponse] = useState<SafetyAdminOverviewResponse | null>(() => {
    return readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, 'overview').value;
  });
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const cached = readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, 'overview');
    return cached.value ? new Date() : null;
  });
  const [materialSort, setMaterialSort] = useState<TableSortState>({ direction: 'desc', key: 'missingTotal' });
  const [materialPage, setMaterialPage] = useState(1);
  const [unsentSort, setUnsentSort] = useState<TableSortState>({ direction: 'desc', key: 'unsentDays' });
  const [unsentPage, setUnsentPage] = useState(1);

  const refreshOverview = useCallback(async (options?: { force?: boolean }) => {
    const cached = !options?.force
      ? readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, 'overview')
      : { isFresh: false, value: null };
    if (cached.value) {
      setOverviewResponse(cached.value);
      setLastSyncedAt(new Date());
      if (cached.isFresh) {
        return;
      }
    }

    try {
      setIsRefreshing(true);
      setError(null);
      const nextOverview = await fetchAdminOverview();
      setOverviewResponse(nextOverview);
      setLastSyncedAt(new Date());
      writeAdminSessionCache(currentUserId, 'overview', nextOverview);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '관제 대시보드를 불러오지 못했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  const overview = overviewResponse ?? emptyOverview;
  const isInitialLoading = !overviewResponse && isRefreshing;

  const normalizedUnsentReportRows = useMemo(() => {
    return overview.unsentReportRows
      .map((row) => ({ ...row, assigneeName: row.assigneeName || '-' }))
      .filter((row) => Boolean(row.reportKey));
  }, [overview.unsentReportRows]);

  const sortedMaterialRows = useMemo(() => {
    return [...overview.quarterlyMaterialSummary.missingSiteRows].sort((left, right) => {
      const leftMissingTotal = left.education.missingCount + left.measurement.missingCount;
      const rightMissingTotal = right.education.missingCount + right.measurement.missingCount;
      switch (materialSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, materialSort.direction);
        case 'headquarterName':
          return compareText(left.headquarterName, right.headquarterName, materialSort.direction);
        case 'educationMissing':
          return compareNumber(left.education.missingCount, right.education.missingCount, materialSort.direction);
        case 'measurementMissing':
          return compareNumber(left.measurement.missingCount, right.measurement.missingCount, materialSort.direction);
        case 'missingTotal':
        default:
          return compareNumber(leftMissingTotal, rightMissingTotal, materialSort.direction);
      }
    });
  }, [materialSort.direction, materialSort.key, overview.quarterlyMaterialSummary.missingSiteRows]);

  const sortedUnsentReportRows = useMemo(() => {
    return [...normalizedUnsentReportRows].sort((left, right) => {
      switch (unsentSort.key) {
        case 'siteName':
          return compareText(left.siteName, right.siteName, unsentSort.direction);
        case 'headquarterName':
          return compareText(left.headquarterName, right.headquarterName, unsentSort.direction);
        case 'reportTitle':
          return compareText(left.reportTitle, right.reportTitle, unsentSort.direction);
        case 'assigneeName':
          return compareText(left.assigneeName, right.assigneeName, unsentSort.direction);
        case 'visitDate':
          return compareText(left.visitDate, right.visitDate, unsentSort.direction);
        case 'unsentDays':
        default:
          return compareNumber(left.unsentDays, right.unsentDays, unsentSort.direction);
      }
    });
  }, [normalizedUnsentReportRows, unsentSort.direction, unsentSort.key]);

  useEffect(() => {
    setMaterialPage(1);
  }, [materialSort.direction, materialSort.key]);
  useEffect(() => {
    setUnsentPage(1);
  }, [unsentSort.direction, unsentSort.key]);

  const materialTotalPages = Math.max(1, Math.ceil(sortedMaterialRows.length / OVERVIEW_TABLE_PAGE_SIZE));
  const currentMaterialPage = clampPage(materialPage, materialTotalPages);
  const pagedMaterialRows = useMemo(() => {
    const offset = (currentMaterialPage - 1) * OVERVIEW_TABLE_PAGE_SIZE;
    return sortedMaterialRows.slice(offset, offset + OVERVIEW_TABLE_PAGE_SIZE);
  }, [currentMaterialPage, sortedMaterialRows]);

  const unsentTotalPages = Math.max(1, Math.ceil(sortedUnsentReportRows.length / OVERVIEW_TABLE_PAGE_SIZE));
  const currentUnsentPage = clampPage(unsentPage, unsentTotalPages);
  const pagedUnsentReportRows = useMemo(() => {
    const offset = (currentUnsentPage - 1) * OVERVIEW_TABLE_PAGE_SIZE;
    return sortedUnsentReportRows.slice(offset, offset + OVERVIEW_TABLE_PAGE_SIZE);
  }, [currentUnsentPage, sortedUnsentReportRows]);

  const exportOverview = useCallback(async () => {
    const exportModel: AdminOverviewModel = {
      coverageRows: overview.coverageRows,
      deadlineSignalSummary: overview.deadlineSignalSummary,
      deadlineRows: overview.deadlineRows,
      metricCards: overview.metricCards,
      overdueSiteRows: overview.overdueSiteRows,
      pendingReviewRows: overview.pendingReviewRows,
      quarterlyMaterialSummary: {
        ...overview.quarterlyMaterialSummary,
        missingSiteRows: sortedMaterialRows,
      },
      siteStatusSummary: overview.siteStatusSummary,
      summaryRows: overview.summaryRows,
      unsentReportRows: sortedUnsentReportRows,
      workerLoadRows: overview.workerLoadRows,
    };
    await exportAdminWorkbook('overview', getOverviewExportSheets(exportModel));
  }, [overview, sortedMaterialRows, sortedUnsentReportRows]);

  return {
    currentMaterialPage,
    currentUnsentPage,
    error,
    exportOverview,
    isRefreshing,
    isInitialLoading,
    lastSyncedAt,
    materialTotalPages,
    overview,
    pagedMaterialRows,
    pagedUnsentReportRows,
    refreshOverview,
    setMaterialPage,
    setMaterialSort,
    setUnsentPage,
    setUnsentSort,
    sortedMaterialRows,
    sortedUnsentReportRows,
    unsentTotalPages,
    materialSort,
    unsentSort,
  };
}
