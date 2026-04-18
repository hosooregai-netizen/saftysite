'use client';

import { useCallback, useEffect } from 'react';
import { fetchSafetyReportList, readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import {
  fetchSafetyContentItemsAdmin,
  fetchSafetyHeadquartersPage,
  fetchSafetySitesAdminPage,
} from '@/lib/safetyApi/adminEndpoints';
import {
  ADMIN_DASHBOARD_BOOTSTRAP_CONTENT_LIST_CACHE_KEY,
  ADMIN_DASHBOARD_BOOTSTRAP_MAILBOX_DIRECTORY_CACHE_KEY,
  ADMIN_DASHBOARD_BOOTSTRAP_REPORT_LIST_CACHE_KEY,
  ADMIN_DASHBOARD_BOOTSTRAP_SITES_CACHE_KEY,
} from '@/features/admin/lib/adminDashboardBootstrapCache';
import { readAdminSessionCache, writeAdminSessionCache } from '@/features/admin/lib/adminSessionCache';
import { filterVisibleAdminReportListItems } from '@/lib/admin/reportVisibility';
import type { ControllerDashboardData } from '@/types/controller';
import type { SafetyContentItemListItem, SafetyReportListItem } from '@/types/backend';
import { ADMIN_REPORT_LIST_LIMIT, getErrorMessage } from './adminDashboardStateShared';

export type AdminCoreDataScope = 'none' | 'sites' | 'mailbox';

const ADMIN_DIRECTORY_PAGE_LIMIT = 200;

type MailboxDirectoryData = Pick<ControllerDashboardData, 'headquarters' | 'sites'>;

/**
 * These loaders hydrate dashboard shell/bootstrap data. They intentionally use
 * bootstrap-scoped session cache keys so they do not masquerade as section-owned
 * caches such as overview, analytics, reports, or schedules.
 */

function mergeLoadedCoreDataScope(
  currentScope: AdminCoreDataScope,
  nextScope: AdminCoreDataScope,
): AdminCoreDataScope {
  if (currentScope === 'mailbox' || nextScope === 'mailbox') return 'mailbox';
  if (currentScope === 'sites' || nextScope === 'sites') return 'sites';
  return 'none';
}

function isCoreDataScopeLoaded(
  loadedScope: AdminCoreDataScope,
  requestedScope: AdminCoreDataScope,
) {
  if (requestedScope === 'none') return true;
  if (requestedScope === 'sites') return loadedScope === 'sites' || loadedScope === 'mailbox';
  return loadedScope === 'mailbox';
}

async function fetchAllAdminPages<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(ADMIN_DIRECTORY_PAGE_LIMIT, offset);
    rows.push(...page);

    if (page.length < ADMIN_DIRECTORY_PAGE_LIMIT) {
      return rows;
    }

    offset += page.length;
  }
}

function fetchAdminSitesDirectory(token: string) {
  return fetchAllAdminPages((limit, offset) => fetchSafetySitesAdminPage(token, { limit, offset }));
}

function fetchMailboxDirectory(token: string): Promise<MailboxDirectoryData> {
  return Promise.all([
    fetchAllAdminPages((limit, offset) => fetchSafetyHeadquartersPage(token, { limit, offset })),
    fetchAdminSitesDirectory(token),
  ]).then(([headquarters, sites]) => ({ headquarters, sites }));
}

interface UseAdminDashboardDataLoadersParams {
  contentCacheScope: string | null;
  coreDataScope: AdminCoreDataScope;
  data: ControllerDashboardData;
  enabled: boolean;
  hasLoadedContentData: boolean;
  loadedCoreDataScope: AdminCoreDataScope;
  reportList: SafetyReportListItem[];
  setData: React.Dispatch<React.SetStateAction<ControllerDashboardData>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setHasLoadedContentData: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadedCoreDataScope: React.Dispatch<React.SetStateAction<AdminCoreDataScope>>;
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
  coreDataScope,
  data,
  enabled,
  hasLoadedContentData,
  loadedCoreDataScope,
  reportList,
  setData,
  setError,
  setHasLoadedContentData,
  setLoadedCoreDataScope,
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
        !force && contentCacheScope
          ? readAdminSessionCache<SafetyContentItemListItem[]>(
              contentCacheScope,
              ADMIN_DASHBOARD_BOOTSTRAP_CONTENT_LIST_CACHE_KEY,
            ).value
          : null;
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
        const contentItems = await fetchSafetyContentItemsAdmin(token, { includeBody: false });
        if (contentCacheScope) {
          writeAdminSessionCache(
            contentCacheScope,
            ADMIN_DASHBOARD_BOOTSTRAP_CONTENT_LIST_CACHE_KEY,
            contentItems,
          );
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
          ? readAdminSessionCache<SafetyReportListItem[]>(
              contentCacheScope,
              ADMIN_DASHBOARD_BOOTSTRAP_REPORT_LIST_CACHE_KEY,
            )
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
        writeAdminSessionCache(
          contentCacheScope,
          ADMIN_DASHBOARD_BOOTSTRAP_REPORT_LIST_CACHE_KEY,
          visibleReports,
        );
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        setIsReportsLoading(false);
      }
    },
    [contentCacheScope, data.headquarters, data.sites, enabled, getToken, setError, setIsReportsLoading, setReportList],
  );
  const reload = useCallback(
    async (options?: {
      coreDataScope?: AdminCoreDataScope;
      includeContent?: boolean;
      includeReports?: boolean;
      force?: boolean;
    }) => {
      if (!enabled) return;

      const requestedScope = options?.coreDataScope ?? coreDataScope;
      if (requestedScope === 'none') {
        const followUpTasks: Array<Promise<void>> = [];
        if (options?.includeReports) {
          followUpTasks.push(loadReports({ force: options?.force }));
        }
        if (options?.includeContent) {
          followUpTasks.push(reloadContent({ force: options?.force }));
        }
        if (followUpTasks.length > 0) {
          await Promise.all(followUpTasks);
        }
        return;
      }

      const cachedSites =
        !options?.force && contentCacheScope
          ? readAdminSessionCache<ControllerDashboardData['sites']>(
              contentCacheScope,
              ADMIN_DASHBOARD_BOOTSTRAP_SITES_CACHE_KEY,
            )
          : { isFresh: false, value: null };
      const cachedMailboxDirectory =
        requestedScope === 'mailbox' && !options?.force && contentCacheScope
          ? readAdminSessionCache<MailboxDirectoryData>(
              contentCacheScope,
              ADMIN_DASHBOARD_BOOTSTRAP_MAILBOX_DIRECTORY_CACHE_KEY,
            )
          : { isFresh: false, value: null };

      if (requestedScope === 'sites' && cachedSites.value) {
        setData((current) => ({ ...current, sites: cachedSites.value ?? current.sites }));
        setLoadedCoreDataScope((current) => mergeLoadedCoreDataScope(current, 'sites'));
      }
      if (requestedScope === 'mailbox' && cachedMailboxDirectory.value) {
        setData((current) => ({
          ...current,
          headquarters: cachedMailboxDirectory.value?.headquarters ?? current.headquarters,
          sites: cachedMailboxDirectory.value?.sites ?? current.sites,
        }));
        setLoadedCoreDataScope((current) => mergeLoadedCoreDataScope(current, 'mailbox'));
      }

      if (
        (requestedScope === 'sites' && cachedSites.isFresh && cachedSites.value) ||
        (requestedScope === 'mailbox' &&
          cachedMailboxDirectory.isFresh &&
          cachedMailboxDirectory.value)
      ) {
        if (options?.includeReports && requestedScope === 'mailbox') {
          void loadReports({
            force: false,
            headquarters: cachedMailboxDirectory.value?.headquarters,
            sites: cachedMailboxDirectory.value?.sites,
          });
        }
        if (options?.includeContent) {
          void reloadContent({ force: false });
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = getToken();
        const directory =
          requestedScope === 'mailbox'
            ? await fetchMailboxDirectory(token)
            : { headquarters: data.headquarters, sites: await fetchAdminSitesDirectory(token) };

        setData((current) => ({
          ...current,
          ...(requestedScope === 'mailbox' ? { headquarters: directory.headquarters } : {}),
          sites: directory.sites,
        }));
        writeAdminSessionCache(
          contentCacheScope,
          ADMIN_DASHBOARD_BOOTSTRAP_SITES_CACHE_KEY,
          directory.sites,
        );
        if (requestedScope === 'mailbox') {
          writeAdminSessionCache(
            contentCacheScope,
            ADMIN_DASHBOARD_BOOTSTRAP_MAILBOX_DIRECTORY_CACHE_KEY,
            directory,
          );
        }

        const followUpTasks: Array<Promise<void>> = [];
        if (options?.includeReports) {
          followUpTasks.push(
            loadReports({
              force: options?.force,
              headquarters: directory.headquarters,
              sites: directory.sites,
            }),
          );
        }
        if (options?.includeContent) followUpTasks.push(reloadContent({ force: options?.force }));
        if (followUpTasks.length > 0) {
          await Promise.all(followUpTasks);
        }
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        setLoadedCoreDataScope((current) => mergeLoadedCoreDataScope(current, requestedScope));
        setIsLoading(false);
      }
    },
    [
      contentCacheScope,
      coreDataScope,
      data.headquarters,
      enabled,
      getToken,
      loadReports,
      reloadContent,
      setData,
      setError,
      setIsLoading,
      setLoadedCoreDataScope,
    ],
  );
  useEffect(() => {
    if (
      enabled &&
      shouldLoadCoreData &&
      !isCoreDataScopeLoaded(loadedCoreDataScope, coreDataScope)
    ) {
      void reload({ coreDataScope, includeReports: shouldLoadReports });
    }
  }, [
    coreDataScope,
    enabled,
    loadedCoreDataScope,
    reload,
    shouldLoadCoreData,
    shouldLoadReports,
  ]);
  useEffect(() => {
    if (!enabled || !shouldLoadContent) return;
    void reloadContent();
  }, [enabled, reloadContent, shouldLoadContent]);
  useEffect(() => {
    if (!enabled || !shouldLoadReports) return;
    if (shouldLoadCoreData && !isCoreDataScopeLoaded(loadedCoreDataScope, 'mailbox')) return;
    if (reportList.length > 0) return;
    void loadReports();
  }, [
    enabled,
    loadReports,
    loadedCoreDataScope,
    reportList.length,
    shouldLoadCoreData,
    shouldLoadReports,
  ]);
  return { getToken, loadReports, reload, reloadContent };
}
