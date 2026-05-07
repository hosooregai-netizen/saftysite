'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildAdminOverviewModel,
  getOverviewExportSheets,
  type AdminOverviewModel,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { compareDispatchManagementUnsentRows } from '@/features/admin/lib/control-center-model/overviewPolicies';
import {
  fetchAdminSessionCacheOnce,
  getAdminSessionCacheGeneration,
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

const OVERVIEW_CACHE_KEY = 'overview';
const PRIORITY_QUARTERLY_EXCEPTION_ORDER: Record<
  NonNullable<SafetyAdminOverviewResponse['priorityQuarterlyManagementRows']>[number]['exceptionStatus'],
  number
> = {
  reflection_missing: 0,
  dispatch_overdue: 1,
  dispatch_pending: 2,
  ok: 3,
};

function normalizeKeyPart(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getPriorityQuarterlyManagementRowKey(
  row: NonNullable<SafetyAdminOverviewResponse['priorityQuarterlyManagementRows']>[number],
) {
  const siteId = normalizeKeyPart(row.siteId);
  const quarterKey = normalizeKeyPart(row.currentQuarterKey);
  return siteId && quarterKey ? `${siteId}:${quarterKey}` : '';
}

function comparePriorityQuarterlyManagementRows(
  left: NonNullable<SafetyAdminOverviewResponse['priorityQuarterlyManagementRows']>[number],
  right: NonNullable<SafetyAdminOverviewResponse['priorityQuarterlyManagementRows']>[number],
) {
  return (
    (PRIORITY_QUARTERLY_EXCEPTION_ORDER[left.exceptionStatus] ?? 99) -
      (PRIORITY_QUARTERLY_EXCEPTION_ORDER[right.exceptionStatus] ?? 99) ||
    (right.projectAmount ?? 0) - (left.projectAmount ?? 0) ||
    left.siteName.localeCompare(right.siteName, 'ko')
  );
}

function mergePriorityQuarterlyManagementRows(
  responseRows: SafetyAdminOverviewResponse['priorityQuarterlyManagementRows'] | undefined,
  fallbackRows: SafetyAdminOverviewResponse['priorityQuarterlyManagementRows'] | undefined,
): SafetyAdminOverviewResponse['priorityQuarterlyManagementRows'] {
  const upstreamRows = responseRows ?? [];
  const localRows = fallbackRows ?? [];
  if (upstreamRows.length === 0) {
    return localRows;
  }

  const upstreamQuarterKeys = new Set(
    upstreamRows
      .map((row) => normalizeKeyPart(row.currentQuarterKey))
      .filter(Boolean),
  );
  const mergedRows: NonNullable<SafetyAdminOverviewResponse['priorityQuarterlyManagementRows']> = [];
  const seenKeys = new Set<string>();

  upstreamRows.forEach((row) => {
    const rowKey = getPriorityQuarterlyManagementRowKey(row);
    if (rowKey) {
      if (seenKeys.has(rowKey)) return;
      seenKeys.add(rowKey);
    }
    mergedRows.push(row);
  });

  localRows.forEach((row) => {
    const quarterKey = normalizeKeyPart(row.currentQuarterKey);
    if (upstreamQuarterKeys.size > 0 && !upstreamQuarterKeys.has(quarterKey)) return;
    const rowKey = getPriorityQuarterlyManagementRowKey(row);
    if (rowKey && seenKeys.has(rowKey)) return;
    if (rowKey) seenKeys.add(rowKey);
    mergedRows.push(row);
  });

  return mergedRows.sort(comparePriorityQuarterlyManagementRows);
}

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
  resolveFallbackGroup?: (row: T) => string,
) {
  const currentYearRows = rows.filter((row) => resolveYear(row) === currentYear);
  if (currentYearRows.length > 0) {
    return currentYearRows;
  }
  if (rows.length <= 1) {
    return rows;
  }
  const fallbackRows = fallbackSort ? [...rows].sort(fallbackSort) : [...rows];
  const fallbackHead = fallbackRows[0];
  if (!fallbackHead) {
    return [];
  }

  const fallbackGroup = resolveFallbackGroup?.(fallbackHead) || '';
  if (fallbackGroup) {
    return fallbackRows.filter((row) => resolveFallbackGroup?.(row) === fallbackGroup);
  }

  const fallbackYear = resolveYear(fallbackHead);
  if (fallbackYear == null) {
    return fallbackRows;
  }

  return fallbackRows.filter((row) => resolveYear(row) === fallbackYear);
}

function countMaterialMissingEntries(
  summary: SafetyAdminOverviewResponse['quarterlyMaterialSummary'],
) {
  return summary.entries.reduce((total, entry) => {
    if (entry.key === 'education_missing' || entry.key === 'measurement_missing' || entry.key === 'both_missing') {
      return total + entry.count;
    }
    return total;
  }, 0);
}

function shouldUseFallbackMaterialRows(
  responseSummary: SafetyAdminOverviewResponse['quarterlyMaterialSummary'],
  fallbackSummary: SafetyAdminOverviewResponse['quarterlyMaterialSummary'],
) {
  const responseRows = responseSummary.missingSiteRows;
  const fallbackRows = fallbackSummary.missingSiteRows;
  const expectedMissingRows = countMaterialMissingEntries(responseSummary);
  const fallbackMissingRows = countMaterialMissingEntries(fallbackSummary);
  const hasStaleSummaryScope =
    fallbackSummary.totalSiteCount > 0 &&
    responseSummary.totalSiteCount !== fallbackSummary.totalSiteCount &&
    responseRows.length === fallbackRows.length &&
    expectedMissingRows === fallbackMissingRows;

  return (
    (fallbackRows.length > responseRows.length &&
      (responseRows.length === 0 || expectedMissingRows > responseRows.length)) ||
    hasStaleSummaryScope
  );
}

function shouldUseFallbackEndingSoonRows(
  responseRows: SafetyAdminOverviewResponse['endingSoonRows'],
  responseSummary: SafetyAdminOverviewResponse['endingSoonSummary'],
  fallbackRows: SafetyAdminOverviewResponse['endingSoonRows'],
) {
  return (
    fallbackRows.length > responseRows.length &&
    (responseRows.length === 0 || responseSummary.totalSiteCount > responseRows.length)
  );
}

export function mergeOverviewResponseWithFallback(
  overviewResponse: SafetyAdminOverviewResponse | null,
  fallbackOverview: SafetyAdminOverviewResponse,
) {
  if (!overviewResponse) return fallbackOverview;

  const responseEndingSoonRows = Array.isArray(overviewResponse.endingSoonRows)
    ? overviewResponse.endingSoonRows
    : [];
  const responseEndingSoonSummary =
    overviewResponse.endingSoonSummary && hasEndingSoonSummary(overviewResponse.endingSoonSummary)
      ? overviewResponse.endingSoonSummary
      : fallbackOverview.endingSoonSummary;
  const useFallbackEndingSoonRows = shouldUseFallbackEndingSoonRows(
    responseEndingSoonRows,
    responseEndingSoonSummary,
    fallbackOverview.endingSoonRows,
  );
  const useFallbackMaterialRows = shouldUseFallbackMaterialRows(
    overviewResponse.quarterlyMaterialSummary,
    fallbackOverview.quarterlyMaterialSummary,
  );

  return {
    ...overviewResponse,
    alertsTotalCount:
      overviewResponse.alertsTotalCount ?? Math.max(overviewResponse.alerts.length, fallbackOverview.alertsTotalCount),
    completionRowsTotalCount:
      overviewResponse.completionRowsTotalCount ??
      Math.max(overviewResponse.completionRows.length, fallbackOverview.completionRowsTotalCount),
    deadlineSignalSummary: hasDeadlineSignalSummary(overviewResponse.deadlineSignalSummary)
      ? overviewResponse.deadlineSignalSummary
      : fallbackOverview.deadlineSignalSummary,
    endingSoonRows: useFallbackEndingSoonRows
      ? fallbackOverview.endingSoonRows
      : responseEndingSoonRows,
    endingSoonSummary: useFallbackEndingSoonRows
      ? fallbackOverview.endingSoonSummary
      : responseEndingSoonSummary,
    quarterlyMaterialSummary: hasQuarterlyMaterialSummary(overviewResponse.quarterlyMaterialSummary)
      ? useFallbackMaterialRows
        ? fallbackOverview.quarterlyMaterialSummary
        : {
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
    priorityQuarterlyManagementRows: mergePriorityQuarterlyManagementRows(
      overviewResponse.priorityQuarterlyManagementRows,
      fallbackOverview.priorityQuarterlyManagementRows,
    ),
  } satisfies SafetyAdminOverviewResponse;
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
  const [unsentSort, setUnsentSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'dispatchPriority',
  });
  const [unsentPage, setUnsentPage] = useState(1);
  const [priorityPage, setPriorityPage] = useState(1);
  const [endingSoonPage, setEndingSoonPage] = useState(1);
  const currentYear = new Date().getFullYear();
  const isMountedRef = useRef(true);
  const latestOverviewRequestKeyRef = useRef('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshOverview = useCallback(
    async (options?: { force?: boolean; preferCached?: boolean }) => {
      const activeRequestKey = `${currentUserId}:overview`;
      latestOverviewRequestKeyRef.current = activeRequestKey;
      const shouldPreferCached = options?.preferCached !== false && options?.force !== true;
      const cached = shouldPreferCached
        ? readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, OVERVIEW_CACHE_KEY)
        : { isFresh: false, savedAt: null, value: null as SafetyAdminOverviewResponse | null };

      try {
        setIsRefreshing(true);
        setError(null);
        if (cached.value && isMountedRef.current) {
          setOverviewResponse(cached.value);
          setLastSyncedAt(cached.savedAt ? new Date(cached.savedAt) : new Date());
        }
        const nextOverview = await fetchAdminSessionCacheOnce(
          currentUserId,
          OVERVIEW_CACHE_KEY,
          async () => {
            const requestGeneration = getAdminSessionCacheGeneration(
              currentUserId,
              OVERVIEW_CACHE_KEY,
            );
            const freshOverview = await fetchAdminOverview();
            if (
              getAdminSessionCacheGeneration(currentUserId, OVERVIEW_CACHE_KEY) ===
              requestGeneration
            ) {
              writeAdminSessionCache(currentUserId, OVERVIEW_CACHE_KEY, freshOverview);
            }
            return freshOverview;
          },
          { force: options?.force },
        );
        if (!isMountedRef.current || latestOverviewRequestKeyRef.current !== activeRequestKey) {
          return;
        }
        setOverviewResponse(nextOverview);
        setLastSyncedAt(new Date());
      } catch (nextError) {
        if (!isMountedRef.current || latestOverviewRequestKeyRef.current !== activeRequestKey) {
          return;
        }
        setError(nextError instanceof Error ? nextError.message : '愿????쒕낫?쒕? 遺덈윭?ㅼ? 紐삵뻽?듬땲??');
      } finally {
        if (isMountedRef.current && latestOverviewRequestKeyRef.current === activeRequestKey) {
          setIsRefreshing(false);
        }
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    const cached = readAdminSessionCache<SafetyAdminOverviewResponse>(currentUserId, OVERVIEW_CACHE_KEY);
    if (cached.value) {
      setOverviewResponse(cached.value);
      setLastSyncedAt(cached.savedAt ? new Date(cached.savedAt) : new Date());
    }
    void refreshOverview({ preferCached: false });
  }, [currentUserId, refreshOverview]);

  const overview = useMemo(
    () => mergeOverviewResponseWithFallback(overviewResponse, fallbackOverview),
    [fallbackOverview, overviewResponse],
  );

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
    const sourceRows = overview.priorityQuarterlyManagementRows ?? [];
    const fallbackRowsByKey = new Map(
      (fallbackOverview.priorityQuarterlyManagementRows ?? []).map((row) => [
        getPriorityQuarterlyManagementRowKey(row),
        row,
      ]),
    );

    return sourceRows.map((row) => {
      const fallbackRow = fallbackRowsByKey.get(getPriorityQuarterlyManagementRowKey(row));
      const siteId = row.siteId || fallbackRow?.siteId || '';
      return {
        ...fallbackRow,
        ...row,
        href: siteId ? buildSiteQuarterlyListHref(siteId) : fallbackRow?.href || row.href,
        quarterlyReportHref: row.quarterlyReportHref || fallbackRow?.quarterlyReportHref || '',
        quarterlyReportKey: row.quarterlyReportKey || fallbackRow?.quarterlyReportKey || '',
      };
    });
  }, [
    fallbackOverview.priorityQuarterlyManagementRows,
    overview.priorityQuarterlyManagementRows,
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
      (row) => row.quarterKey || row.quarterLabel,
    );
  }, [currentYear, overview.quarterlyMaterialSummary.missingSiteRows]);

  const visibleMaterialQuarterLabel = useMemo(() => {
    return visibleMaterialRows[0]?.quarterLabel || overview.quarterlyMaterialSummary.quarterLabel;
  }, [overview.quarterlyMaterialSummary.quarterLabel, visibleMaterialRows]);

  const visibleUnsentReportRows = useMemo(() => {
    return normalizedUnsentReportRows;
  }, [normalizedUnsentReportRows]);

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
        case 'dispatchPriority': {
          const comparison = compareDispatchManagementUnsentRows(left, right);
          return unsentSort.direction === 'asc' ? -comparison : comparison;
        }
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
      alertsTotalCount: overview.alertsTotalCount,
      completionRowsTotalCount: overview.completionRowsTotalCount,
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
        await refreshOverview({ force: true, preferCached: false });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '諛쒖넚 愿由??뺤콉???낅뜲?댄듃?섏? 紐삵뻽?듬땲??');
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
