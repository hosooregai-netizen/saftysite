'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { fetchAdminSite } from '@/lib/admin/apiClient';
import { isAdminUserRole } from '@/lib/admin';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers';
import type { InspectionSite } from '@/types/inspectionSession';

interface SiteFetchState {
  site: InspectionSite | null;
  siteKey: string;
  status: 'idle' | 'loading' | 'resolved';
}

interface UseResolvedSiteRouteResult {
  currentSite: InspectionSite | null;
  isResolvingSite: boolean;
}

const EMPTY_FETCH_STATE: SiteFetchState = {
  site: null,
  siteKey: '',
  status: 'idle',
};

export function useResolvedSiteRoute(siteKey: string | null): UseResolvedSiteRouteResult {
  const { currentUser, ensureAssignedSafetySite, isAuthenticated, isReady, sites } =
    useInspectionSessions();
  const decodedSiteKey = siteKey ? decodeURIComponent(siteKey) : '';
  const contextSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const [fetchState, setFetchState] = useState<SiteFetchState>(EMPTY_FETCH_STATE);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!decodedSiteKey || !isReady || !isAuthenticated) {
      requestIdRef.current += 1;
      queueMicrotask(() => {
        if (requestIdRef.current > 0) {
          setFetchState(EMPTY_FETCH_STATE);
        }
      });
      return;
    }

    if (
      fetchState.siteKey === decodedSiteKey &&
      (fetchState.status === 'loading' || fetchState.status === 'resolved')
    ) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    queueMicrotask(() => {
      if (requestIdRef.current !== requestId) return;
      setFetchState({
        site: null,
        siteKey: decodedSiteKey,
        status: 'loading',
      });
    });

    const resolver = isAdminView
      ? fetchAdminSite(decodedSiteKey).then((site) =>
          site ? mapSafetySiteToInspectionSite(site) : null,
        )
      : ensureAssignedSafetySite(decodedSiteKey).then((site) =>
          site ? mapSafetySiteToInspectionSite(site) : null,
        );

    void resolver
      .then((site) => {
        if (requestIdRef.current !== requestId) return;
        setFetchState({
          site,
          siteKey: decodedSiteKey,
          status: 'resolved',
        });
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setFetchState({
          site: null,
          siteKey: decodedSiteKey,
          status: 'resolved',
        });
      });
  }, [
    decodedSiteKey,
    fetchState.siteKey,
    fetchState.status,
    isAdminView,
    isAuthenticated,
    isReady,
    ensureAssignedSafetySite,
  ]);

  const resolvedAdminSite =
    fetchState.siteKey === decodedSiteKey && fetchState.status === 'resolved'
      ? fetchState.site
      : null;
  const shouldAttemptSiteResolve = Boolean(decodedSiteKey && isReady && isAuthenticated);
  const isResolvingSite =
    shouldAttemptSiteResolve &&
    (fetchState.siteKey !== decodedSiteKey || fetchState.status === 'loading');

  return {
    currentSite: resolvedAdminSite ?? contextSite,
    isResolvingSite,
  };
}
