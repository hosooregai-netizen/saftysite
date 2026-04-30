'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  readEnumParam,
  readStringParam,
  useUrlQueryUpdater,
} from '@/hooks/useUrlQueryState';
import {
  consumePendingPostLoginRedirect,
} from '@/lib/auth/postLoginRedirect';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  fetchAssignedSafetyHeadquarters,
  readSafetyAuthToken,
} from '@/lib/safetyApi';
import {
  buildHomeSiteSummaries,
  type HomeSiteSummary,
} from '@/features/home/lib/buildHomeSiteSummaries';
import type { SafetyAssignedHeadquarterSummary } from '@/types/backend';

export type HomeSortMode = 'recent' | 'name' | 'reports';

const HOME_REPORT_INDEX_PREFETCH_DELAY_MS = 400;
const HOME_LIST_QUERY_DEFAULTS = {
  query: '',
  sort: 'recent',
};

export function getPendingHomeReportIndexSiteIds(
  siteSummaries: HomeSiteSummary[],
  prefetchedSiteIds: ReadonlySet<string>,
) {
  return siteSummaries
    .map((summary) => summary.site.id)
    .filter((siteId) => !prefetchedSiteIds.has(siteId));
}

export function resolveHomePostAuthRedirect({
  isControllerView,
  pendingRedirect,
}: {
  isControllerView: boolean;
  pendingRedirect: string | null;
}) {
  if (pendingRedirect) {
    return pendingRedirect;
  }

  if (isControllerView) {
    return getAdminSectionHref('overview');
  }

  return null;
}

interface HomeScreenState {
  assignedHeadquarters: SafetyAssignedHeadquarterSummary[];
  authError: string | null;
  currentUserName?: string;
  currentUserPosition?: string | null;
  dataError: string | null;
  filteredSiteSummaries: HomeSiteSummary[];
  headquarterError: string | null;
  isHeadquarterLoading: boolean;
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
    hasAuthToken,
    isReady,
    isHydrating,
    currentUser,
    authError,
    dataError,
    getReportIndexBySiteId,
    login,
    logout,
    ensureSiteReportIndexLoaded,
  } = useInspectionSessions();
  const searchParams = useSearchParams();
  const updateUrlQuery = useUrlQueryUpdater();
  const urlQuery = readStringParam(searchParams, 'query');
  const urlSortMode = readEnumParam(
    searchParams,
    'sort',
    ['recent', 'name', 'reports'] as const,
    'recent',
  );
  const [query, setQueryState] = useState(urlQuery);
  const [sortMode, setSortModeState] = useState<HomeSortMode>(urlSortMode);
  const [assignedHeadquarters, setAssignedHeadquarters] = useState<
    SafetyAssignedHeadquarterSummary[]
  >([]);
  const [isHeadquarterLoading, setIsHeadquarterLoading] = useState(false);
  const [headquarterError, setHeadquarterError] = useState<string | null>(null);
  const prefetchedSiteIdsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const deferredQuery = useDeferredValue(query);
  const reportIndexBySiteId = useMemo(
    () =>
      Object.fromEntries(
        sites.map((site) => [site.id, getReportIndexBySiteId(site.id)]),
      ),
    [getReportIndexBySiteId, sites],
  );
  const siteSummaries = useMemo(
    () => buildHomeSiteSummaries(sites, reportIndexBySiteId),
    [reportIndexBySiteId, sites],
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
        return right.reportCount - left.reportCount || right.sortTime - left.sortTime;
      }

      return right.sortTime - left.sortTime;
    });
  }, [deferredQuery, siteSummaries, sortMode]);
  const isControllerView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const isInitialHydration =
    (isHydrating || (hasAuthToken && !currentUser)) && siteSummaries.length === 0;
  const shouldShowLogin = !hasAuthToken && !currentUser;

  useEffect(() => {
    setQueryState(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSortModeState(urlSortMode);
  }, [urlSortMode]);

  useEffect(() => {
    if (!hasAuthToken || sites.length === 0) {
      prefetchedSiteIdsRef.current.clear();
    }
  }, [hasAuthToken, sites.length]);

  useEffect(() => {
    if (!isReady || !hasAuthToken || isHydrating || isControllerView) {
      setAssignedHeadquarters([]);
      setIsHeadquarterLoading(false);
      setHeadquarterError(null);
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      setAssignedHeadquarters([]);
      setHeadquarterError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    let cancelled = false;
    setIsHeadquarterLoading(true);
    setHeadquarterError(null);

    void fetchAssignedSafetyHeadquarters(token)
      .then((headquarters) => {
        if (cancelled) return;
        setAssignedHeadquarters(headquarters);
      })
      .catch((error) => {
        if (cancelled) return;
        setAssignedHeadquarters([]);
        setHeadquarterError(
          error instanceof Error
            ? error.message
            : '배정된 건설사 정보를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsHeadquarterLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasAuthToken, isControllerView, isHydrating, isReady]);

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

    const nextSiteIds = getPendingHomeReportIndexSiteIds(
      siteSummaries,
      prefetchedSiteIdsRef.current,
    );

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
    if (!currentUser) return;

    const nextRedirect = resolveHomePostAuthRedirect({
      isControllerView,
      pendingRedirect: consumePendingPostLoginRedirect(),
    });
    if (nextRedirect) {
      router.replace(nextRedirect);
    }
  }, [currentUser, isControllerView, router]);

  return {
    assignedHeadquarters,
    authError,
    currentUserName: currentUser?.name,
    currentUserPosition: currentUser?.position,
    dataError,
    filteredSiteSummaries,
    headquarterError,
    isHeadquarterLoading,
    isControllerView,
    isInitialHydration,
    login,
    logout,
    query,
    setQuery: (value: string) => {
      setQueryState(value);
      updateUrlQuery({ query: value }, HOME_LIST_QUERY_DEFAULTS);
    },
    shouldShowLogin,
    siteSummaries,
    sortMode,
    setSortMode: (value: HomeSortMode) => {
      setSortModeState(value);
      updateUrlQuery({ sort: value }, HOME_LIST_QUERY_DEFAULTS);
    },
  };
}
