'use client';

import { useCallback, useEffect, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  fetchAndCacheOperationalReportIndex,
  getCachedOperationalReportIndex,
  hydrateOperationalReportIndexOwner,
  subscribeOperationalReportIndex,
  type SiteOperationalReportIndexCacheEntry,
} from '@/lib/operationalReportIndexCache';
import {
  getReportCacheFreshness,
  shouldSurfaceCacheError,
  shouldUseBlockingReload,
} from '@/lib/reportCachePolicy';
import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { InspectionSite } from '@/types/inspectionSession';

function getExpiredLoginMessage() {
  return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
}

function getErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '운영 보고서 목록을 불러오는 중 오류가 발생했습니다.';
}

export function useSiteOperationalReportIndex(
  site: InspectionSite | null,
  enabled = true,
) {
  const { currentUser, isAuthenticated, isReady } = useInspectionSessions();
  const ownerId = currentUser?.id?.trim() || '';
  const siteId = site?.id ?? '';
  const [cacheEntry, setCacheEntry] = useState<SiteOperationalReportIndexCacheEntry | null>(
    () => getCachedOperationalReportIndex(ownerId, siteId),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId || !siteId) {
      setCacheEntry(null);
      return;
    }

    let cancelled = false;
    const unsubscribe = subscribeOperationalReportIndex(ownerId, siteId, (nextEntry) => {
      if (!cancelled) {
        setCacheEntry(nextEntry);
      }
    });

    void hydrateOperationalReportIndexOwner(ownerId).then(() => {
      if (!cancelled) {
        setCacheEntry(getCachedOperationalReportIndex(ownerId, siteId));
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [ownerId, siteId]);

  const reload = useCallback(
    async (options?: { force?: boolean }) => {
      if (!site) {
        setCacheEntry(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!ownerId || !isAuthenticated || !isReady) {
        setCacheEntry(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      const token = readSafetyAuthToken();
      if (!token) {
        setIsLoading(false);
        setError(getExpiredLoginMessage());
        return;
      }

      await hydrateOperationalReportIndexOwner(ownerId);

      const cachedEntry = getCachedOperationalReportIndex(ownerId, site.id);
      if (cachedEntry) {
        setCacheEntry(cachedEntry);
      }

      const freshness = getReportCacheFreshness(cachedEntry?.fetchedAt);
      if (!options?.force && cachedEntry && freshness === 'fresh') {
        setIsLoading(false);
        setError(null);
        return;
      }

      const shouldBlock = shouldUseBlockingReload({
        force: options?.force,
        freshness,
        hasVisibleData: Boolean(cachedEntry),
      });
      setIsLoading(shouldBlock);
      if (shouldBlock) {
        setError(null);
      }

      try {
        const nextEntry = await fetchAndCacheOperationalReportIndex(token, ownerId, site.id, {
          force: options?.force,
        });
        setCacheEntry(nextEntry);
        setError(null);
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        if (
          shouldBlock ||
          !cachedEntry ||
          options?.force ||
          shouldSurfaceCacheError({
            force: options?.force,
            hasVisibleData: Boolean(cachedEntry),
          })
        ) {
          setError(message);
        } else {
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, isReady, ownerId, site],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!site || !isReady || !isAuthenticated || !ownerId) {
      if (!site || !ownerId) {
        setCacheEntry(null);
        setError(null);
        setIsLoading(false);
      }
      return;
    }

    void reload();
  }, [enabled, isAuthenticated, isReady, ownerId, reload, site]);

  return {
    quarterlyReports: cacheEntry?.quarterlyReports ?? [],
    badWorkplaceReports: cacheEntry?.badWorkplaceReports ?? [],
    isLoading,
    error,
    reload,
  };
}
