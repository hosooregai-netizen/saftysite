import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { applyQuarterlySummarySeed } from '@/lib/erpReports/quarterly';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession/session';
import { getMessage } from './mobileQuarterlyReportHelpers';
import { fetchMobileQuarterlySeed } from './mobileQuarterlyReportData';
import type { MobileQuarterlySourceReport } from './types';

interface UseMobileQuarterlySourceSyncParams {
  currentSite: InspectionSite | null;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void>;
  getSessionsBySiteId: (siteId: string) => InspectionSession[];
  setDraft: Dispatch<SetStateAction<QuarterlySummaryReport | null>>;
  setSelectedSourceKeys: Dispatch<SetStateAction<string[]>>;
  setSourceReports: Dispatch<SetStateAction<MobileQuarterlySourceReport[]>>;
  token: string | null;
}

export function useMobileQuarterlySourceSync({
  currentSite,
  ensureSiteReportsLoaded,
  getSessionsBySiteId,
  setDraft,
  setSelectedSourceKeys,
  setSourceReports,
  token,
}: UseMobileQuarterlySourceSyncParams) {
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const sourceSyncRequestRef = useRef(0);

  const syncSourceReportsForDraft = async (
    nextDraft: QuarterlySummaryReport,
    options?: {
      explicitSelection?: boolean;
      selectedReportKeys?: string[];
      sourceNotice?: string | null;
    },
  ) => {
    if (!currentSite) {
      setDraft(nextDraft);
      return;
    }

    if (!nextDraft.periodStartDate || !nextDraft.periodEndDate || nextDraft.periodStartDate > nextDraft.periodEndDate) {
      setDraft(nextDraft);
      setSourceReports([]);
      setSelectedSourceKeys([]);
      return;
    }

    if (!token) {
      setDraft(nextDraft);
      setSourceError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    const requestId = sourceSyncRequestRef.current + 1;
    sourceSyncRequestRef.current = requestId;
    setIsSourceLoading(true);
    setSourceError(null);

    try {
      await ensureSiteReportsLoaded(currentSite.id);
      const seed = await fetchMobileQuarterlySeed({
        currentSite,
        explicitSelection: options?.explicitSelection,
        nextDraft,
        selectedReportKeys: options?.selectedReportKeys,
        siteSessions: getSessionsBySiteId(currentSite.id),
        token,
      });

      if (sourceSyncRequestRef.current !== requestId) return;

      const draftWithSelection =
        options?.explicitSelection && options.selectedReportKeys
          ? { ...nextDraft, generatedFromSessionIds: options.selectedReportKeys }
          : nextDraft;
      const updatedDraft = applyQuarterlySummarySeed(draftWithSelection, seed);
      setDraft(updatedDraft);
      setSourceReports(seed.source_reports);
      setSelectedSourceKeys(updatedDraft.generatedFromSessionIds);
      setSourceNotice(options?.sourceNotice ?? null);
    } catch (error) {
      if (sourceSyncRequestRef.current !== requestId) return;
      setDraft(nextDraft);
      setSourceError(getMessage(error, '원본 보고서를 반영하지 못했습니다.'));
    } finally {
      if (sourceSyncRequestRef.current === requestId) {
        setIsSourceLoading(false);
      }
    }
  };

  return {
    isSourceLoading,
    setSourceNotice,
    sourceError,
    sourceNotice,
    syncSourceReportsForDraft,
  };
}
