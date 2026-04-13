'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEmptyTechnicalGuidanceRelations } from '@/constants/inspectionSession/sessionFactory';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  fetchTechnicalGuidanceSeed,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type { InspectionSite } from '@/types/inspectionSession';
import {
  buildDefaultReportTitle,
  getFilteredReportItems,
} from '@/features/site-reports/report-list/reportListHelpers';
import {
  type CreateSiteReportInput,
  type SiteReportSortMode,
} from '@/features/site-reports/report-list/types';
import { useSiteReportIndexLoader } from '@/features/site-reports/report-list/useSiteReportIndexLoader';

interface UseSiteReportListStateOptions {
  buildReportHref?: (reportKey: string) => string;
  siteOverride?: InspectionSite | null;
}

export type { CreateSiteReportInput, SiteReportSortMode };

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
  const { reloadReportIndex, reportIndexError, reportIndexStatus, reportItems } =
    useSiteReportIndexLoader({
      currentSite,
      decodedSiteKey,
      ensureSiteReportIndexLoaded,
      getReportIndexBySiteId,
      isAuthenticated,
      isReady,
    });
  const deferredReportQuery = useDeferredValue(reportQuery);
  const nextReportNumber = useMemo(() => {
    if (!currentSite) return 1;
    return sessions.filter((session) => session.siteKey === currentSite.id).length + 1;
  }, [currentSite, sessions]);
  const assignedUserDisplay = [currentUser?.name, currentUser?.position]
    .filter(Boolean)
    .join(' / ');
  const filteredReportItems = useMemo(
    () =>
      getFilteredReportItems({
        assignedUserDisplay,
        currentSiteAssigneeName: currentSite?.assigneeName,
        reportItems,
        reportQuery: deferredReportQuery,
        reportSortMode,
      }),
    [assignedUserDisplay, currentSite?.assigneeName, deferredReportQuery, reportItems, reportSortMode],
  );
  const getCreateReportTitleSuggestion = (reportDate: string) => buildDefaultReportTitle(reportDate, nextReportNumber);

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
    reportIndexError,
    reportIndexStatus,
    reportItems,
    reloadReportIndex,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
  };
}
