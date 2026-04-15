'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isAdminUserRole } from '@/lib/admin';
import { fetchAdminSitesList } from '@/lib/admin/apiClient';
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
  const { currentUser, isAuthenticated, isReady, sites } = useInspectionSessions();
  const decodedSiteKey = siteKey ? decodeURIComponent(siteKey) : '';
  const contextSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const [fetchState, setFetchState] = useState<SiteFetchState>(EMPTY_FETCH_STATE);

  useEffect(() => {
    if (contextSite || !decodedSiteKey || !isReady || !isAuthenticated || !isAdminView) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setFetchState({
          site: null,
          siteKey: decodedSiteKey,
          status: 'loading',
        });
      }
    });

    void fetchAdminSitesList({ limit: 1, offset: 0, siteId: decodedSiteKey })
      .then((response) => {
        if (cancelled) return;
        const matchedSite = response.rows.find((site) => site.id === decodedSiteKey) ?? null;
        setFetchState({
          site: matchedSite ? mapSafetySiteToInspectionSite(matchedSite) : null,
          siteKey: decodedSiteKey,
          status: 'resolved',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFetchState({
          site: null,
          siteKey: decodedSiteKey,
          status: 'resolved',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [contextSite, decodedSiteKey, isAdminView, isAuthenticated, isReady]);

  const fallbackSite =
    !contextSite && fetchState.siteKey === decodedSiteKey ? fetchState.site : null;
  const shouldAttemptAdminFallback = Boolean(
    !contextSite && decodedSiteKey && isReady && isAuthenticated && isAdminView,
  );
  const isResolvingSite =
    shouldAttemptAdminFallback &&
    (fetchState.siteKey !== decodedSiteKey || fetchState.status === 'loading');

  return {
    currentSite: contextSite ?? fallbackSite,
    isResolvingSite,
  };
}
