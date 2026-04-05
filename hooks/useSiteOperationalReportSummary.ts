'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchSafetyReportList,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import { normalizeQuarterlyReportPeriod } from '@/lib/erpReports/shared';
import type { InspectionSite } from '@/types/inspectionSession';

const OPERATIONAL_REPORT_SUMMARY_CACHE_TTL_MS = 60_000;

interface QuarterlyReportPeriodSummary {
  periodStartDate: string;
  periodEndDate: string;
  quarterKey: string;
  year: number;
  quarter: number;
}

interface SiteOperationalReportSummaryCacheEntry {
  quarterlyPeriods: QuarterlyReportPeriodSummary[];
  fetchedAt: number;
}

const summaryCache = new Map<string, SiteOperationalReportSummaryCacheEntry>();
const summaryRequests = new Map<string, Promise<SiteOperationalReportSummaryCacheEntry>>();

function getExpiredLoginMessage() {
  return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
}

function getErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '운영 보고서 요약을 불러오는 중 오류가 발생했습니다.';
}

function getCachedSummary(siteId: string | null | undefined) {
  if (!siteId) {
    return null;
  }

  return summaryCache.get(siteId) ?? null;
}

function isFresh(cacheEntry: SiteOperationalReportSummaryCacheEntry | null) {
  return Boolean(
    cacheEntry &&
      Date.now() - cacheEntry.fetchedAt < OPERATIONAL_REPORT_SUMMARY_CACHE_TTL_MS,
  );
}

async function fetchAndCacheSummary(
  token: string,
  siteId: string,
): Promise<SiteOperationalReportSummaryCacheEntry> {
  const inflight = summaryRequests.get(siteId);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const reports = await fetchSafetyReportList(token, {
      siteId,
      limit: 200,
      reportKinds: ['quarterly_summary'],
    });
    const quarterlyPeriods = reports
      .map((report) =>
        normalizeQuarterlyReportPeriod({
          periodStartDate:
            typeof report.meta?.periodStartDate === 'string'
              ? report.meta.periodStartDate
              : '',
          periodEndDate:
            typeof report.meta?.periodEndDate === 'string'
              ? report.meta.periodEndDate
              : '',
          quarterKey:
            typeof report.meta?.quarterKey === 'string' ? report.meta.quarterKey : '',
          year: typeof report.meta?.year === 'number' ? report.meta.year : 0,
          quarter: typeof report.meta?.quarter === 'number' ? report.meta.quarter : 0,
        }),
      )
      .filter((report) => Boolean(report.quarterKey));

    const nextCache = {
      quarterlyPeriods,
      fetchedAt: Date.now(),
    };
    summaryCache.set(siteId, nextCache);
    return nextCache;
  })().finally(() => {
    summaryRequests.delete(siteId);
  });

  summaryRequests.set(siteId, request);
  return request;
}

export function useSiteOperationalReportSummary(
  site: InspectionSite | null,
  enabled = true,
) {
  const [quarterlyPeriods, setQuarterlyPeriods] = useState<QuarterlyReportPeriodSummary[]>(
    () => getCachedSummary(site?.id)?.quarterlyPeriods ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cache = getCachedSummary(site?.id);
    if (!site) {
      queueMicrotask(() => {
        setQuarterlyPeriods([]);
        setError(null);
      });
      return;
    }

    if (!cache) {
      queueMicrotask(() => {
        setQuarterlyPeriods([]);
      });
      return;
    }

    queueMicrotask(() => {
      setQuarterlyPeriods(cache.quarterlyPeriods);
    });
  }, [site]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!site) {
      queueMicrotask(() => {
        setQuarterlyPeriods([]);
        setIsLoading(false);
        setError(null);
      });
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      queueMicrotask(() => {
        setQuarterlyPeriods([]);
        setIsLoading(false);
        setError(getExpiredLoginMessage());
      });
      return;
    }

    const cachedSummary = getCachedSummary(site.id);
    if (cachedSummary) {
      queueMicrotask(() => {
        setQuarterlyPeriods(cachedSummary.quarterlyPeriods);
      });
      if (isFresh(cachedSummary)) {
        queueMicrotask(() => {
          setIsLoading(false);
          setError(null);
        });
        return;
      }
    }

    let cancelled = false;
    queueMicrotask(() => {
      setIsLoading(!cachedSummary);
      setError(null);
    });

    void fetchAndCacheSummary(token, site.id)
      .then((nextCache) => {
        if (cancelled) {
          return;
        }

        setQuarterlyPeriods(nextCache.quarterlyPeriods);
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, site]);

  const completedQuarterKeys = useMemo(
    () => new Set(quarterlyPeriods.map((report) => report.quarterKey).filter(Boolean)),
    [quarterlyPeriods],
  );

  return {
    quarterlyPeriods,
    completedQuarterKeys,
    isLoading,
    error,
  };
}
