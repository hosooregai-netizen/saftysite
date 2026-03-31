'use client';

import { useCallback, useEffect, useState } from 'react';
import {
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
      setError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
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

      nextQuarterly.sort((left, right) => right.quarterKey.localeCompare(left.quarterKey));
      nextBadWorkplace.sort((left, right) => right.reportMonth.localeCompare(left.reportMonth));

      setQuarterlyReports(nextQuarterly);
      setBadWorkplaceReports(nextBadWorkplace);
    } catch (error) {
      setError(getErrorMessage(error));
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
      if (!token) throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);

      setIsSaving(true);
      setError(null);
      try {
        await upsertSafetyReport(token, buildQuarterlySummaryUpsertInput(report, site));
        await reload();
      } catch (error) {
        const message = getErrorMessage(error);
        setError(message);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [reload, site]
  );

  const saveBadWorkplaceReport = useCallback(
    async (report: BadWorkplaceReport) => {
      if (!site) return;
      const token = readSafetyAuthToken();
      if (!token) throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);

      setIsSaving(true);
      setError(null);
      try {
        await upsertSafetyReport(token, buildBadWorkplaceUpsertInput(report, site));
        await reload();
      } catch (error) {
        const message = getErrorMessage(error);
        setError(message);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [reload, site]
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
  };
}
