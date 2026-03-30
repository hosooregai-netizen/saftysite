'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type { InspectionSite } from '@/types/inspectionSession';

export type SiteReportSortMode = 'recent' | 'name' | 'progress';

interface UseSiteReportListStateOptions {
  siteOverride?: InspectionSite | null;
}

export function useSiteReportListState(
  siteKey: string | null,
  options: UseSiteReportListStateOptions = {}
) {
  const router = useRouter();
  const decodedSiteKey = siteKey ? decodeURIComponent(siteKey) : null;
  const {
    sites,
    sessions,
    currentUser,
    createSession,
    deleteSession,
    ensureSiteReportsLoaded,
    canArchiveReports,
    isAuthenticated,
    isReady,
  } = useInspectionSessions();
  const [reportQuery, setReportQuery] = useState('');
  const [reportSortMode, setReportSortMode] = useState<SiteReportSortMode>('recent');
  const hasReloadedRef = useRef(false);
  const [isLoadingSiteReports, setIsLoadingSiteReports] = useState(false);
  const hasStoredSite = useMemo(
    () => Boolean(decodedSiteKey && sites.some((site) => site.id === decodedSiteKey)),
    [decodedSiteKey, sites],
  );

  useEffect(() => {
    hasReloadedRef.current = false;
  }, [decodedSiteKey]);

  useEffect(() => {
    if (!decodedSiteKey || !hasStoredSite || !isAuthenticated || !isReady || hasReloadedRef.current) {
      return;
    }

    hasReloadedRef.current = true;
    let cancelled = false;

    const loadSiteReports = async () => {
      setIsLoadingSiteReports(true);

      try {
        await ensureSiteReportsLoaded(decodedSiteKey);
      } finally {
        if (!cancelled) {
          setIsLoadingSiteReports(false);
        }
      }
    };

    void loadSiteReports();

    return () => {
      cancelled = true;
    };
  }, [decodedSiteKey, ensureSiteReportsLoaded, hasStoredSite, isAuthenticated, isReady]);

  const currentSite = useMemo(() => {
    if (!decodedSiteKey) return null;
    return sites.find((site) => site.id === decodedSiteKey) ?? options.siteOverride ?? null;
  }, [decodedSiteKey, options.siteOverride, sites]);

  const siteSessions = useMemo(
    () =>
      decodedSiteKey
        ? sessions.filter((session) => getSessionSiteKey(session) === decodedSiteKey)
        : [],
    [decodedSiteKey, sessions],
  );
  const deferredReportQuery = useDeferredValue(reportQuery);
  const assignedUserDisplay = [currentUser?.name, currentUser?.position]
    .filter(Boolean)
    .join(' / ');
  const filteredSiteSessions = useMemo(() => {
    const normalizedQuery = deferredReportQuery.trim().toLowerCase();
    const drafterFallback = assignedUserDisplay || currentSite?.assigneeName || '';

    const matchingSessions = !normalizedQuery
      ? siteSessions
      : siteSessions.filter((session) => {
          const title = getSessionTitle(session);
          const drafter = session.meta.drafter || drafterFallback;
          const haystack = [title, session.meta.reportDate || '', drafter, session.lastSavedAt || '']
            .join(' ')
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        });

    return [...matchingSessions].sort((left, right) => {
      if (reportSortMode === 'name') {
        return getSessionTitle(left).localeCompare(getSessionTitle(right), 'ko');
      }

      if (reportSortMode === 'progress') {
        const leftProgress = getSessionProgress(left);
        const rightProgress = getSessionProgress(right);

        return (
          rightProgress.percentage - leftProgress.percentage ||
          rightProgress.completed - leftProgress.completed ||
          getSessionTitle(left).localeCompare(getSessionTitle(right), 'ko')
        );
      }

      const leftSavedTime = left.lastSavedAt ? new Date(left.lastSavedAt).getTime() : 0;
      const rightSavedTime = right.lastSavedAt ? new Date(right.lastSavedAt).getTime() : 0;

      return rightSavedTime - leftSavedTime;
    });
  }, [
    assignedUserDisplay,
    currentSite?.assigneeName,
    deferredReportQuery,
    reportSortMode,
    siteSessions,
  ]);

  const createReport = () => {
    if (!currentSite) return;

    const nextSession = createSession(currentSite, {
      meta: {
        siteName: currentSite.siteName,
        drafter: currentUser?.name || currentSite.assigneeName,
      },
    });

    router.push(`/sessions/${nextSession.id}`);
  };

  return {
    assignedUserDisplay,
    canArchiveReports,
    createReport,
    currentSite,
    currentUser,
    deleteSession,
    filteredSiteSessions,
    isLoadingSiteReports,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
    siteSessions,
  };
}
