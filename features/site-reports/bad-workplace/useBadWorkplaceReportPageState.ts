import { useEffect, useMemo, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  buildInitialBadWorkplaceReport,
  getBadWorkplaceSourceSessions,
} from '@/lib/erpReports/badWorkplace';
import { mapSafetyReportToBadWorkplaceReport } from '@/lib/erpReports/mappers';
import { buildBadWorkplaceReportKey } from '@/lib/erpReports/shared';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { getBadWorkplacePageErrorMessage } from './badWorkplaceHelpers';

export function useBadWorkplaceReportPageState(siteKey: string, reportMonth: string) {
  const {
    authError,
    currentUser,
    isAuthenticated,
    isReady,
    login,
    logout,
    sessions,
    sites,
  } = useInspectionSessions();
  const [existingReport, setExistingReport] = useState<BadWorkplaceReport | null>(null);
  const [existingReportLoading, setExistingReportLoading] = useState(false);
  const [existingReportError, setExistingReportError] = useState<string | null>(null);
  const currentSite = useMemo(
    () => sites.find((site) => site.id === siteKey) ?? null,
    [siteKey, sites],
  );
  const siteSessions = useMemo(
    () =>
      getBadWorkplaceSourceSessions(
        sessions.filter((session) => session.siteKey === siteKey),
      ),
    [siteKey, sessions],
  );
  const { error, isSaving, saveBadWorkplaceReport } =
    useSiteOperationalReportMutations(currentSite);
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const backHref = currentSite
    ? isAdminView
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : `/sites/${encodeURIComponent(currentSite.id)}/entry?entry=bad-workplace`
    : isAdminView
      ? getAdminSectionHref('headquarters')
      : '/';
  const backLabel = isAdminView ? '현장 메인' : '현장 메뉴';
  const reportKey =
    currentSite && currentUser?.id
      ? buildBadWorkplaceReportKey(currentSite.id, reportMonth, currentUser.id)
      : '';

  useEffect(() => {
    let cancelled = false;

    if (!isReady || !isAuthenticated || !currentSite || !currentUser?.id || !reportKey) {
      queueMicrotask(() => {
        if (cancelled) {
          return;
        }
        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError(null);
      });

      return () => {
        cancelled = true;
      };
    }

    const token = readSafetyAuthToken();
    if (!token) {
      queueMicrotask(() => {
        if (cancelled) {
          return;
        }
        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      });

      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setExistingReportLoading(true);
        setExistingReportError(null);
      }
    });

    void fetchSafetyReportByKey(token, reportKey)
      .then((report) => {
        if (cancelled) {
          return;
        }

        const mapped = mapSafetyReportToBadWorkplaceReport(report);
        setExistingReport(mapped && mapped.siteId === currentSite.id ? mapped : null);
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
        setExistingReportError(getBadWorkplacePageErrorMessage(nextError));
      })
      .finally(() => {
        if (!cancelled) {
          setExistingReportLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentSite, currentUser?.id, isAuthenticated, isReady, reportKey]);

  const initialDraft = useMemo(() => {
    if (!currentSite || existingReportLoading || existingReportError) {
      return null;
    }

    return buildInitialBadWorkplaceReport(
      currentSite,
      siteSessions,
      currentUser,
      reportMonth,
      existingReport,
    );
  }, [
    currentSite,
    currentUser,
    existingReport,
    existingReportError,
    existingReportLoading,
    reportMonth,
    siteSessions,
  ]);

  return {
    authError,
    backHref,
    backLabel,
    currentSite,
    currentUser,
    error,
    existingReport,
    existingReportError,
    existingReportLoading,
    initialDraft,
    isAdminView,
    isAuthenticated,
    isReady,
    isSaving,
    login,
    logout,
    saveBadWorkplaceReport,
    siteSessions,
  };
}
