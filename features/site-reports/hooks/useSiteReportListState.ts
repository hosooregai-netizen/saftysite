'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  mergeAdminSiteSnapshots,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
import { createEmptyTechnicalGuidanceRelations } from '@/constants/inspectionSession/sessionFactory';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import {
  readEnumParam,
  readStringParam,
  useUrlQueryUpdater,
} from '@/hooks/useUrlQueryState';
import { mergeReportIndexItems } from '@/hooks/inspectionSessions/helpers';
import { fetchAdminReports } from '@/lib/admin/apiClient';
import { isAdminUserRole } from '@/lib/admin';
import { fetchAllMySchedules, reserveNextMySchedule, updateMySchedule } from '@/lib/calendar/apiClient';
import {
  fetchTechnicalGuidanceSeed,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import { mapInspectionSessionToReportListItem } from '@/lib/safetyApiMappers';
import {
  applyScheduleReportUpdateToSession,
  buildContractWindowFromScheduleRows,
  buildContractWindowFromSafetySite,
  buildScheduleReportSyncPlan,
  resolveContractWindow,
} from '@/features/schedule-report-sync/scheduleReportSync';
import type { ControllerReportRow } from '@/types/admin';
import type { SafetyReportStatus } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';
import {
  buildDefaultReportTitle,
  getFilteredReportItems,
} from '@/features/site-reports/report-list/reportListHelpers';
import {
  type CreateSiteReportInput,
  type SiteReportDispatchFilter,
  type SiteReportSortMode,
} from '@/features/site-reports/report-list/types';
import { useSiteReportIndexLoader } from '@/features/site-reports/report-list/useSiteReportIndexLoader';

interface UseSiteReportListStateOptions {
  buildReportHref?: (reportKey: string) => string;
  siteOverride?: InspectionSite | null;
}

function getNextVisitRound(items: { visitRound: number | null }[]) {
  const maxRound = items.reduce((max, item) => {
    return typeof item.visitRound === 'number' && Number.isFinite(item.visitRound) && item.visitRound > max
      ? item.visitRound
      : max;
  }, 0);
  return maxRound + 1;
}

export type { CreateSiteReportInput, SiteReportSortMode };

type AdminLegacySiteReportsState = {
  error: string | null;
  items: import('@/types/inspectionSession').InspectionReportListItem[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
};

const SITE_REPORT_LIST_QUERY_DEFAULTS = {
  dispatch: 'all',
  reportQuery: '',
  reportSort: 'round',
};

function extractVisitRound(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d+)\s*차/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isLegacyTechnicalGuidanceRow(row: ControllerReportRow) {
  return row.reportType === 'technical_guidance' && row.reportKey.startsWith('legacy:');
}

function isDispatchCompleted(row: ControllerReportRow) {
  return (
    row.dispatch?.dispatchStatus === 'sent' ||
    row.dispatch?.dispatchStatus === 'manual_checked'
  );
}

function normalizeLegacyReportStatus(status: string): SafetyReportStatus {
  switch (status) {
    case 'submitted':
    case 'published':
    case 'archived':
      return status;
    case 'draft':
    default:
      return 'draft';
  }
}

function mapAdminLegacyRowToReportItem(
  row: ControllerReportRow,
): import('@/types/inspectionSession').InspectionReportListItem {
  const parsedRouteRound =
    typeof row.routeParam === 'string' && /^\d+$/.test(row.routeParam)
      ? Number(row.routeParam)
      : null;

  return {
    id: row.reportKey,
    reportKey: row.reportKey,
    reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
    reportOpenHref: `/admin/report-open?reportKey=${encodeURIComponent(row.reportKey)}`,
    reportOpenMode: 'original_pdf',
    readOnly: true,
    originalPdfAvailable: Boolean(row.originalPdfAvailable),
    siteId: row.siteId,
    headquarterId: row.headquarterId || null,
    assignedUserId: row.assigneeUserId || null,
    visitDate: row.visitDate || null,
    visitRound:
      parsedRouteRound ??
      extractVisitRound(row.reportTitle) ??
      extractVisitRound(row.periodLabel),
    totalRound: null,
    progressRate: row.progressRate,
    status: normalizeLegacyReportStatus(row.status),
    dispatchCompleted: isDispatchCompleted(row),
    payloadVersion: 1,
    latestRevisionNo: 0,
    submittedAt: row.status === 'submitted' || row.status === 'published' ? row.updatedAt : null,
    publishedAt: row.status === 'published' ? row.updatedAt : null,
    lastAutosavedAt: row.updatedAt,
    createdAt: row.updatedAt,
    updatedAt: row.updatedAt,
    meta: {
      drafter: row.assigneeName,
      originalPdfAvailable: Boolean(row.originalPdfAvailable),
      reportType: row.reportType,
      siteName: row.siteName,
    },
  };
}

async function fetchAllAdminLegacySiteReportItems(siteId: string) {
  const items: import('@/types/inspectionSession').InspectionReportListItem[] = [];
  let offset = 0;

  while (true) {
    const response = await fetchAdminReports({
      limit: 200,
      offset,
      reportType: 'technical_guidance',
      siteId,
    });
    items.push(
      ...response.rows
        .filter((row) => isLegacyTechnicalGuidanceRow(row))
        .map((row) => mapAdminLegacyRowToReportItem(row)),
    );

    offset += response.rows.length;
    if (offset >= response.total || response.rows.length < response.limit) {
      return items;
    }
  }
}

export function useSiteReportListState(
  siteKey: string | null,
  options: UseSiteReportListStateOptions = {}
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateUrlQuery = useUrlQueryUpdater();
  const decodedSiteKey = siteKey ? decodeURIComponent(siteKey) : null;
  const {
    sites,
    sessions,
    currentUser,
    createSession,
    deleteSession,
    ensureAssignedSafetySite,
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    getSessionById,
    getReportIndexBySiteId,
    canArchiveReports,
    isAuthenticated,
    isReady,
    saveNow,
    updateSession,
  } = useInspectionSessions();
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const {
    query: reportQuery,
    queryInput: reportQueryInput,
    setQueryInput: setReportQueryInput,
    submitQuery: submitReportQuery,
  } = useSubmittedSearchState(readStringParam(searchParams, 'reportQuery'));
  const urlReportSortMode = readEnumParam(
    searchParams,
    'reportSort',
    ['round', 'name', 'progress'] as const,
    'round',
  );
  const urlDispatchFilter = readEnumParam(
    searchParams,
    'dispatch',
    ['all', 'pending', 'completed'] as const,
    'all',
  );
  const [reportSortMode, setReportSortModeState] =
    useState<SiteReportSortMode>(urlReportSortMode);
  const [dispatchFilter, setDispatchFilterState] =
    useState<SiteReportDispatchFilter>(urlDispatchFilter);
  const currentSite = useMemo(() => {
    if (!decodedSiteKey) {
      return options.siteOverride ?? null;
    }

    const storedSite = sites.find((site) => site.id === decodedSiteKey) ?? null;
    const overrideSite =
      options.siteOverride && options.siteOverride.id === decodedSiteKey
        ? options.siteOverride
        : null;

    if (overrideSite && storedSite) {
      return normalizeInspectionSite({
        ...storedSite,
        ...overrideSite,
        headquarterId: overrideSite.headquarterId || storedSite.headquarterId,
        title: overrideSite.title || storedSite.title,
        customerName: overrideSite.customerName || storedSite.customerName,
        siteName: overrideSite.siteName || storedSite.siteName,
        assigneeName: overrideSite.assigneeName || storedSite.assigneeName,
        adminSiteSnapshot: mergeAdminSiteSnapshots(
          overrideSite.adminSiteSnapshot,
          storedSite.adminSiteSnapshot,
        ),
        createdAt: overrideSite.createdAt || storedSite.createdAt,
        updatedAt: overrideSite.updatedAt || storedSite.updatedAt,
      });
    }

    return overrideSite ?? storedSite;
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
  const [adminLegacyState, setAdminLegacyState] = useState<AdminLegacySiteReportsState>({
    error: null,
    items: [],
    status: 'idle',
  });
  const reloadAdminLegacyItems = useCallback(
    async (options?: { force?: boolean }) => {
      if (!isAdminView || !currentSite || !isAuthenticated || !isReady) {
        setAdminLegacyState({ error: null, items: [], status: 'idle' });
        return;
      }

      setAdminLegacyState((current) => ({
        error: null,
        items: options?.force ? [] : current.items,
        status:
          current.status === 'loaded' && !options?.force && current.items.length > 0
            ? 'loaded'
            : 'loading',
      }));

      try {
        const items = await fetchAllAdminLegacySiteReportItems(currentSite.id);
        setAdminLegacyState({
          error: null,
          items,
          status: 'loaded',
        });
      } catch (error) {
        setAdminLegacyState((current) => ({
          error: error instanceof Error ? error.message : '레거시 보고서 목록을 불러오지 못했습니다.',
          items: current.items,
          status: current.items.length > 0 ? 'loaded' : 'error',
        }));
      }
    },
    [currentSite, isAdminView, isAuthenticated, isReady],
  );

  useEffect(() => {
    void reloadAdminLegacyItems();
  }, [reloadAdminLegacyItems]);
  useEffect(() => {
    setReportSortModeState(urlReportSortMode);
  }, [urlReportSortMode]);

  useEffect(() => {
    setDispatchFilterState(urlDispatchFilter);
  }, [urlDispatchFilter]);

  const deferredReportQuery = useDeferredValue(reportQuery);
  const effectiveReportItems = useMemo(() => {
    if (!isAdminView || !currentSite) {
      return reportItems;
    }

    const localSessionItems = sessions
      .filter((session) => session.siteKey === currentSite.id)
      .map((session) => mapInspectionSessionToReportListItem(session, currentSite));

    return mergeReportIndexItems(
      mergeReportIndexItems(reportItems, localSessionItems),
      adminLegacyState.items,
    );
  }, [adminLegacyState.items, currentSite, isAdminView, reportItems, sessions]);
  const effectiveReportIndexStatus = useMemo(() => {
    if (!isAdminView) {
      return reportIndexStatus;
    }
    if (
      effectiveReportItems.length === 0 &&
      (reportIndexStatus === 'loading' ||
        reportIndexStatus === 'idle' ||
        adminLegacyState.status === 'loading' ||
        adminLegacyState.status === 'idle')
    ) {
      return 'loading' as const;
    }
    if (effectiveReportItems.length > 0) {
      return 'loaded' as const;
    }
    if (reportIndexStatus === 'error' || adminLegacyState.status === 'error') {
      return 'error' as const;
    }
    return reportIndexStatus;
  }, [adminLegacyState.status, effectiveReportItems.length, isAdminView, reportIndexStatus]);
  const effectiveReportIndexError = isAdminView
    ? reportIndexError || adminLegacyState.error
    : reportIndexError;
  const nextReportNumber = useMemo(() => {
    if (!currentSite) return 1;
    return getNextVisitRound(effectiveReportItems);
  }, [currentSite, effectiveReportItems]);
  const assignedUserDisplay = [currentUser?.name, currentUser?.position]
    .filter(Boolean)
    .join(' / ');
  const filteredReportItems = useMemo(
    () =>
      getFilteredReportItems({
        assignedUserDisplay,
        currentSiteAssigneeName: currentSite?.assigneeName,
        dispatchFilter,
        reportItems: effectiveReportItems,
        reportQuery: deferredReportQuery,
        reportSortMode,
      }),
    [
      assignedUserDisplay,
      currentSite?.assigneeName,
      deferredReportQuery,
      dispatchFilter,
      effectiveReportItems,
      reportSortMode,
    ],
  );
  const getCreateReportTitleSuggestion = (reportDate: string) => buildDefaultReportTitle(reportDate, nextReportNumber);

  const createReport = async ({ reportDate }: CreateSiteReportInput) => {
    if (!currentSite || effectiveReportIndexStatus !== 'loaded') return;

    const normalizedReportDate = reportDate.trim();

    if (!normalizedReportDate) {
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    }

    const seed = await fetchTechnicalGuidanceSeed(token, currentSite.id);
    const targetReportNumber = Math.max(seed.next_visit_round || 0, nextReportNumber);
    const safetySite = await ensureAssignedSafetySite(currentSite.id);
    const initialScheduleResponse = await fetchAllMySchedules({
      includeAll: true,
      siteId: currentSite.id,
    });
    const contractWindow = resolveContractWindow(
      buildContractWindowFromSafetySite(safetySite),
      buildContractWindowFromScheduleRows(initialScheduleResponse.rows),
    );
    if (!contractWindow.windowStart || !contractWindow.windowEnd) {
      throw new SafetyApiError('현장 계약기간이 설정되어 있지 않아 방문일을 저장할 수 없습니다.', 400);
    }
    if (normalizedReportDate < contractWindow.windowStart || normalizedReportDate > contractWindow.windowEnd) {
      throw new SafetyApiError(
        `${normalizedReportDate}은 계약기간 ${contractWindow.windowStart} ~ ${contractWindow.windowEnd} 밖입니다.`,
        400,
      );
    }
    const assignedSchedule = await (async () => {
      try {
        const targetSchedule = initialScheduleResponse.rows.find(
          (row) => row.roundNo === targetReportNumber && !row.linkedReportKey?.trim(),
        );
        if (targetSchedule) {
          return updateMySchedule(targetSchedule.id, {
            plannedDate: normalizedReportDate,
          });
        }
      } catch {
        // Fall back to the existing next-schedule reservation path.
      }

      return reserveNextMySchedule({
        plannedDate: normalizedReportDate,
        siteId: currentSite.id,
      });
    })();
    const seedReportNumber = assignedSchedule.roundNo || targetReportNumber;
    const normalizedReportTitle = buildDefaultReportTitle(normalizedReportDate, seedReportNumber);
    const nextSession = createSession(currentSite, {
      reportNumber: seedReportNumber,
      scheduleId: assignedSchedule.id,
      scheduleRoundNo: assignedSchedule.roundNo,
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

    const linkedSchedule = await updateMySchedule(assignedSchedule.id, {
      actualVisitDate: normalizedReportDate,
      linkedReportKey: nextSession.id,
      plannedDate: normalizedReportDate,
    });
    const nextReportItems = mergeReportIndexItems(effectiveReportItems, [
      mapInspectionSessionToReportListItem(nextSession, currentSite),
    ]);
    const scheduleRows = [
      ...initialScheduleResponse.rows.filter((row) => row.id !== linkedSchedule.id),
      linkedSchedule,
    ];
    const syncPlan = buildScheduleReportSyncPlan({
      buildReportTitle: buildDefaultReportTitle,
      changedReport: {
        reportKey: nextSession.id,
        visitDate: normalizedReportDate,
      },
      contractWindow,
      reports: nextReportItems,
      schedules: scheduleRows,
    });

    if (!syncPlan.ok) {
      throw new SafetyApiError(syncPlan.message, 400);
    }

    for (const update of syncPlan.scheduleUpdates) {
      await updateMySchedule(update.scheduleId, {
        actualVisitDate: update.actualVisitDate,
        linkedReportKey: update.linkedReportKey,
        plannedDate: update.plannedDate,
      });
    }

    for (const update of syncPlan.reportUpdates) {
      if (!getSessionById(update.reportKey)) {
        await ensureSessionLoaded(update.reportKey);
      }
      if (!getSessionById(update.reportKey)) {
        throw new SafetyApiError('연결된 보고서를 불러오지 못해 일정과 보고서를 함께 정리하지 못했습니다.', 500);
      }
      updateSession(update.reportKey, (current) =>
        applyScheduleReportUpdateToSession(current, update),
      );
    }
    await saveNow();

    const nextHref = options.buildReportHref
      ? options.buildReportHref(nextSession.id)
      : `/sessions/${nextSession.id}`;
    router.push(nextHref);
  };

  const canCreateReport = effectiveReportIndexStatus === 'loaded';
  return {
    assignedUserDisplay,
    canArchiveReports,
    canCreateReport,
    createReport,
    currentSite,
    currentUser,
    getCreateReportTitleSuggestion,
    deleteSession,
    dispatchFilter,
    filteredReportItems,
    reportIndexError: effectiveReportIndexError,
    reportIndexStatus: effectiveReportIndexStatus,
    reportItems: effectiveReportItems,
    reloadReportIndex: () => {
      reloadReportIndex();
      void reloadAdminLegacyItems({ force: true });
    },
    reportQuery,
    reportQueryInput,
    reportSortMode,
    setReportQuery: setReportQueryInput,
    submitReportQuery: () => {
      const nextQuery = submitReportQuery();
      updateUrlQuery({ reportQuery: nextQuery }, SITE_REPORT_LIST_QUERY_DEFAULTS);
    },
    setReportSortMode: (value: SiteReportSortMode) => {
      setReportSortModeState(value);
      updateUrlQuery({ reportSort: value }, SITE_REPORT_LIST_QUERY_DEFAULTS);
    },
    setDispatchFilter: (value: SiteReportDispatchFilter) => {
      setDispatchFilterState(value);
      updateUrlQuery({ dispatch: value }, SITE_REPORT_LIST_QUERY_DEFAULTS);
    },
  };
}
