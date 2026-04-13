import { useEffect, useState } from 'react';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession/session';
import type { MobileQuarterlySourceReport } from './types';
import { getMessage } from './mobileQuarterlyReportHelpers';
import { loadMobileQuarterlyDraft } from './mobileQuarterlyReportData';

interface UseMobileQuarterlyDraftLoaderParams {
  currentSite: InspectionSite | null;
  currentUserName?: string | null;
  decodedQuarterKey: string;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void>;
  getSessionsBySiteId: (siteId: string) => InspectionSession[];
  isAuthenticated: boolean;
  isReady: boolean;
  token: string | null;
}

export function useMobileQuarterlyDraftLoader({
  currentSite,
  currentUserName,
  decodedQuarterKey,
  ensureSiteReportsLoaded,
  getSessionsBySiteId,
  isAuthenticated,
  isReady,
  token,
}: UseMobileQuarterlyDraftLoaderParams) {
  const [draft, setDraft] = useState<QuarterlySummaryReport | null>(null);
  const [isDraftRoute, setIsDraftRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([]);
  const [sourceReports, setSourceReports] = useState<MobileQuarterlySourceReport[]>([]);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      if (!token) {
        setLoadError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        setIsLoading(false);
        return;
      }

      try {
        await ensureSiteReportsLoaded(currentSite.id);
        const nextState = await loadMobileQuarterlyDraft({
          currentSite,
          currentUserName,
          decodedQuarterKey,
          siteSessions: getSessionsBySiteId(currentSite.id),
          token,
        });

        if (cancelled) return;
        setDraft(nextState.draft);
        setSelectedSourceKeys(nextState.draft.generatedFromSessionIds);
        setSourceReports(nextState.sourceReports);
        setIsDraftRoute(nextState.createdFromQuarter);
        setSaveNotice(nextState.createdFromQuarter ? '새 초안을 만들었습니다.' : null);
      } catch (error) {
        if (!cancelled) {
          setLoadError(getMessage(error, '분기 보고서를 불러오지 못했습니다.'));
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
    currentUserName,
    decodedQuarterKey,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    token,
  ]);

  return {
    draft,
    isDraftRoute,
    isLoading,
    loadError,
    saveNotice,
    selectedSourceKeys,
    setDraft,
    setIsDraftRoute,
    setLoadError,
    setSaveNotice,
    setSelectedSourceKeys,
    setSourceReports,
    sourceReports,
  };
}
