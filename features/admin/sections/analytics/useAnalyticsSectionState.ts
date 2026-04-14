'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  buildAdminAnalyticsModel,
  type AdminAnalyticsPeriod,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { fetchAdminAnalytics } from '@/lib/admin/apiClient';
import { exportAdminServerWorkbook } from '@/lib/admin/exportClient';
import type { SafetyReportListItem } from '@/types/backend';
import type { SafetyAdminAnalyticsResponse, TableSortState } from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';
import {
  buildContractTypeOptions,
  buildScopeChips,
  EMPTY_ANALYTICS,
  sortEmployeeRows,
  sortSiteRevenueRows,
} from './analyticsSectionHelpers';

interface AnalyticsFetchState {
  analytics: SafetyAdminAnalyticsResponse;
  error: string | null;
  errorRequestKey: string;
  resolvedRequestKey: string;
}

export function useAnalyticsSectionState(
  data: ControllerDashboardData,
  reportList: SafetyReportListItem[],
  isReportsLoading: boolean,
) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
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
  const [employeeSort, setEmployeeSort] = useState<TableSortState>({ direction: 'desc', key: 'visitRevenue' });
  const [siteRevenueSort, setSiteRevenueSort] = useState<TableSortState>({ direction: 'desc', key: 'visitRevenue' });
  const deferredQuery = useDeferredValue(query);

  const analyticsRequest = useMemo(
    () => ({ contractType, headquarterId, period, query: deferredQuery, userId }),
    [contractType, deferredQuery, headquarterId, period, userId],
  );
  const requestKey = useMemo(() => JSON.stringify(analyticsRequest), [analyticsRequest]);
  const canBuildInitialAnalytics = !isReportsLoading;
  const initialAnalytics = useMemo(
    () =>
      canBuildInitialAnalytics
        ? buildAdminAnalyticsModel(data, reportList, analyticsRequest, new Date())
        : null,
    [analyticsRequest, canBuildInitialAnalytics, data, reportList],
  );
  const [analyticsCache, setAnalyticsCache] = useState<Record<string, SafetyAdminAnalyticsResponse>>({});
  const [analyticsState, setAnalyticsState] = useState<AnalyticsFetchState>(() => ({
    analytics: initialAnalytics ?? EMPTY_ANALYTICS,
    error: null,
    errorRequestKey: '',
    resolvedRequestKey: initialAnalytics ? requestKey : '',
  }));

  useEffect(() => {
    const abortController = new AbortController();

    void fetchAdminAnalytics(analyticsRequest, { signal: abortController.signal })
      .then((response) => {
        setAnalyticsCache((current) => ({
          ...current,
          [requestKey]: response,
        }));
        setAnalyticsState({
          analytics: response,
          error: null,
          errorRequestKey: '',
          resolvedRequestKey: requestKey,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAnalyticsState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '실적/매출 데이터를 불러오지 못했습니다.',
          errorRequestKey: requestKey,
        }));
      });

    return () => {
      abortController.abort();
    };
  }, [analyticsRequest, requestKey]);

  const cachedAnalytics = analyticsCache[requestKey] ?? initialAnalytics;
  const analytics =
    analyticsState.resolvedRequestKey === requestKey
      ? analyticsState.analytics
      : cachedAnalytics ?? analyticsState.analytics;
  const loadError = analyticsState.errorRequestKey === requestKey ? analyticsState.error : null;
  const isLoading = analyticsState.resolvedRequestKey !== requestKey;
  const hasVisibleAnalytics =
    analyticsState.resolvedRequestKey === requestKey || Boolean(cachedAnalytics) || analyticsState.resolvedRequestKey.length > 0;
  const isInitialLoading = isLoading && !hasVisibleAnalytics;
  const isRefreshing = isLoading && hasVisibleAnalytics;
  const activeFilterCount =
    (period !== 'month' ? 1 : 0) + (headquarterId ? 1 : 0) + (userId ? 1 : 0) + (contractType ? 1 : 0);
  const contractTypeOptions = useMemo(() => buildContractTypeOptions(data), [data]);
  const sortedEmployeeRows = useMemo(
    () => sortEmployeeRows(analytics.employeeRows, employeeSort),
    [analytics.employeeRows, employeeSort],
  );
  const sortedSiteRevenueRows = useMemo(
    () => sortSiteRevenueRows(analytics.siteRevenueRows, siteRevenueSort),
    [analytics.siteRevenueRows, siteRevenueSort],
  );
  const scopeChips = useMemo(
    () => buildScopeChips(data, { contractType, headquarterId, period, query, userId }),
    [contractType, data, headquarterId, period, query, userId],
  );

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
    activeFilterCount,
    analytics,
    contractType,
    contractTypeOptions,
    detailView,
    employeeSort,
    exportAnalytics,
    headquarterId,
    isInitialLoading,
    isLoading,
    isRefreshing,
    loadError,
    period,
    query,
    resetHeaderFilters,
    scopeChips,
    setContractType,
    setDetailView,
    setEmployeeSort,
    setHeadquarterId,
    setPeriod,
    setQuery,
    setSiteRevenueSort,
    setUserId,
    siteRevenueSort,
    sortedEmployeeRows,
    sortedSiteRevenueRows,
    userId,
  };
}
