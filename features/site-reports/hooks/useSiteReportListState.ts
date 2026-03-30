'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';

export type SiteReportSortMode = 'recent' | 'name' | 'progress';

interface UseSiteReportListStateOptions {
  siteOverride?: InspectionSite | null;
}

function getDrafterFromReportItem(item: InspectionReportListItem) {
  return typeof item.meta.drafter === 'string' ? item.meta.drafter : '';
}

function getReportSearchText(item: InspectionReportListItem, fallbackDrafter: string) {
  return [
    item.reportTitle,
    item.visitDate || '',
    getDrafterFromReportItem(item) || fallbackDrafter,
    item.lastAutosavedAt || '',
    item.updatedAt || '',
  ]
    .join(' ')
    .toLowerCase();
}

export function useSiteReportListState(
  siteKey: string | null,
  options: UseSiteReportListStateOptions = {}
) {
  const router = useRouter();
  const decodedSiteKey = siteKey ? decodeURIComponent(siteKey) : null;
  const {
    sites,
    currentUser,
    createSession,
    deleteSession,
    ensureSiteReportIndexLoaded,
    getReportIndexBySiteId,
    canArchiveReports,
    isAuthenticated,
    isReady,
  } = useInspectionSessions();
  const [reportQuery, setReportQuery] = useState('');
  const [reportSortMode, setReportSortMode] = useState<SiteReportSortMode>('recent');
  const hasReloadedRef = useRef(false);
  const currentSite = useMemo(() => {
    if (!decodedSiteKey) return null;
    return sites.find((site) => site.id === decodedSiteKey) ?? options.siteOverride ?? null;
  }, [decodedSiteKey, options.siteOverride, sites]);

  useEffect(() => {
    hasReloadedRef.current = false;
  }, [decodedSiteKey]);

  useEffect(() => {
    if (!decodedSiteKey || !currentSite || !isAuthenticated || !isReady || hasReloadedRef.current) {
      return;
    }

    hasReloadedRef.current = true;
    void ensureSiteReportIndexLoaded(decodedSiteKey);
  }, [currentSite, decodedSiteKey, ensureSiteReportIndexLoaded, isAuthenticated, isReady]);

  const reportIndexState = useMemo(() => {
    if (!decodedSiteKey) return null;
    return getReportIndexBySiteId(decodedSiteKey);
  }, [decodedSiteKey, getReportIndexBySiteId]);
  const reportItems = useMemo(() => reportIndexState?.items ?? [], [reportIndexState]);
  const reportIndexStatus: ReportIndexStatus = reportIndexState?.status ?? 'idle';
  const deferredReportQuery = useDeferredValue(reportQuery);
  const assignedUserDisplay = [currentUser?.name, currentUser?.position]
    .filter(Boolean)
    .join(' / ');
  const filteredReportItems = useMemo(() => {
    const normalizedQuery = deferredReportQuery.trim().toLowerCase();
    const drafterFallback = assignedUserDisplay || currentSite?.assigneeName || '';

    const matchingItems = !normalizedQuery
      ? reportItems
      : reportItems.filter((item) =>
          getReportSearchText(item, drafterFallback).includes(normalizedQuery),
        );

    return [...matchingItems].sort((left, right) => {
      if (reportSortMode === 'name') {
        return left.reportTitle.localeCompare(right.reportTitle, 'ko');
      }

      if (reportSortMode === 'progress') {
        return (
          (right.progressRate ?? 0) - (left.progressRate ?? 0) ||
          right.reportTitle.localeCompare(left.reportTitle, 'ko') * -1
        );
      }

      const leftSavedTime = left.lastAutosavedAt ? new Date(left.lastAutosavedAt).getTime() : 0;
      const rightSavedTime = right.lastAutosavedAt ? new Date(right.lastAutosavedAt).getTime() : 0;
      const leftUpdatedTime = new Date(left.updatedAt).getTime();
      const rightUpdatedTime = new Date(right.updatedAt).getTime();

      return rightSavedTime - leftSavedTime || rightUpdatedTime - leftUpdatedTime;
    });
  }, [
    assignedUserDisplay,
    currentSite?.assigneeName,
    deferredReportQuery,
    reportItems,
    reportSortMode,
  ]);

  const createReport = () => {
    if (!currentSite) return;

    const nextSession = createSession(currentSite, {
      meta: {
        siteName: currentSite.siteName,
        drafter: currentUser?.name || currentSite.assigneeName,
      },
    });

    router.push(`/sessions/${nextSession.id}`);
  };

  const canCreateReport = reportIndexStatus === 'loaded';

  return {
    assignedUserDisplay,
    canArchiveReports,
    canCreateReport,
    createReport,
    currentSite,
    currentUser,
    deleteSession,
    filteredReportItems,
    reportIndexError: reportIndexState?.error ?? null,
    reportIndexStatus,
    reportItems,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
  };
}
