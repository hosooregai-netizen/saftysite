'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEmptyTechnicalGuidanceRelations } from '@/constants/inspectionSession/sessionFactory';
import { compareReportIndexItemsByRound } from '@/hooks/inspectionSessions/helpers';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  fetchTechnicalGuidanceSeed,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';

export type SiteReportSortMode = 'round' | 'name' | 'progress';

interface UseSiteReportListStateOptions {
  buildReportHref?: (reportKey: string) => string;
  siteOverride?: InspectionSite | null;
}

export interface CreateSiteReportInput {
  reportDate: string;
  reportTitle: string;
}

function getDrafterFromReportItem(item: InspectionReportListItem) {
  return typeof item.meta.drafter === 'string' ? item.meta.drafter : '';
}

function getReportSearchText(item: InspectionReportListItem, fallbackDrafter: string) {
  return [
    item.reportTitle,
    item.visitRound?.toString() || '',
    item.visitDate || '',
    getDrafterFromReportItem(item) || fallbackDrafter,
    item.lastAutosavedAt || '',
    item.updatedAt || '',
  ]
    .join(' ')
    .toLowerCase();
}

function buildDefaultReportTitle(reportDate: string, reportNumber: number) {
  return reportDate
    ? `${reportDate} 보고서 ${reportNumber}`
    : `보고서 ${reportNumber}`;
}

export function useSiteReportListState(
  siteKey: string | null,
  options: UseSiteReportListStateOptions = {}
) {
  const router = useRouter();
  const decodedSiteKey = siteKey ? decodeURIComponent(siteKey) : null;
  const {
    sites,
    sessions,
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
  const [reportSortMode, setReportSortMode] = useState<SiteReportSortMode>('round');
  const currentSite = useMemo(() => {
    if (!decodedSiteKey) return null;
    return sites.find((site) => site.id === decodedSiteKey) ?? options.siteOverride ?? null;
  }, [decodedSiteKey, options.siteOverride, sites]);
  const reportIndexState = useMemo(() => {
    if (!decodedSiteKey) return null;
    return getReportIndexBySiteId(decodedSiteKey);
  }, [decodedSiteKey, getReportIndexBySiteId]);
  const hasAttemptedLoadRef = useRef(false);

  useEffect(() => {
    hasAttemptedLoadRef.current = false;
  }, [decodedSiteKey]);

  useEffect(() => {
    if (!decodedSiteKey || !currentSite || !isAuthenticated || !isReady) {
      return;
    }

    if (reportIndexState?.status === 'loading') {
      return;
    }

    if (hasAttemptedLoadRef.current && reportIndexState?.status !== 'error') {
      return;
    }

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
  const reportItems = useMemo(() => reportIndexState?.items ?? [], [reportIndexState]);
  const reportIndexStatus: ReportIndexStatus = reportIndexState?.status ?? 'idle';
  const deferredReportQuery = useDeferredValue(reportQuery);
  const nextReportNumber = useMemo(() => {
    if (!currentSite) return 1;
    return sessions.filter((session) => session.siteKey === currentSite.id).length + 1;
  }, [currentSite, sessions]);
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

      return compareReportIndexItemsByRound(left, right);
    });
  }, [
    assignedUserDisplay,
    currentSite?.assigneeName,
    deferredReportQuery,
    reportItems,
    reportSortMode,
  ]);

  const getCreateReportTitleSuggestion = (reportDate: string) =>
    buildDefaultReportTitle(reportDate, nextReportNumber);

  const createReport = async ({ reportDate, reportTitle }: CreateSiteReportInput) => {
    if (!currentSite || reportIndexStatus !== 'loaded') return;

    const normalizedReportDate = reportDate.trim();
    const normalizedReportTitle =
      reportTitle.trim() || getCreateReportTitleSuggestion(normalizedReportDate);

    if (!normalizedReportDate) {
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    }

    const seed = await fetchTechnicalGuidanceSeed(token, currentSite.id);
    const seedReportNumber = seed.next_visit_round || nextReportNumber;
    const nextSession = createSession(currentSite, {
      reportNumber: seedReportNumber,
      meta: {
        siteName: currentSite.siteName,
        reportDate: normalizedReportDate,
        reportTitle: normalizedReportTitle,
        drafter: currentUser?.name || currentSite.assigneeName,
      },
      document4FollowUps: seed.open_followups.map((item) => ({
        id: item.id,
        sourceSessionId: item.source_session_id ?? undefined,
        sourceFindingId: item.source_finding_id ?? undefined,
        location: item.location,
        guidanceDate: item.guidance_date,
        confirmationDate: item.confirmation_date || normalizedReportDate,
        beforePhotoUrl: item.before_photo_url,
        afterPhotoUrl: item.after_photo_url,
        result: item.result,
      })),
      technicalGuidanceRelations: createEmptyTechnicalGuidanceRelations({
        computedAt: new Date().toISOString(),
        projectionVersion: seed.projection_version,
        stale: false,
        recomputeStatus: 'fresh',
        sourceReportKeys: seed.previous_authoritative_report?.report_key
          ? [seed.previous_authoritative_report.report_key]
          : [],
        cumulativeAccidentEntries: seed.cumulative_accident_entries,
        cumulativeAgentEntries: seed.cumulative_agent_entries,
      }),
    });

    const nextHref = options.buildReportHref
      ? options.buildReportHref(nextSession.id)
      : `/sessions/${nextSession.id}`;
    router.push(nextHref);
  };

  const canCreateReport = reportIndexStatus === 'loaded';
  const reloadReportIndex = () => {
    if (!decodedSiteKey || !currentSite || !isAuthenticated || !isReady) {
      return;
    }

    hasAttemptedLoadRef.current = true;
    void ensureSiteReportIndexLoaded(decodedSiteKey, { force: true });
  };

  return {
    assignedUserDisplay,
    canArchiveReports,
    canCreateReport,
    createReport,
    currentSite,
    currentUser,
    getCreateReportTitleSuggestion,
    deleteSession,
    filteredReportItems,
    reportIndexError: reportIndexState?.error ?? null,
    reportIndexStatus,
    reportItems,
    reloadReportIndex,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
  };
}
