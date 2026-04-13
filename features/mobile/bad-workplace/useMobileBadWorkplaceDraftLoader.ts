import { useEffect, useState } from 'react';
import {
  buildInitialBadWorkplaceReport,
} from '@/lib/erpReports/badWorkplace';
import { mapSafetyReportToBadWorkplaceReport } from '@/lib/erpReports/mappers';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type { SafetyUser } from '@/types/backend';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { getMessage } from './mobileBadWorkplaceHelpers';

interface UseMobileBadWorkplaceDraftLoaderParams {
  currentSite: InspectionSite | null;
  currentUser: SafetyUser | null;
  decodedReportMonth: string;
  isAuthenticated: boolean;
  isReady: boolean;
  reportKey: string;
  siteSessions: InspectionSession[];
}

export function useMobileBadWorkplaceDraftLoader({
  currentSite,
  currentUser,
  decodedReportMonth,
  isAuthenticated,
  isReady,
  reportKey,
  siteSessions,
}: UseMobileBadWorkplaceDraftLoaderParams) {
  const [draft, setDraft] = useState<BadWorkplaceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      const token = readSafetyAuthToken();
      if (!token) {
        setLoadError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        setIsLoading(false);
        return;
      }

      try {
        let existingReport: BadWorkplaceReport | null = null;

        if (reportKey) {
          try {
            const report = await fetchSafetyReportByKey(token, reportKey);
            const mapped = mapSafetyReportToBadWorkplaceReport(report);
            if (!mapped || mapped.siteId !== currentSite.id) {
              throw new Error('불량사업장 신고서를 찾을 수 없습니다.');
            }
            existingReport = mapped;
          } catch (error) {
            if (!(error instanceof SafetyApiError && error.status === 404)) {
              throw error;
            }
          }
        }

        const nextDraft = buildInitialBadWorkplaceReport(
          currentSite,
          siteSessions,
          currentUser,
          decodedReportMonth,
          existingReport,
        );

        if (!cancelled) {
          setDraft(nextDraft);
          setNotice(existingReport ? null : '이번 달 불량사업장 신고 초안을 만들었습니다.');
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getMessage(error, '불량사업장 신고서를 불러오지 못했습니다.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentSite,
    currentUser,
    decodedReportMonth,
    isAuthenticated,
    isReady,
    reportKey,
    siteSessions,
  ]);

  return {
    draft,
    isLoading,
    loadError,
    notice,
    setDraft,
    setLoadError,
    setNotice,
  };
}
