'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  archiveSafetyReportByKey,
  fetchSafetyReportsBySite,
  readSafetyAuthToken,
  SafetyApiError,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import {
  buildBadWorkplaceUpsertInput,
  buildQuarterlySummaryUpsertInput,
  mapSafetyReportToBadWorkplaceReport,
  mapSafetyReportToQuarterlySummaryReport,
} from '@/lib/erpReports/mappers';
import type { BadWorkplaceReport, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

const OPERATIONAL_REPORTS_CACHE_TTL_MS = 60_000;

interface SiteOperationalReportsCacheEntry {
  quarterlyReports: QuarterlySummaryReport[];
  badWorkplaceReports: BadWorkplaceReport[];
  fetchedAt: number;
}

const siteOperationalReportsCache = new Map<string, SiteOperationalReportsCacheEntry>();
const siteOperationalReportsRequests = new Map<
  string,
  Promise<SiteOperationalReportsCacheEntry>
>();

function getErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '운영 보고서를 불러오는 중 오류가 발생했습니다.';
}

function getExpiredLoginMessage() {
  return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
}

function getQuarterlyReportSortTime(report: QuarterlySummaryReport) {
  const value = report.updatedAt || report.lastCalculatedAt || report.createdAt;
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getCachedOperationalReports(siteId: string | null | undefined) {
  if (!siteId) {
    return null;
  }

  return siteOperationalReportsCache.get(siteId) ?? null;
}

function isOperationalReportsCacheFresh(cache: SiteOperationalReportsCacheEntry | null) {
  return Boolean(cache && Date.now() - cache.fetchedAt < OPERATIONAL_REPORTS_CACHE_TTL_MS);
}

async function fetchAndCacheOperationalReports(
  token: string,
  siteId: string,
): Promise<SiteOperationalReportsCacheEntry> {
  const inFlightRequest = siteOperationalReportsRequests.get(siteId);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async () => {
    const reports = await fetchSafetyReportsBySite(token, siteId, {
      reportKinds: ['quarterly_summary', 'bad_workplace'],
    });
    const quarterlyReports: QuarterlySummaryReport[] = [];
    const badWorkplaceReports: BadWorkplaceReport[] = [];

    reports.forEach((report) => {
      const quarterlyReport = mapSafetyReportToQuarterlySummaryReport(report);
      if (quarterlyReport) {
        quarterlyReports.push(quarterlyReport);
      }

      const badWorkplaceReport = mapSafetyReportToBadWorkplaceReport(report);
      if (badWorkplaceReport) {
        badWorkplaceReports.push(badWorkplaceReport);
      }
    });

    quarterlyReports.sort((left, right) => {
      const timeDelta = getQuarterlyReportSortTime(right) - getQuarterlyReportSortTime(left);
      if (timeDelta !== 0) return timeDelta;
      return right.createdAt.localeCompare(left.createdAt);
    });
    badWorkplaceReports.sort((left, right) => right.reportMonth.localeCompare(left.reportMonth));

    const nextCache: SiteOperationalReportsCacheEntry = {
      quarterlyReports,
      badWorkplaceReports,
      fetchedAt: Date.now(),
    };
    siteOperationalReportsCache.set(siteId, nextCache);
    return nextCache;
  })().finally(() => {
    siteOperationalReportsRequests.delete(siteId);
  });

  siteOperationalReportsRequests.set(siteId, request);
  return request;
}

export function useSiteOperationalReports(site: InspectionSite | null, enabled = true) {
  const [quarterlyReports, setQuarterlyReports] = useState<QuarterlySummaryReport[]>(
    () => getCachedOperationalReports(site?.id)?.quarterlyReports ?? [],
  );
  const [badWorkplaceReports, setBadWorkplaceReports] = useState<BadWorkplaceReport[]>(
    () => getCachedOperationalReports(site?.id)?.badWorkplaceReports ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cache = getCachedOperationalReports(site?.id);
    if (!site || !cache) {
      if (!site) {
        setQuarterlyReports([]);
        setBadWorkplaceReports([]);
      }
      return;
    }

    setQuarterlyReports(cache.quarterlyReports);
    setBadWorkplaceReports(cache.badWorkplaceReports);
  }, [site]);

  const reload = useCallback(async (options?: { force?: boolean }) => {
    if (!site) {
      setQuarterlyReports([]);
      setBadWorkplaceReports([]);
      setError(null);
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      setQuarterlyReports([]);
      setBadWorkplaceReports([]);
      setError(getExpiredLoginMessage());
      return;
    }

    const cachedReports = getCachedOperationalReports(site.id);
    if (cachedReports) {
      setQuarterlyReports(cachedReports.quarterlyReports);
      setBadWorkplaceReports(cachedReports.badWorkplaceReports);
    }

    if (!options?.force && isOperationalReportsCacheFresh(cachedReports)) {
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(!cachedReports);
    setError(null);

    try {
      const nextCache = await fetchAndCacheOperationalReports(token, site.id);
      setQuarterlyReports(nextCache.quarterlyReports);
      setBadWorkplaceReports(nextCache.badWorkplaceReports);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [site]);

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, reload]);

  const saveQuarterlyReport = useCallback(
    async (report: QuarterlySummaryReport) => {
      if (!site) return;
      const token = readSafetyAuthToken();
      if (!token) throw new SafetyApiError(getExpiredLoginMessage(), 401);

      setIsSaving(true);
      setError(null);
      try {
        await upsertSafetyReport(token, buildQuarterlySummaryUpsertInput(report, site));
        await reload({ force: true });
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [reload, site],
  );

  const saveBadWorkplaceReport = useCallback(
    async (report: BadWorkplaceReport) => {
      if (!site) return;
      const token = readSafetyAuthToken();
      if (!token) throw new SafetyApiError(getExpiredLoginMessage(), 401);

      setIsSaving(true);
      setError(null);
      try {
        await upsertSafetyReport(token, buildBadWorkplaceUpsertInput(report, site));
        await reload({ force: true });
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [reload, site],
  );

  const deleteOperationalReport = useCallback(
    async (reportId: string) => {
      if (!site) return;
      const token = readSafetyAuthToken();
      if (!token) {
        throw new SafetyApiError(getExpiredLoginMessage(), 401);
      }

      setIsSaving(true);
      setError(null);
      try {
        await archiveSafetyReportByKey(token, reportId);
        await reload({ force: true });
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [reload, site],
  );

  return {
    quarterlyReports,
    badWorkplaceReports,
    isLoading,
    isSaving,
    error,
    reload,
    saveQuarterlyReport,
    saveBadWorkplaceReport,
    deleteOperationalReport,
  };
}
