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

function parseYearPrefix(value: string) {
  const matched = value.trim().match(/^(\d{4})/);
  if (!matched) return null;
  const year = Number.parseInt(matched[1], 10);
  return Number.isInteger(year) ? year : null;
}

function pickRowsForCurrentYear<T>(
  rows: T[],
  currentYear: number,
  resolveYear: (row: T) => number | null,
  fallbackSort?: (left: T, right: T) => number,
) {
  const currentYearRows = rows.filter((row) => resolveYear(row) === currentYear);
  if (currentYearRows.length > 0) {
    return currentYearRows;
  }
  if (rows.length <= 1) {
    return rows;
  }
  const fallbackRows = fallbackSort ? [...rows].sort(fallbackSort) : rows;
  return fallbackRows.slice(0, 1);
}

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
  const [priorityPage, setPriorityPage] = useState(1);
  const [endingSoonPage, setEndingSoonPage] = useState(1);
  const currentYear = new Date().getFullYear();

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
      unsentReportRows:
        overviewResponse.unsentReportRows.length > 0 || fallbackOverview.unsentReportRows.length === 0
          ? overviewResponse.unsentReportRows
          : fallbackOverview.unsentReportRows,
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
      (overview.priorityQuarterlyManagementRows ?? []).length > 0 ||
      (fallbackOverview.priorityQuarterlyManagementRows ?? []).length === 0
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

  const visibleMaterialRows = useMemo(() => {
    return pickRowsForCurrentYear(
      overview.quarterlyMaterialSummary.missingSiteRows,
      currentYear,
      (row) => parseYearPrefix(row.quarterKey || row.quarterLabel),
      (left, right) =>
        (right.quarterKey || right.quarterLabel).localeCompare(
          left.quarterKey || left.quarterLabel,
          'ko',
        ) || left.siteName.localeCompare(right.siteName, 'ko'),
    );
  }, [currentYear, overview.quarterlyMaterialSummary.missingSiteRows]);

  const visibleMaterialQuarterLabel = useMemo(() => {
    return visibleMaterialRows[0]?.quarterLabel || overview.quarterlyMaterialSummary.quarterLabel;
  }, [overview.quarterlyMaterialSummary.quarterLabel, visibleMaterialRows]);

  const visibleUnsentReportRows = useMemo(() => {
    return pickRowsForCurrentYear(
      normalizedUnsentReportRows,
      currentYear,
      (row) => parseYearPrefix(row.visitDate || row.referenceDate || row.deadlineDate),
      (left, right) =>
        (right.visitDate || right.referenceDate || right.deadlineDate).localeCompare(
          left.visitDate || left.referenceDate || left.deadlineDate,
          'ko',
        ) || left.siteName.localeCompare(right.siteName, 'ko'),
    );
  }, [currentYear, normalizedUnsentReportRows]);

  const sortedMaterialRows = useMemo(() => {
    return [...visibleMaterialRows].sort((left, right) => {
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
  }, [materialSort.direction, materialSort.key, visibleMaterialRows]);

  const sortedUnsentReportRows = useMemo(() => {
    return [...visibleUnsentReportRows].sort((left, right) => {
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
  }, [unsentSort.direction, unsentSort.key, visibleUnsentReportRows]);

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

  const priorityTotalPages = Math.max(
    1,
    Math.ceil(normalizedPriorityQuarterlyManagementRows.length / OVERVIEW_TABLE_PAGE_SIZE),
  );
  const currentPriorityPage = clampPage(priorityPage, priorityTotalPages);
  const pagedPriorityQuarterlyManagementRows = useMemo(() => {
    const offset = (currentPriorityPage - 1) * OVERVIEW_TABLE_PAGE_SIZE;
    return normalizedPriorityQuarterlyManagementRows.slice(offset, offset + OVERVIEW_TABLE_PAGE_SIZE);
  }, [currentPriorityPage, normalizedPriorityQuarterlyManagementRows]);

  const endingSoonTotalPages = Math.max(1, Math.ceil(overview.endingSoonRows.length / OVERVIEW_TABLE_PAGE_SIZE));
  const currentEndingSoonPage = clampPage(endingSoonPage, endingSoonTotalPages);
  const pagedEndingSoonRows = useMemo(() => {
    const offset = (currentEndingSoonPage - 1) * OVERVIEW_TABLE_PAGE_SIZE;
    return overview.endingSoonRows.slice(offset, offset + OVERVIEW_TABLE_PAGE_SIZE);
  }, [currentEndingSoonPage, overview.endingSoonRows]);

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
    currentEndingSoonPage,
    currentMaterialPage,
    currentPriorityPage,
    currentUnsentPage,
    endingSoonTotalPages,
    error,
    exportOverview,
    isRefreshing,
    pagedEndingSoonRows,
    pagedPriorityQuarterlyManagementRows,
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
    priorityTotalPages,
    refreshOverview,
    updateSiteDispatchPolicy,
    setEndingSoonPage,
    setMaterialPage,
    setMaterialSort,
    setPriorityPage,
    setUnsentPage,
    setUnsentSort,
    sortedMaterialRows,
    sortedUnsentReportRows,
    unsentTotalPages,
    materialSort,
    visibleMaterialQuarterLabel,
    unsentSort,
  };
}
