'use client';

import { useCallback, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  buildBadWorkplaceUpsertInput,
  buildQuarterlySummaryUpsertInput,
} from '@/lib/erpReports/mappers';
import { fetchAndCacheOperationalReportIndex } from '@/lib/operationalReportIndexCache';
import {
  archiveSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import type { BadWorkplaceReport, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

function getExpiredLoginMessage() {
  return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
}

function getErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '운영 보고서를 저장하는 중 오류가 발생했습니다.';
}

export function useSiteOperationalReportMutations(site: InspectionSite | null) {
  const { currentUser } = useInspectionSessions();
  const ownerId = currentUser?.id?.trim() || '';
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOperationalIndex = useCallback(
    async (token: string) => {
      if (!site || !ownerId) {
        return;
      }

      await fetchAndCacheOperationalReportIndex(token, ownerId, site.id, { force: true });
    },
    [ownerId, site],
  );

  const saveQuarterlyReport = useCallback(
    async (report: QuarterlySummaryReport) => {
      if (!site) {
        return;
      }

      const token = readSafetyAuthToken();
      if (!token) {
        throw new SafetyApiError(getExpiredLoginMessage(), 401);
      }

      setIsSaving(true);
      setError(null);
      try {
        await upsertSafetyReport(token, buildQuarterlySummaryUpsertInput(report, site));
        await refreshOperationalIndex(token);
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshOperationalIndex, site],
  );

  const saveBadWorkplaceReport = useCallback(
    async (report: BadWorkplaceReport) => {
      if (!site) {
        return;
      }

      const token = readSafetyAuthToken();
      if (!token) {
        throw new SafetyApiError(getExpiredLoginMessage(), 401);
      }

      setIsSaving(true);
      setError(null);
      try {
        await upsertSafetyReport(token, buildBadWorkplaceUpsertInput(report, site));
        await refreshOperationalIndex(token);
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshOperationalIndex, site],
  );

  const deleteOperationalReport = useCallback(
    async (reportKey: string) => {
      if (!site) {
        return;
      }

      const token = readSafetyAuthToken();
      if (!token) {
        throw new SafetyApiError(getExpiredLoginMessage(), 401);
      }

      setIsSaving(true);
      setError(null);
      try {
        await archiveSafetyReportByKey(token, reportKey);
        await refreshOperationalIndex(token);
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshOperationalIndex, site],
  );

  return {
    isSaving,
    error,
    saveQuarterlyReport,
    saveBadWorkplaceReport,
    deleteOperationalReport,
  };
}
