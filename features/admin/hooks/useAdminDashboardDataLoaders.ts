'use client';

import { useCallback, useEffect } from 'react';
import { primeControllerDashboardData } from '@/hooks/controller/useControllerDashboard';
import { fetchSafetyContentItems, fetchSafetyReportList, readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import { readAdminSessionCache, writeAdminSessionCache } from '@/features/admin/lib/adminSessionCache';
import {
  readSafetyContentItemsSessionCache,
  writeSafetyContentItemsSessionCache,
} from '@/lib/safetyApi/contentItemsCache';
import { filterVisibleAdminReportListItems } from '@/lib/admin/reportVisibility';
import type { ControllerDashboardData } from '@/types/controller';
import type { SafetyReportListItem } from '@/types/backend';
import { ADMIN_REPORT_LIST_LIMIT, getErrorMessage } from './adminDashboardStateShared';

interface UseAdminDashboardDataLoadersParams {
  contentCacheScope: string | null;
  data: ControllerDashboardData;
  enabled: boolean;
  hasLoadedContentData: boolean;
  hasLoadedCoreData: boolean;
  reportList: SafetyReportListItem[];
  setData: React.Dispatch<React.SetStateAction<ControllerDashboardData>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setHasLoadedContentData: React.Dispatch<React.SetStateAction<boolean>>;
  setHasLoadedCoreData: React.Dispatch<React.SetStateAction<boolean>>;
  setIsContentLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsContentRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsReportsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setReportList: React.Dispatch<React.SetStateAction<SafetyReportListItem[]>>;
  shouldLoadCoreData: boolean;
  shouldLoadReports: boolean;
  shouldLoadContent: boolean;
}

export function useAdminDashboardDataLoaders({
  contentCacheScope,
  data,
  enabled,
  hasLoadedContentData,
  hasLoadedCoreData,
  reportList,
  setData,
  setError,
  setHasLoadedContentData,
  setHasLoadedCoreData,
  setIsContentLoading,
  setIsContentRefreshing,
  setIsLoading,
  setIsReportsLoading,
  setReportList,
  shouldLoadCoreData,
  shouldLoadReports,
  shouldLoadContent,
}: UseAdminDashboardDataLoadersParams) {
  const getToken = useCallback(() => {
    const token = readSafetyAuthToken();
    if (!token) {
      throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    }
    return token;
  }, []);
  const reloadContent = useCallback(
    async (options?: { force?: boolean }) => {
      if (!enabled) return;
      const force = options?.force === true;
      const cachedContentItems =
        !force && contentCacheScope ? readSafetyContentItemsSessionCache(contentCacheScope) : null;
      const hasCachedContentItems = cachedContentItems !== null;
      const hasVisibleContentItems = data.contentItems.length > 0;
      setError(null);
      if (hasCachedContentItems) {
        setData((current) => ({ ...current, contentItems: cachedContentItems }));
        setHasLoadedContentData(true);
      }
      if (hasCachedContentItems || hasVisibleContentItems || hasLoadedContentData) {
        setIsContentLoading(false);
        setIsContentRefreshing(true);
      } else {
        setIsContentLoading(true);
        setIsContentRefreshing(false);
      }

      try {
        const token = getToken();
        const contentItems = await fetchSafetyContentItems(token, { force });
        if (contentCacheScope) {
          writeSafetyContentItemsSessionCache(contentCacheScope, contentItems);
        }
        setData((current) => ({ ...current, contentItems }));
        setHasLoadedContentData(true);
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        setIsContentLoading(false);
        setIsContentRefreshing(false);
      }
    },
    [contentCacheScope, data.contentItems.length, enabled, getToken, hasLoadedContentData, setData, setError, setHasLoadedContentData, setIsContentLoading, setIsContentRefreshing],
  );
  const loadReports = useCallback(
    async (options?: {
      force?: boolean;
      headquarters?: ControllerDashboardData['headquarters'];
      sites?: ControllerDashboardData['sites'];
    }) => {
      if (!enabled) return;
      const cachedReportList =
        !options?.force && contentCacheScope
          ? readAdminSessionCache<SafetyReportListItem[]>(contentCacheScope, 'report-list')
          : { isFresh: false, value: null };
      if (cachedReportList.value) {
        setReportList(cachedReportList.value);
      }
      if (cachedReportList.isFresh && cachedReportList.value) {
        setIsReportsLoading(false);
        return;
      }
      setError(null);
      setIsReportsLoading(true);
      try {
        const token = getToken();
        const reports = await fetchSafetyReportList(token, {
          activeOnly: true,
          limit: ADMIN_REPORT_LIST_LIMIT,
        });
        const nextHeadquarters = options?.headquarters ?? data.headquarters;
        const nextSites = options?.sites ?? data.sites;
        const visibleReports = filterVisibleAdminReportListItems(reports, nextSites, nextHeadquarters);
        setReportList(visibleReports);
        writeAdminSessionCache(contentCacheScope, 'report-list', visibleReports);
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        setIsReportsLoading(false);
      }
    },
    [contentCacheScope, data.headquarters, data.sites, enabled, getToken, setError, setIsReportsLoading, setReportList],
  );
  const reload = useCallback(
    async (options?: { includeContent?: boolean; includeReports?: boolean; force?: boolean }) => {
      if (!enabled) return;
      const cachedCoreData =
        !options?.force && contentCacheScope
          ? readAdminSessionCache<ControllerDashboardData>(contentCacheScope, 'core-data')
          : { isFresh: false, value: null };
      if (cachedCoreData.value) {
        setData((current) => ({
          ...current,
          assignments: cachedCoreData.value?.assignments ?? current.assignments,
          headquarters: cachedCoreData.value?.headquarters ?? current.headquarters,
          sites: cachedCoreData.value?.sites ?? current.sites,
          users: cachedCoreData.value?.users ?? current.users,
        }));
        setHasLoadedCoreData(true);
      }
      if (cachedCoreData.isFresh && cachedCoreData.value) {
        if (options?.includeReports) {
          void loadReports({
            force: false,
            headquarters: cachedCoreData.value.headquarters,
            sites: cachedCoreData.value.sites,
          });
        }
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const token = getToken();
        const { assignments, headquarters, sites, users } = await primeControllerDashboardData(token, {
          force: options?.force,
        });
        setData((current) => ({
          ...current,
          assignments,
          headquarters,
          sites,
          users,
        }));
        writeAdminSessionCache(contentCacheScope, 'core-data', {
          assignments,
          contentItems: [],
          headquarters,
          sites,
          users,
        });
        const followUpTasks: Array<Promise<void>> = [];
        if (options?.includeReports) {
          followUpTasks.push(loadReports({ force: options?.force, headquarters, sites }));
        }
        if (options?.includeContent) followUpTasks.push(reloadContent({ force: options?.force }));
        if (followUpTasks.length > 0) {
          await Promise.all(followUpTasks);
        }
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        setHasLoadedCoreData(true);
        setIsLoading(false);
      }
    },
    [contentCacheScope, enabled, getToken, loadReports, reloadContent, setData, setError, setHasLoadedCoreData, setIsLoading],
  );
  useEffect(() => {
    if (enabled && shouldLoadCoreData && !hasLoadedCoreData) {
      void reload({ includeReports: shouldLoadReports });
    }
  }, [enabled, hasLoadedCoreData, reload, shouldLoadCoreData, shouldLoadReports]);
  useEffect(() => {
    if (!enabled || !shouldLoadContent) return;
    void reloadContent();
  }, [enabled, reloadContent, shouldLoadContent]);
  useEffect(() => {
    if (!enabled || !shouldLoadReports) return;
    if (shouldLoadCoreData && !hasLoadedCoreData) return;
    if (reportList.length > 0) return;
    void loadReports();
  }, [enabled, hasLoadedCoreData, loadReports, reportList.length, shouldLoadCoreData, shouldLoadReports]);
  return { getToken, loadReports, reload, reloadContent };
}
