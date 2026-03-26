'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isAdminUserRole } from '@/lib/admin';
import {
  buildHomeSiteSummaries,
  type HomeSiteSummary,
} from '@/features/home/lib/buildHomeSiteSummaries';

export type HomeSortMode = 'recent' | 'name' | 'reports';

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
  } = useInspectionSessions();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<HomeSortMode>('recent');
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
  const shouldShowLogin = isReady && !hasAuthToken && !currentUser;

  useEffect(() => {
    if (currentUser && isControllerView) {
      router.replace('/admin');
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

