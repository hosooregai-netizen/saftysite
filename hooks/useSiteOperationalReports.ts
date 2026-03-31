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

export function useSiteOperationalReports(site: InspectionSite | null, enabled = true) {
  const [quarterlyReports, setQuarterlyReports] = useState<QuarterlySummaryReport[]>([]);
  const [badWorkplaceReports, setBadWorkplaceReports] = useState<BadWorkplaceReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

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

    setIsLoading(true);
    setError(null);

    try {
      const reports = await fetchSafetyReportsBySite(token, site.id);
      const nextQuarterly: QuarterlySummaryReport[] = [];
      const nextBadWorkplace: BadWorkplaceReport[] = [];

      reports.forEach((report) => {
        const quarterlyReport = mapSafetyReportToQuarterlySummaryReport(report);
        if (quarterlyReport) {
          nextQuarterly.push(quarterlyReport);
        }

        const badWorkplaceReport = mapSafetyReportToBadWorkplaceReport(report);
        if (badWorkplaceReport) {
          nextBadWorkplace.push(badWorkplaceReport);
        }
      });

      nextQuarterly.sort((left, right) => {
        const timeDelta = getQuarterlyReportSortTime(right) - getQuarterlyReportSortTime(left);
        if (timeDelta !== 0) return timeDelta;
        return right.createdAt.localeCompare(left.createdAt);
      });
      nextBadWorkplace.sort((left, right) => right.reportMonth.localeCompare(left.reportMonth));

      setQuarterlyReports(nextQuarterly);
      setBadWorkplaceReports(nextBadWorkplace);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, site]);

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
        await reload();
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
        await reload();
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
        await reload();
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
