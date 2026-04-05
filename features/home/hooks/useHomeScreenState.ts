'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  buildHomeSiteSummaries,
  type HomeSiteSummary,
} from '@/features/home/lib/buildHomeSiteSummaries';

export type HomeSortMode = 'recent' | 'name' | 'reports';

const HOME_REPORT_INDEX_PREFETCH_LIMIT = 2;
const HOME_REPORT_INDEX_PREFETCH_DELAY_MS = 400;

interface HomeScreenState {
  authError: string | null;
  currentUserName?: string;
  currentUserPosition?: string | null;
  dataError: string | null;
  filteredSiteSummaries: HomeSiteSummary[];
  isControllerView: boolean;
  isInitialHydration: boolean;
  login: ReturnType<typeof useInspectionSessions>['login'];
  logout: ReturnType<typeof useInspectionSessions>['logout'];
  query: string;
  setQuery: (value: string) => void;
  shouldShowLogin: boolean;
  siteSummaries: HomeSiteSummary[];
  sortMode: HomeSortMode;
  setSortMode: (value: HomeSortMode) => void;
}

export function useHomeScreenState(): HomeScreenState {
  const {
    sites,
    sessions,
    hasAuthToken,
    isReady,
    isHydrating,
    currentUser,
    authError,
    dataError,
    login,
    logout,
    ensureSiteReportIndexLoaded,
  } = useInspectionSessions();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<HomeSortMode>('recent');
  const prefetchedSiteIdsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const deferredQuery = useDeferredValue(query);
  const siteSummaries = useMemo(
    () => buildHomeSiteSummaries(sites, sessions),
    [sessions, sites],
  );
  const filteredSiteSummaries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const filtered = !normalizedQuery
      ? siteSummaries
      : siteSummaries.filter(({ site }) =>
          [site.customerName, site.siteName, site.assigneeName]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        );

    return [...filtered].sort((left, right) => {
      if (sortMode === 'name') {
        return left.site.siteName.localeCompare(right.site.siteName, 'ko');
      }

      if (sortMode === 'reports') {
        return right.sessionCount - left.sessionCount || right.sortTime - left.sortTime;
      }

      return right.sortTime - left.sortTime;
    });
  }, [deferredQuery, siteSummaries, sortMode]);
  const isControllerView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const isInitialHydration =
    (isHydrating || (hasAuthToken && !currentUser)) && siteSummaries.length === 0;
  const shouldShowLogin = !hasAuthToken && !currentUser;

  useEffect(() => {
    if (
      !isReady ||
      !hasAuthToken ||
      isHydrating ||
      isControllerView ||
      siteSummaries.length === 0
    ) {
      return;
    }

    const nextSiteIds = siteSummaries
      .slice(0, HOME_REPORT_INDEX_PREFETCH_LIMIT)
      .map((summary) => summary.site.id)
      .filter((siteId) => !prefetchedSiteIdsRef.current.has(siteId));

    if (nextSiteIds.length === 0) {
      return;
    }

    let cancelled = false;
    const runPrefetch = () => {
      void (async () => {
        for (const siteId of nextSiteIds) {
          if (cancelled) {
            return;
          }

          prefetchedSiteIdsRef.current.add(siteId);

          try {
            await ensureSiteReportIndexLoaded(siteId);
          } catch {
            prefetchedSiteIdsRef.current.delete(siteId);
          }
        }
      })();
    };

    const idleApi = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleApi.requestIdleCallback === 'function') {
      const handle = idleApi.requestIdleCallback(
        () => {
          runPrefetch();
        },
        { timeout: HOME_REPORT_INDEX_PREFETCH_DELAY_MS },
      );

      return () => {
        cancelled = true;
        idleApi.cancelIdleCallback?.(handle);
      };
    }

    const timeoutId = window.setTimeout(runPrefetch, HOME_REPORT_INDEX_PREFETCH_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    ensureSiteReportIndexLoaded,
    hasAuthToken,
    isControllerView,
    isHydrating,
    isReady,
    siteSummaries,
  ]);

  useEffect(() => {
    if (currentUser && isControllerView) {
      router.replace(getAdminSectionHref('headquarters'));
    }
  }, [currentUser, isControllerView, router]);

  return {
    authError,
    currentUserName: currentUser?.name,
    currentUserPosition: currentUser?.position,
    dataError,
    filteredSiteSummaries,
    isControllerView,
    isInitialHydration,
    login,
    logout,
    query,
    setQuery,
    shouldShowLogin,
    siteSummaries,
    sortMode,
    setSortMode,
  };
}
