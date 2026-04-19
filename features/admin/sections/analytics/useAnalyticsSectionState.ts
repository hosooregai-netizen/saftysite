'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import type { AdminAnalyticsPeriod } from '@/features/admin/lib/buildAdminControlCenterModel';
import { readAdminSessionCache, writeAdminSessionCache } from '@/features/admin/lib/adminSessionCache';
import { fetchAdminAnalytics, fetchAdminDirectoryLookups } from '@/lib/admin/apiClient';
import { exportAdminServerWorkbook } from '@/lib/admin/exportClient';
import type { SafetyAdminAnalyticsResponse, TableSortState } from '@/types/admin';
import {
  buildScopeChipsFromLookups,
  EMPTY_ANALYTICS,
  sortEmployeeRows,
  sortSiteRevenueRows,
} from './analyticsSectionHelpers';

interface AnalyticsLookups {
  contractTypes: Array<{ label: string; value: string }>;
  headquarters: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
}

const EMPTY_LOOKUPS: AnalyticsLookups = {
  contractTypes: [],
  headquarters: [],
  users: [],
};

const DEFAULT_EMPLOYEE_SORT: TableSortState = { direction: 'desc', key: 'visitRevenue' };
const DEFAULT_SITE_REVENUE_SORT: TableSortState = { direction: 'desc', key: 'visitRevenue' };
const DETAIL_PAGE_SIZE = 20;

function normalizeYearSelection(
  current: number | null,
  availableYears: number[],
  todayYear: number,
) {
  if (availableYears.length === 0) return todayYear;
  if (current && availableYears.includes(current)) return current;
  if (availableYears.includes(todayYear)) return todayYear;
  return availableYears[0];
}

export function useAnalyticsSectionState(currentUserId: string) {
  const searchParams = useSearchParams();
  const {
    query,
    queryInput,
    setQueryInput,
    submitQuery,
  } = useSubmittedSearchState(searchParams.get('query') || '');
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>(() => {
    const value = searchParams.get('period');
    return value === 'month' || value === 'quarter' || value === 'year' || value === 'all'
      ? value
      : 'month';
  });
  const [headquarterId, setHeadquarterId] = useState(() => searchParams.get('headquarterId') || '');
  const [userId, setUserId] = useState(() => searchParams.get('userId') || '');
  const [contractType, setContractType] = useState(() => searchParams.get('contractType') || '');
  const [detailView, setDetailView] = useState<'employee' | 'site'>('employee');
  const [employeeSort, setEmployeeSort] = useState<TableSortState>(DEFAULT_EMPLOYEE_SORT);
  const [siteRevenueSort, setSiteRevenueSort] = useState<TableSortState>(DEFAULT_SITE_REVENUE_SORT);
  const [employeePage, setEmployeePage] = useState(1);
  const [siteRevenuePage, setSiteRevenuePage] = useState(1);
  const [chartYear, setChartYear] = useState<number | null>(null);
  const cachedLookups = useMemo(
    () => readAdminSessionCache<AnalyticsLookups>(currentUserId, 'analytics-lookups'),
    [currentUserId],
  );
  const [resolvedLookupsState, setResolvedLookupsState] = useState<{
    lookups: AnalyticsLookups;
    userId: string;
  } | null>(null);
  const deferredQuery = useDeferredValue(query);

  const analyticsRequest = useMemo(
    () => ({
      contractType,
      headquarterId,
      period,
      query: deferredQuery.trim(),
      userId,
    }),
    [contractType, deferredQuery, headquarterId, period, userId],
  );
  const requestKey = useMemo(() => JSON.stringify(analyticsRequest), [analyticsRequest]);
  const cachedAnalyticsForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminAnalyticsResponse>(
        currentUserId,
        `analytics:${requestKey}`,
      ),
    [currentUserId, requestKey],
  );
  const [analyticsState, setAnalyticsState] = useState<{
    analytics: SafetyAdminAnalyticsResponse;
    error: string | null;
    errorRequestKey: string;
    resolvedRequestKey: string;
  }>(() => {
    const cached = cachedAnalyticsForRequest.value;
    return {
      analytics: cached ?? EMPTY_ANALYTICS,
      error: null,
      errorRequestKey: '',
      resolvedRequestKey: cached ? requestKey : '',
    };
  });
  const [loadingRequestKey, setLoadingRequestKey] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const lookups =
    (resolvedLookupsState?.userId === currentUserId ? resolvedLookupsState.lookups : null) ??
    cachedLookups.value ??
    EMPTY_LOOKUPS;
  const analytics =
    analyticsState.resolvedRequestKey === requestKey
      ? analyticsState.analytics
      : cachedAnalyticsForRequest.value ?? analyticsState.analytics;
  const todayYear = new Date().getFullYear();
  const selectedChartYear = useMemo(
    () => normalizeYearSelection(chartYear, analytics.availableTrendYears, todayYear),
    [analytics.availableTrendYears, chartYear, todayYear],
  );

  useEffect(() => {
    if (cachedLookups.isFresh && cachedLookups.value) {
      return;
    }

    void fetchAdminDirectoryLookups()
      .then((response) => {
        const normalizedLookups = {
          contractTypes: response.contractTypes,
          headquarters: response.headquarters,
          users: response.users.map((user) => ({
            id: user.id,
            name: user.name,
          })),
        } satisfies AnalyticsLookups;
        writeAdminSessionCache(currentUserId, 'analytics-lookups', normalizedLookups);
        setResolvedLookupsState({
          lookups: normalizedLookups,
          userId: currentUserId,
        });
      })
      .catch((error) => {
        console.error('Failed to load admin analytics lookups', error);
      });
  }, [cachedLookups.isFresh, cachedLookups.value, currentUserId]);

  useEffect(() => {
    if (cachedAnalyticsForRequest.isFresh && cachedAnalyticsForRequest.value) {
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    queueMicrotask(() => {
      setLoadingRequestKey(requestKey);
    });

    void fetchAdminAnalytics(analyticsRequest, { signal: abortController.signal })
      .then((response) => {
        writeAdminSessionCache(currentUserId, `analytics:${requestKey}`, response);
        setAnalyticsState({
          analytics: response,
          error: null,
          errorRequestKey: '',
          resolvedRequestKey: requestKey,
        });
        setLoadingRequestKey('');
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        setAnalyticsState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '실적/매출 데이터를 불러오지 못했습니다.',
          errorRequestKey: requestKey,
        }));
        setLoadingRequestKey('');
      });

    return () => {
      abortController.abort();
    };
  }, [analyticsRequest, cachedAnalyticsForRequest.isFresh, cachedAnalyticsForRequest.value, currentUserId, requestKey]);

  const loadError = analyticsState.errorRequestKey === requestKey ? analyticsState.error : null;
  const isLoading = loadingRequestKey === requestKey || analyticsState.resolvedRequestKey !== requestKey;
  const hasVisibleAnalytics =
    analyticsState.resolvedRequestKey.length > 0 ||
    Boolean(cachedAnalyticsForRequest.value) ||
    analytics.availableTrendYears.length > 0 ||
    analytics.summaryCards.length > 0 ||
    analytics.employeeRows.length > 0 ||
    analytics.siteRevenueRows.length > 0;
  const isInitialLoading = isLoading && !hasVisibleAnalytics;
  const isRefreshing = isLoading && hasVisibleAnalytics;
  const activeFilterCount =
    (period !== 'month' ? 1 : 0) + (headquarterId ? 1 : 0) + (userId ? 1 : 0) + (contractType ? 1 : 0);
  const headquarterOptions = useMemo(
    () => lookups.headquarters.map((headquarter) => ({ label: headquarter.name, value: headquarter.id })),
    [lookups.headquarters],
  );
  const userOptions = useMemo(
    () => lookups.users.map((user) => ({ label: user.name, value: user.id })),
    [lookups.users],
  );
  const contractTypeOptions = useMemo(() => lookups.contractTypes, [lookups.contractTypes]);
  const scopeChips = useMemo(
    () =>
      buildScopeChipsFromLookups({
        contractType,
        contractTypeOptions,
        headquarterId,
        headquarterOptions,
        period,
        query,
        userId,
        userOptions,
      }),
    [contractType, contractTypeOptions, headquarterId, headquarterOptions, period, query, userId, userOptions],
  );
  const activeChartSlice = useMemo(() => {
    if (analytics.chartYearSlices.length === 0) {
      return {
        employeeRows: analytics.employeeRows,
        siteRevenueRows: analytics.siteRevenueRows,
        trendRows: analytics.trendRows,
        year: selectedChartYear,
      };
    }
    return (
      analytics.chartYearSlices.find((slice) => slice.year === selectedChartYear) ??
      analytics.chartYearSlices[0]
    );
  }, [
    analytics.chartYearSlices,
    analytics.employeeRows,
    analytics.siteRevenueRows,
    analytics.trendRows,
    selectedChartYear,
  ]);

  const sortedEmployeeRows = useMemo(
    () => sortEmployeeRows(analytics.employeeRows, employeeSort),
    [analytics.employeeRows, employeeSort],
  );
  const sortedSiteRevenueRows = useMemo(
    () => sortSiteRevenueRows(analytics.siteRevenueRows, siteRevenueSort),
    [analytics.siteRevenueRows, siteRevenueSort],
  );
  const employeeTotalPages = Math.max(1, Math.ceil(sortedEmployeeRows.length / DETAIL_PAGE_SIZE));
  const siteSummaryRow = sortedSiteRevenueRows.find((row) => row.isSummaryRow) ?? null;
  const siteDetailRows = sortedSiteRevenueRows.filter((row) => !row.isSummaryRow);
  const siteRevenueTotalPages = Math.max(1, Math.ceil(siteDetailRows.length / DETAIL_PAGE_SIZE));

  useEffect(() => {
    setEmployeePage((current) => Math.min(current, employeeTotalPages));
  }, [employeeTotalPages]);

  useEffect(() => {
    setSiteRevenuePage((current) => Math.min(current, siteRevenueTotalPages));
  }, [siteRevenueTotalPages]);

  useEffect(() => {
    setEmployeePage(1);
  }, [analytics.employeeRows, contractType, employeeSort, headquarterId, period, requestKey, userId]);

  useEffect(() => {
    setSiteRevenuePage(1);
  }, [analytics.siteRevenueRows, contractType, headquarterId, period, requestKey, siteRevenueSort, userId]);

  const pagedEmployeeRows = useMemo(() => {
    const startIndex = (employeePage - 1) * DETAIL_PAGE_SIZE;
    return sortedEmployeeRows.slice(startIndex, startIndex + DETAIL_PAGE_SIZE);
  }, [employeePage, sortedEmployeeRows]);

  const pagedSiteRevenueRows = useMemo(() => {
    const startIndex = (siteRevenuePage - 1) * DETAIL_PAGE_SIZE;
    const pageRows = siteDetailRows.slice(startIndex, startIndex + DETAIL_PAGE_SIZE);
    return siteSummaryRow ? [siteSummaryRow, ...pageRows] : pageRows;
  }, [siteDetailRows, siteRevenuePage, siteSummaryRow]);

  const resetHeaderFilters = () => {
    setPeriod('month');
    setHeadquarterId('');
    setUserId('');
    setContractType('');
  };

  const exportAnalytics = async () => {
    await exportAdminServerWorkbook('analytics', {
      contract_type: contractType,
      headquarter_id: headquarterId,
      period,
      query,
      user_id: userId,
    });
  };

  return {
    activeChartSlice,
    activeFilterCount,
    analytics,
    chartYear: activeChartSlice.year,
    contractType,
    contractTypeOptions,
    detailView,
    employeePage,
    employeeSort,
    employeeTotalPages,
    exportAnalytics,
    headquarterId,
    headquarterOptions,
    isInitialLoading,
    isLoading,
    isRefreshing,
    loadError,
    pagedEmployeeRows,
    pagedSiteRevenueRows,
    period,
    query,
    queryInput,
    resetHeaderFilters,
    scopeChips,
    setChartYear,
    setContractType,
    setDetailView,
    setEmployeePage,
    setEmployeeSort,
    setHeadquarterId,
    setPeriod,
    setQueryInput,
    submitQuery,
    setSiteRevenuePage,
    setSiteRevenueSort,
    setUserId,
    siteRevenuePage,
    siteRevenueSort,
    siteRevenueTotalPages,
    sortedEmployeeRows,
    sortedSiteRevenueRows,
    userId,
    userOptions,
  };
}
