'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import type { AdminAnalyticsPeriod } from '@/features/admin/lib/buildAdminControlCenterModel';
import { readAdminSessionCache, writeAdminSessionCache } from '@/features/admin/lib/adminSessionCache';
import {
  fetchAdminAnalytics,
  fetchAdminAnalyticsMonthDetail,
  fetchAdminDirectoryLookups,
} from '@/lib/admin/apiClient';
import { exportAdminServerWorkbook } from '@/lib/admin/exportClient';
import type {
  SafetyAdminAnalyticsMonthDetailResponse,
  SafetyAdminAnalyticsSummaryResponse,
  TableSortState,
} from '@/types/admin';
import {
  buildScopeChipsFromLookups,
  EMPTY_ANALYTICS_MONTH_DETAIL,
  EMPTY_ANALYTICS_SUMMARY,
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

function formatMonthToken(target: Date) {
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeBasisMonthSelection(
  current: string,
  availableMonths: string[],
  todayMonth: string,
) {
  if (current && availableMonths.includes(current)) return current;
  if (availableMonths.includes(todayMonth)) return todayMonth;
  return availableMonths[0] ?? todayMonth;
}

interface AnalyticsRequestState<T> {
  data: T;
  error: string | null;
  errorRequestKey: string;
  resolvedRequestKey: string;
}

function hasVisibleSummary(summary: SafetyAdminAnalyticsSummaryResponse) {
  return (
    summary.availableMonths.length > 0 ||
    summary.availableTrendYears.length > 0 ||
    summary.chartYearSlices.length > 0 ||
    summary.summaryCards.length > 0 ||
    summary.contractTypeRows.length > 0 ||
    summary.trendRows.length > 0
  );
}

function hasVisibleMonthDetail(detail: SafetyAdminAnalyticsMonthDetailResponse) {
  return Boolean(
    detail.monthKey ||
      detail.employeeRows.length > 0 ||
      detail.siteRevenueRows.length > 0,
  );
}

export function useAnalyticsSectionState(currentUserId: string) {
  const router = useRouter();
  const pathname = usePathname();
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
  const todayMonth = formatMonthToken(new Date());
  const [basisMonthState, setBasisMonthState] = useState(
    () => searchParams.get('basisMonth') || todayMonth,
  );
  const [lookups, setLookups] = useState<AnalyticsLookups>(() => {
    return readAdminSessionCache<AnalyticsLookups>(currentUserId, 'analytics-lookups').value ?? EMPTY_LOOKUPS;
  });
  const deferredQuery = useDeferredValue(query);

  const summaryRequest = useMemo(
    () => ({
      contractType,
      headquarterId,
      period,
      query: deferredQuery.trim(),
      userId,
    }),
    [contractType, deferredQuery, headquarterId, period, userId],
  );
  const summaryRequestKey = useMemo(
    () => JSON.stringify(summaryRequest),
    [summaryRequest],
  );
  const [summaryState, setSummaryState] = useState<AnalyticsRequestState<SafetyAdminAnalyticsSummaryResponse>>(
    () => {
      const cached = readAdminSessionCache<SafetyAdminAnalyticsSummaryResponse>(
        currentUserId,
        `analytics-summary:${summaryRequestKey}`,
      ).value;
      return {
        data: cached ?? EMPTY_ANALYTICS_SUMMARY,
        error: null,
        errorRequestKey: '',
        resolvedRequestKey: cached ? summaryRequestKey : '',
      };
    },
  );
  const [loadingSummaryRequestKey, setLoadingSummaryRequestKey] = useState('');
  const summaryAbortControllerRef = useRef<AbortController | null>(null);
  const cachedSummaryForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminAnalyticsSummaryResponse>(
        currentUserId,
        `analytics-summary:${summaryRequestKey}`,
      ).value,
    [currentUserId, summaryRequestKey],
  );

  useEffect(() => {
    const cachedLookups = readAdminSessionCache<AnalyticsLookups>(currentUserId, 'analytics-lookups');
    if (cachedLookups.value) {
      setLookups(cachedLookups.value);
    }
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
        setLookups(normalizedLookups);
      })
      .catch((error) => {
        console.error('Failed to load admin analytics lookups', error);
      });
  }, [currentUserId]);

  useEffect(() => {
    const cachedSummary = readAdminSessionCache<SafetyAdminAnalyticsSummaryResponse>(
      currentUserId,
      `analytics-summary:${summaryRequestKey}`,
    );

    if (cachedSummary.value) {
      setSummaryState((current) => ({
        data: cachedSummary.value ?? current.data,
        error: current.errorRequestKey === summaryRequestKey ? current.error : null,
        errorRequestKey:
          current.errorRequestKey === summaryRequestKey ? current.errorRequestKey : '',
        resolvedRequestKey: summaryRequestKey,
      }));
    }
    if (cachedSummary.isFresh && cachedSummary.value) {
      setLoadingSummaryRequestKey('');
      return;
    }

    summaryAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    summaryAbortControllerRef.current = abortController;
    setLoadingSummaryRequestKey(summaryRequestKey);

    void fetchAdminAnalytics(summaryRequest, { signal: abortController.signal })
      .then((response) => {
        writeAdminSessionCache(
          currentUserId,
          `analytics-summary:${summaryRequestKey}`,
          response,
        );
        setSummaryState({
          data: response,
          error: null,
          errorRequestKey: '',
          resolvedRequestKey: summaryRequestKey,
        });
        setLoadingSummaryRequestKey('');
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        setSummaryState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '실적/매출 요약 데이터를 불러오지 못했습니다.',
          errorRequestKey: summaryRequestKey,
        }));
        setLoadingSummaryRequestKey('');
      });

    return () => {
      abortController.abort();
    };
  }, [currentUserId, summaryRequest, summaryRequestKey]);

  const summaryAnalytics =
    summaryState.resolvedRequestKey === summaryRequestKey
      ? summaryState.data
      : cachedSummaryForRequest ?? summaryState.data;
  const summaryError =
    summaryState.errorRequestKey === summaryRequestKey ? summaryState.error : null;
  const isSummaryLoading =
    loadingSummaryRequestKey === summaryRequestKey ||
    summaryState.resolvedRequestKey !== summaryRequestKey;
  const isSummaryInitialLoading =
    isSummaryLoading && !hasVisibleSummary(summaryAnalytics);
  const isSummaryRefreshing =
    isSummaryLoading && hasVisibleSummary(summaryAnalytics);

  const basisMonth = useMemo(
    () =>
      normalizeBasisMonthSelection(
        basisMonthState || summaryAnalytics.basisMonth,
        summaryAnalytics.availableMonths,
        todayMonth,
      ),
    [
      basisMonthState,
      summaryAnalytics.availableMonths,
      summaryAnalytics.basisMonth,
      todayMonth,
    ],
  );
  const canRequestDetail =
    summaryState.resolvedRequestKey === summaryRequestKey ||
    Boolean(cachedSummaryForRequest);

  useEffect(() => {
    setBasisMonthState((current) => {
      if (current === basisMonth) return current;
      return basisMonth;
    });
  }, [basisMonth]);

  const detailRequest = useMemo(
    () => ({
      basisMonth,
      contractType,
      headquarterId,
      period,
      query: deferredQuery.trim(),
      userId,
    }),
    [basisMonth, contractType, deferredQuery, headquarterId, period, userId],
  );
  const detailRequestKey = useMemo(
    () => JSON.stringify(detailRequest),
    [detailRequest],
  );
  const [detailState, setDetailState] = useState<AnalyticsRequestState<SafetyAdminAnalyticsMonthDetailResponse>>(
    () => {
      const cached = readAdminSessionCache<SafetyAdminAnalyticsMonthDetailResponse>(
        currentUserId,
        `analytics-month-detail:${detailRequestKey}`,
      ).value;
      return {
        data: cached ?? EMPTY_ANALYTICS_MONTH_DETAIL,
        error: null,
        errorRequestKey: '',
        resolvedRequestKey: cached ? detailRequestKey : '',
      };
    },
  );
  const [loadingDetailRequestKey, setLoadingDetailRequestKey] = useState('');
  const detailAbortControllerRef = useRef<AbortController | null>(null);
  const cachedDetailForRequest = useMemo(
    () =>
      readAdminSessionCache<SafetyAdminAnalyticsMonthDetailResponse>(
        currentUserId,
        `analytics-month-detail:${detailRequestKey}`,
      ).value,
    [currentUserId, detailRequestKey],
  );

  useEffect(() => {
    if (!canRequestDetail || !basisMonth) {
      setLoadingDetailRequestKey('');
      return;
    }

    const cachedDetail = readAdminSessionCache<SafetyAdminAnalyticsMonthDetailResponse>(
      currentUserId,
      `analytics-month-detail:${detailRequestKey}`,
    );

    if (cachedDetail.value) {
      setDetailState((current) => ({
        data: cachedDetail.value ?? current.data,
        error: current.errorRequestKey === detailRequestKey ? current.error : null,
        errorRequestKey:
          current.errorRequestKey === detailRequestKey ? current.errorRequestKey : '',
        resolvedRequestKey: detailRequestKey,
      }));
    }
    if (cachedDetail.isFresh && cachedDetail.value) {
      setLoadingDetailRequestKey('');
      return;
    }

    detailAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    detailAbortControllerRef.current = abortController;
    setLoadingDetailRequestKey(detailRequestKey);

    void fetchAdminAnalyticsMonthDetail(detailRequest, { signal: abortController.signal })
      .then((response) => {
        writeAdminSessionCache(
          currentUserId,
          `analytics-month-detail:${detailRequestKey}`,
          response,
        );
        setDetailState({
          data: response,
          error: null,
          errorRequestKey: '',
          resolvedRequestKey: detailRequestKey,
        });
        setLoadingDetailRequestKey('');
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        setDetailState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '실적/매출 상세 데이터를 불러오지 못했습니다.',
          errorRequestKey: detailRequestKey,
        }));
        setLoadingDetailRequestKey('');
      });

    return () => {
      abortController.abort();
    };
  }, [basisMonth, canRequestDetail, currentUserId, detailRequest, detailRequestKey]);

  const monthDetail =
    detailState.resolvedRequestKey === detailRequestKey
      ? detailState.data
      : cachedDetailForRequest ?? detailState.data;
  const detailError =
    detailState.errorRequestKey === detailRequestKey ? detailState.error : null;
  const isDetailLoading =
    canRequestDetail &&
    Boolean(basisMonth) &&
    (loadingDetailRequestKey === detailRequestKey ||
      detailState.resolvedRequestKey !== detailRequestKey);
  const isDetailInitialLoading =
    !isSummaryInitialLoading &&
    isDetailLoading &&
    !hasVisibleMonthDetail(monthDetail);
  const isDetailRefreshing =
    isDetailLoading && hasVisibleMonthDetail(monthDetail);

  const activeFilterCount =
    (period !== 'month' ? 1 : 0) +
    (headquarterId ? 1 : 0) +
    (userId ? 1 : 0) +
    (contractType ? 1 : 0);
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
    [
      contractType,
      contractTypeOptions,
      headquarterId,
      headquarterOptions,
      period,
      query,
      userId,
      userOptions,
    ],
  );
  const todayYear = new Date().getFullYear();
  const activeChartSlice = useMemo(() => {
    const targetYear = Number.parseInt((basisMonth || todayMonth).slice(0, 4), 10) || todayYear;
    if (summaryAnalytics.chartYearSlices.length === 0) {
      return {
        employeeRows: monthDetail.employeeRows,
        siteRevenueRows: monthDetail.siteRevenueRows,
        trendRows: summaryAnalytics.trendRows,
        year: targetYear,
      };
    }
    return (
      summaryAnalytics.chartYearSlices.find((slice) => slice.year === targetYear) ??
      summaryAnalytics.chartYearSlices[0]
    );
  }, [
    basisMonth,
    monthDetail.employeeRows,
    monthDetail.siteRevenueRows,
    summaryAnalytics.chartYearSlices,
    summaryAnalytics.trendRows,
    todayMonth,
    todayYear,
  ]);

  const sortedEmployeeRows = useMemo(
    () => sortEmployeeRows(monthDetail.employeeRows, employeeSort),
    [employeeSort, monthDetail.employeeRows],
  );
  const sortedSiteRevenueRows = useMemo(
    () => sortSiteRevenueRows(monthDetail.siteRevenueRows, siteRevenueSort),
    [monthDetail.siteRevenueRows, siteRevenueSort],
  );
  const employeeTotalPages = Math.max(
    1,
    Math.ceil(sortedEmployeeRows.length / DETAIL_PAGE_SIZE),
  );
  const siteSummaryRow = sortedSiteRevenueRows.find((row) => row.isSummaryRow) ?? null;
  const siteDetailRows = sortedSiteRevenueRows.filter((row) => !row.isSummaryRow);
  const siteRevenueTotalPages = Math.max(
    1,
    Math.ceil(siteDetailRows.length / DETAIL_PAGE_SIZE),
  );

  useEffect(() => {
    setEmployeePage((current) => Math.min(current, employeeTotalPages));
  }, [employeeTotalPages]);

  useEffect(() => {
    setSiteRevenuePage((current) => Math.min(current, siteRevenueTotalPages));
  }, [siteRevenueTotalPages]);

  useEffect(() => {
    setEmployeePage(1);
  }, [detailRequestKey, employeeSort]);

  useEffect(() => {
    setSiteRevenuePage(1);
  }, [detailRequestKey, siteRevenueSort]);

  const pagedEmployeeRows = useMemo(() => {
    const startIndex = (employeePage - 1) * DETAIL_PAGE_SIZE;
    return sortedEmployeeRows.slice(startIndex, startIndex + DETAIL_PAGE_SIZE);
  }, [employeePage, sortedEmployeeRows]);

  const pagedSiteRevenueRows = useMemo(() => {
    const startIndex = (siteRevenuePage - 1) * DETAIL_PAGE_SIZE;
    const pageRows = siteDetailRows.slice(startIndex, startIndex + DETAIL_PAGE_SIZE);
    return siteSummaryRow ? [siteSummaryRow, ...pageRows] : pageRows;
  }, [siteDetailRows, siteRevenuePage, siteSummaryRow]);

  const setBasisMonth = (nextMonth: string) => {
    setBasisMonthState(nextMonth);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextMonth && nextMonth !== todayMonth) {
      nextParams.set('basisMonth', nextMonth);
    } else {
      nextParams.delete('basisMonth');
    }
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    if (typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', nextUrl);
      return;
    }
    router.replace(nextUrl, { scroll: false });
  };

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
    basisMonth,
    chartYear: activeChartSlice.year,
    contractType,
    contractTypeOptions,
    detailError,
    detailView,
    employeePage,
    employeeSort,
    employeeTotalPages,
    exportAnalytics,
    headquarterId,
    headquarterOptions,
    isDetailInitialLoading,
    isDetailRefreshing,
    isLoading: isSummaryLoading || isDetailLoading,
    isSummaryLoading,
    isSummaryInitialLoading,
    isSummaryRefreshing,
    loadError: summaryError,
    monthDetail,
    pagedEmployeeRows,
    pagedSiteRevenueRows,
    period,
    query,
    queryInput,
    resetHeaderFilters,
    scopeChips,
    setBasisMonth,
    setContractType,
    setDetailView,
    setEmployeePage,
    setEmployeeSort,
    setHeadquarterId,
    setPeriod,
    setQueryInput,
    setSiteRevenuePage,
    setSiteRevenueSort,
    setUserId,
    siteRevenuePage,
    siteRevenueSort,
    siteRevenueTotalPages,
    submitQuery,
    summaryAnalytics,
    userId,
    userOptions,
  };
}
