'use client';

import { useEffect, useMemo, useRef } from 'react';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';

interface ReportIndexSnapshot {
  error?: string | null;
  items?: InspectionReportListItem[];
  status: ReportIndexStatus;
}

interface UseSiteReportIndexLoaderParams {
  currentSite: InspectionSite | null;
  decodedSiteKey: string | null;
  ensureSiteReportIndexLoaded: (
    siteId: string,
    options?: {
      force?: boolean;
    },
  ) => Promise<unknown>;
  getReportIndexBySiteId: (siteId: string) => ReportIndexSnapshot | null | undefined;
  isAuthenticated: boolean;
  isReady: boolean;
}

export function useSiteReportIndexLoader({
  currentSite,
  decodedSiteKey,
  ensureSiteReportIndexLoaded,
  getReportIndexBySiteId,
  isAuthenticated,
  isReady,
}: UseSiteReportIndexLoaderParams) {
  const reportIndexState = useMemo(() => {
    if (!decodedSiteKey) return null;
    return getReportIndexBySiteId(decodedSiteKey);
  }, [decodedSiteKey, getReportIndexBySiteId]);
  const hasAttemptedLoadRef = useRef(false);

  useEffect(() => {
    hasAttemptedLoadRef.current = false;
  }, [decodedSiteKey]);

  useEffect(() => {
    if (!decodedSiteKey || !currentSite || !isAuthenticated || !isReady) return;
    if (reportIndexState?.status === 'loading') return;
    if (hasAttemptedLoadRef.current && reportIndexState?.status !== 'error') return;

    hasAttemptedLoadRef.current = true;
    void ensureSiteReportIndexLoaded(decodedSiteKey);
  }, [
    currentSite,
    decodedSiteKey,
    ensureSiteReportIndexLoaded,
    isAuthenticated,
    isReady,
    reportIndexState,
  ]);

  return {
    reloadReportIndex: () => {
      if (!decodedSiteKey || !currentSite || !isAuthenticated || !isReady) return;
      hasAttemptedLoadRef.current = true;
      void ensureSiteReportIndexLoaded(decodedSiteKey, { force: true });
    },
    reportIndexError: reportIndexState?.error ?? null,
    reportIndexStatus: reportIndexState?.status ?? 'idle',
    reportItems: reportIndexState?.items ?? [],
  };
}
