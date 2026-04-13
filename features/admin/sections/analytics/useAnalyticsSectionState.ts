'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchAdminAnalytics } from '@/lib/admin/apiClient';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import {
  getAnalyticsExportSheets,
  type AdminAnalyticsModel,
  type AdminAnalyticsPeriod,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import type { SafetyAdminAnalyticsResponse, TableSortState } from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';
import {
  buildContractTypeOptions,
  buildScopeChips,
  EMPTY_ANALYTICS,
  sortEmployeeRows,
  sortSiteRevenueRows,
} from './analyticsSectionHelpers';

export function useAnalyticsSectionState(data: ControllerDashboardData) {
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
  const [analyticsState, setAnalyticsState] = useState<{
    analytics: SafetyAdminAnalyticsResponse;
    error: string | null;
    requestKey: string;
  }>({
    analytics: EMPTY_ANALYTICS,
    error: null,
    requestKey: '',
  });

  useEffect(() => {
    let cancelled = false;
    void fetchAdminAnalytics(analyticsRequest)
      .then((response) => {
        if (cancelled) return;
        setAnalyticsState({ analytics: response, error: null, requestKey });
      })
      .catch((error) => {
        if (cancelled) return;
        setAnalyticsState({
          analytics: EMPTY_ANALYTICS,
          error: error instanceof Error ? error.message : '실적/매출 데이터를 불러오지 못했습니다.',
          requestKey,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [analyticsRequest, requestKey]);

  const analytics = analyticsState.requestKey === requestKey ? analyticsState.analytics : EMPTY_ANALYTICS;
  const loadError = analyticsState.requestKey === requestKey ? analyticsState.error : null;
  const isLoading = analyticsState.requestKey !== requestKey;
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
    await exportAdminWorkbook(
      'analytics',
      getAnalyticsExportSheets({
        ...(analytics as AdminAnalyticsModel),
        employeeRows: sortedEmployeeRows,
        siteRevenueRows: sortedSiteRevenueRows,
      }),
    );
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
    isLoading,
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
