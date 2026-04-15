'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildAdminOverviewModel,
  getOverviewExportSheets,
  type AdminOverviewModel,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import {
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { fetchAdminOverview } from '@/lib/admin/apiClient';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import type { SafetyAdminOverviewResponse, TableSortState } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import {
  clampPage,
  compareNumber,
  compareText,
  hasDeadlineSignalSummary,
  hasEndingSoonSummary,
  hasQuarterlyMaterialSummary,
  hasSiteStatusSummary,
  OVERVIEW_TABLE_PAGE_SIZE,
} from './overviewSectionHelpers';

export function useAdminOverviewSectionState(
  currentUserId: string,
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  options?: {
    onUpdateSiteDispatchPolicy?: (
      siteId: string,
      input: { enabled: boolean; alerts_enabled: boolean },
    ) => Promise<unknown>;
  },
) {
  const fallbackOverview = useMemo(
    () =>
      ({
        ...buildAdminOverviewModel(data, reports),
        alerts: [],
        completionRows: [],
        dispatchQueueRows: [],
        priorityTargetSiteRows: [],
        recipientMissingSiteRows: [],
        scheduleRows: [],
      } satisfies SafetyAdminOverviewResponse),
    [data, reports],
  );
  const [overviewResponse, setOverviewResponse] = useState<SafetyAdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [policyUpdatingSiteId, setPolicyUpdatingSiteId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [materialSort, setMaterialSort] = useState<TableSortState>({ direction: 'desc', key: 'missingTotal' });
  const [materialPage, setMaterialPage] = useState(1);
  const [unsentSort, setUnsentSort] = useState<TableSortState>({ direction: 'desc', key: 'unsentDays' });
  const [unsentPage, setUnsentPage] = useState(1);

  const refreshOverview = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const cached = readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, 'overview');
      if (cached.value) {
        setOverviewResponse(cached.value);
      }
      const nextOverview = await fetchAdminOverview();
      writeAdminSessionCache(currentUserId, 'overview', nextOverview);
      setOverviewResponse(nextOverview);
      setLastSyncedAt(new Date());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '관제 대시보드를 불러오지 못했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const cached = readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, 'overview');
    if (cached.value) {
      setOverviewResponse(cached.value);
      setLastSyncedAt(new Date());
      if (cached.isFresh) {
        return;
      }
    }
    void refreshOverview();
  }, [currentUserId, refreshOverview]);

  const overview = useMemo(() => {
    if (!overviewResponse) return fallbackOverview;
    return {
      ...overviewResponse,
      deadlineSignalSummary: hasDeadlineSignalSummary(overviewResponse.deadlineSignalSummary)
        ? overviewResponse.deadlineSignalSummary
        : fallbackOverview.deadlineSignalSummary,
      endingSoonRows:
        Array.isArray(overviewResponse.endingSoonRows) && overviewResponse.endingSoonRows.length > 0
          ? overviewResponse.endingSoonRows
          : fallbackOverview.endingSoonRows,
      endingSoonSummary: overviewResponse.endingSoonSummary && hasEndingSoonSummary(overviewResponse.endingSoonSummary)
        ? overviewResponse.endingSoonSummary
        : fallbackOverview.endingSoonSummary,
      quarterlyMaterialSummary: hasQuarterlyMaterialSummary(overviewResponse.quarterlyMaterialSummary)
        ? {
            ...overviewResponse.quarterlyMaterialSummary,
            quarterKey:
              overviewResponse.quarterlyMaterialSummary.quarterKey ||
              fallbackOverview.quarterlyMaterialSummary.quarterKey,
            quarterLabel:
              overviewResponse.quarterlyMaterialSummary.quarterLabel ||
              fallbackOverview.quarterlyMaterialSummary.quarterLabel,
          }
        : fallbackOverview.quarterlyMaterialSummary,
      siteStatusSummary: hasSiteStatusSummary(overviewResponse.siteStatusSummary)
        ? overviewResponse.siteStatusSummary
        : fallbackOverview.siteStatusSummary,
      unsentReportRows: overviewResponse.unsentReportRows,
    } satisfies SafetyAdminOverviewResponse;
  }, [fallbackOverview, overviewResponse]);

  const normalizedUnsentReportRows = useMemo(() => {
    const fallbackRowsByKey = new Map(fallbackOverview.unsentReportRows.map((row) => [row.reportKey, row]));
    return overview.unsentReportRows
      .map((row) => {
        const fallbackRow = fallbackRowsByKey.get(row.reportKey);
        const siteId = row.siteId || fallbackRow?.siteId || '';
        return {
          ...fallbackRow,
          ...row,
          assigneeName: row.assigneeName || fallbackRow?.assigneeName || '-',
          href: fallbackRow?.href || (siteId ? buildSiteReportsHref(siteId) : row.href),
        };
      })
      .filter((row) => Boolean(row.reportKey));
  }, [fallbackOverview.unsentReportRows, overview.unsentReportRows]);

  const normalizedPriorityQuarterlyManagementRows = useMemo(() => {
    const sourceRows =
      overviewResponse
        ? overview.priorityQuarterlyManagementRows ?? []
        : fallbackOverview.priorityQuarterlyManagementRows ?? [];
    const fallbackRowsByKey = new Map(
      (fallbackOverview.priorityQuarterlyManagementRows ?? []).map((row) => [
        `${row.siteId}:${row.currentQuarterKey}`,
        row,
      ]),
    );

    return sourceRows.map((row) => {
      const fallbackRow = fallbackRowsByKey.get(`${row.siteId}:${row.currentQuarterKey}`);
      const siteId = row.siteId || fallbackRow?.siteId || '';
      return {
        ...fallbackRow,
        ...row,
        href: siteId ? buildSiteQuarterlyListHref(siteId) : fallbackRow?.href || row.href,
        quarterlyReportHref: fallbackRow?.quarterlyReportHref || row.quarterlyReportHref,
        quarterlyReportKey: fallbackRow?.quarterlyReportKey || row.quarterlyReportKey,
      };
    });
  }, [
    fallbackOverview.priorityQuarterlyManagementRows,
    overview.priorityQuarterlyManagementRows,
    overviewResponse,
  ]);

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
      endingSoonRows: overview.endingSoonRows,
      endingSoonSummary: overview.endingSoonSummary,
      metricCards: overview.metricCards,
      overdueSiteRows: overview.overdueSiteRows,
      pendingReviewRows: overview.pendingReviewRows,
      priorityQuarterlyManagementRows: normalizedPriorityQuarterlyManagementRows,
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
  }, [normalizedPriorityQuarterlyManagementRows, overview, sortedMaterialRows, sortedUnsentReportRows]);

  const updateSiteDispatchPolicy = useCallback(
    async (siteId: string, input: { enabled: boolean; alerts_enabled: boolean }) => {
      if (!options?.onUpdateSiteDispatchPolicy) return;
      try {
        setPolicyUpdatingSiteId(siteId);
        setError(null);
        await options.onUpdateSiteDispatchPolicy(siteId, input);
        await refreshOverview();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '발송 관리 정책을 업데이트하지 못했습니다.');
      } finally {
        setPolicyUpdatingSiteId(null);
      }
    },
    [options, refreshOverview],
  );

  return {
    currentMaterialPage,
    currentUnsentPage,
    error,
    exportOverview,
    isRefreshing,
    policyUpdatingSiteId,
    lastSyncedAt,
    materialTotalPages,
    overview: {
      ...overview,
      priorityQuarterlyManagementRows: normalizedPriorityQuarterlyManagementRows,
      unsentReportRows: normalizedUnsentReportRows,
    },
    pagedMaterialRows,
    pagedUnsentReportRows,
    refreshOverview,
    updateSiteDispatchPolicy,
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
