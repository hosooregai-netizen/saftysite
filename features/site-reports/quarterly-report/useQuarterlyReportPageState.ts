import { useEffect, useMemo, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { buildInitialQuarterlySummaryReport, createQuarterlySummaryDraft } from '@/lib/erpReports/quarterly';
import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import { buildSiteQuarterlyListHref } from '@/features/home/lib/siteEntry';
import { isAdminUserRole } from '@/lib/admin';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { useResolvedSiteRoute } from '../hooks/useResolvedSiteRoute';
import { getQuarterlyPageErrorMessage } from './quarterlyReportHelpers';

export function useQuarterlyReportPageState(siteKey: string, reportKey: string) {
  const {
    isReady,
    isAuthenticated,
    currentUser,
    authError,
    login,
    logout,
  } = useInspectionSessions();
  const { currentSite, isResolvingSite } = useResolvedSiteRoute(siteKey);
  const { isSaving, error, saveQuarterlyReport } =
    useSiteOperationalReportMutations(currentSite);
  const [existingReport, setExistingReport] = useState<QuarterlySummaryReport | null>(null);
  const [existingReportLoading, setExistingReportLoading] = useState(false);
  const [existingReportError, setExistingReportError] = useState<string | null>(null);
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const backHref = currentSite ? buildSiteQuarterlyListHref(currentSite.id) : '/';

  useEffect(() => {
    if (!isReady || !isAuthenticated || !currentSite) {
      queueMicrotask(() => {
        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError(null);
      });
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      queueMicrotask(() => {
        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      setExistingReportLoading(true);
      setExistingReportError(null);
    });

    void fetchSafetyReportByKey(token, reportKey)
      .then((report) => {
        if (cancelled) {
          return;
        }

        const mappedReport = mapSafetyReportToQuarterlySummaryReport(report);
        setExistingReport(
          mappedReport && mappedReport.siteId === currentSite.id ? mappedReport : null,
        );
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        if (nextError instanceof SafetyApiError && nextError.status === 404) {
          setExistingReport(null);
          setExistingReportError(null);
          return;
        }

        setExistingReport(null);
        setExistingReportError(getQuarterlyPageErrorMessage(nextError));
      })
      .finally(() => {
        if (!cancelled) {
          setExistingReportLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentSite, isAuthenticated, isReady, reportKey]);

  const initialDraft = useMemo(() => {
    if (!currentSite || existingReportLoading || existingReportError) return null;

    if (existingReport) {
      return buildInitialQuarterlySummaryReport(
        currentSite,
        [],
        currentUser?.name || currentSite.assigneeName,
        existingReport,
      );
    }

    return {
      ...createQuarterlySummaryDraft(
        currentSite,
        currentUser?.name || currentSite.assigneeName,
      ),
      id: reportKey,
    };
  }, [
    currentSite,
    currentUser?.name,
    reportKey,
    existingReport,
    existingReportError,
    existingReportLoading,
  ]);

  return {
    authError,
    backHref,
    currentSite,
    currentUser,
    error,
    existingReport,
    existingReportError,
    existingReportLoading,
    initialDraft,
    isAdminView,
    isAuthenticated,
    isResolvingSite,
    isReady,
    isSaving,
    login,
    logout,
    saveQuarterlyReport,
  };
}
