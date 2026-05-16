'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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
import { isAdminUserRole } from '@/lib/admin';
import { fetchAllMySchedules, reserveNextMySchedule, updateMySchedule } from '@/lib/calendar/apiClient';
import {
  fetchTechnicalGuidanceSeed,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import {
  buildPreviousRoundAccidentOverviewSeed,
  mapInspectionSessionToReportListItem,
} from '@/lib/safetyApiMappers';
import {
  applyScheduleReportUpdateToSession,
  buildContractWindowFromScheduleRows,
  buildContractWindowFromSafetySite,
  buildScheduleReportSyncPlan,
  resolveContractWindow,
} from '@/features/schedule-report-sync/scheduleReportSync';
import {
  buildDefaultReportTitle,
  getFilteredReportItems,
} from '@/features/site-reports/report-list/reportListHelpers';
import {
  type CreateSiteReportInput,
  type SiteReportDispatchFilter,
  type SiteReportSortMode,
} from '@/features/site-reports/report-list/types';
import {
  beginAdminLegacySiteReportRequest,
  fetchAllAdminLegacySiteReportItems,
  isCurrentAdminLegacySiteReportRequest,
  readAdminLegacySiteReportCache,
  writeAdminLegacySiteReportCache,
  type AdminLegacySiteReportRequestToken,
} from '@/features/site-reports/report-list/adminLegacySiteReportCache';
import { useSiteReportIndexLoader } from '@/features/site-reports/report-list/useSiteReportIndexLoader';
import type { InspectionReportListItem, InspectionSite } from '@/types/inspectionSession';

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
  hasCache: boolean;
  items: InspectionReportListItem[];
  siteId: string | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
};

function createIdleAdminLegacySiteReportsState(): AdminLegacySiteReportsState {
  return {
    error: null,
    hasCache: false,
    items: [],
    siteId: null,
    status: 'idle',
  };
}

function isWritableReportListItem(item: InspectionReportListItem) {
  return (
    !item.readOnly &&
    item.reportOpenMode !== 'original_pdf' &&
    !item.reportKey.startsWith('legacy:')
  );
}

const SITE_REPORT_LIST_QUERY_DEFAULTS = {
  dispatch: 'all',
  reportQuery: '',
  reportSort: 'round',
};

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
  const [adminLegacyState, setAdminLegacyState] = useState<AdminLegacySiteReportsState>(() => {
    const ownerId = currentUser?.id?.trim() || '';
    const siteId = currentSite?.id ?? '';
    if (!isAdminView || !ownerId || !siteId) {
      return createIdleAdminLegacySiteReportsState();
    }

    const cached = readAdminLegacySiteReportCache(ownerId, siteId);
    return cached.hasCache
      ? {
          error: null,
          hasCache: true,
          items: cached.items,
          siteId,
          status: 'loading',
        }
      : createIdleAdminLegacySiteReportsState();
  });
  const adminLegacyRequestRef = useRef<AdminLegacySiteReportRequestToken | null>(null);
  const reloadAdminLegacyItems = useCallback(
    async (options?: { force?: boolean }) => {
      const ownerId = currentUser?.id?.trim() || '';
      const siteId = currentSite?.id ?? '';
      void options;

      if (!isAdminView || !siteId || !ownerId || !isAuthenticated || !isReady) {
        setAdminLegacyState(createIdleAdminLegacySiteReportsState());
        return;
      }

      const requestToken = beginAdminLegacySiteReportRequest(adminLegacyRequestRef, siteId);
      const cached = readAdminLegacySiteReportCache(ownerId, siteId);

      setAdminLegacyState((current) => {
        const currentSiteCache =
          current.siteId === siteId && current.hasCache ? current.items : [];
        const fallbackItems = cached.hasCache ? cached.items : currentSiteCache;
        const hasCache = cached.hasCache || (current.siteId === siteId && current.hasCache);

        return {
          error: null,
          hasCache,
          items: fallbackItems,
          siteId,
          status: 'loading',
        };
      });

      try {
        const items = await fetchAllAdminLegacySiteReportItems(siteId);
        if (!isCurrentAdminLegacySiteReportRequest(adminLegacyRequestRef, requestToken)) {
          return;
        }

        writeAdminLegacySiteReportCache(ownerId, siteId, items);
        setAdminLegacyState({
          error: null,
          hasCache: true,
          items,
          siteId,
          status: 'loaded',
        });
      } catch (error) {
        if (!isCurrentAdminLegacySiteReportRequest(adminLegacyRequestRef, requestToken)) {
          return;
        }

        setAdminLegacyState((current) => ({
          error: error instanceof Error ? error.message : '레거시 보고서 목록을 불러오지 못했습니다.',
          hasCache: current.siteId === siteId && current.hasCache,
          items: current.siteId === siteId ? current.items : [],
          siteId,
          status: 'error',
        }));
      }
    },
    [currentSite?.id, currentUser?.id, isAdminView, isAuthenticated, isReady],
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
  const combinedReportItems = useMemo(() => {
    if (!isAdminView || !currentSite) {
      return reportItems;
    }

    const localSessionItems = sessions
      .filter((session) => session.siteKey === currentSite.id)
      .map((session) => mapInspectionSessionToReportListItem(session, currentSite));

    return mergeReportIndexItems(
      mergeReportIndexItems(reportItems, localSessionItems),
      adminLegacyState.siteId === currentSite.id ? adminLegacyState.items : [],
    );
  }, [adminLegacyState.items, adminLegacyState.siteId, currentSite, isAdminView, reportItems, sessions]);
  const effectiveReportIndexStatus = useMemo(() => {
    if (!isAdminView) {
      return reportIndexStatus;
    }
    if (!currentSite) {
      return reportIndexStatus === 'error' ? 'error' as const : 'loading' as const;
    }

    const legacyStateMatchesSite = adminLegacyState.siteId === currentSite.id;
    const legacyListReady =
      legacyStateMatchesSite &&
      (adminLegacyState.hasCache || adminLegacyState.status === 'loaded');
    const legacyFailedWithoutCache =
      legacyStateMatchesSite &&
      adminLegacyState.status === 'error' &&
      !adminLegacyState.hasCache;

    if (reportIndexStatus === 'error' || legacyFailedWithoutCache) {
      return 'error' as const;
    }

    if (reportIndexStatus === 'loaded' && legacyListReady) {
      return 'loaded' as const;
    }

    return 'loading' as const;
  }, [
    adminLegacyState.hasCache,
    adminLegacyState.siteId,
    adminLegacyState.status,
    currentSite,
    isAdminView,
    reportIndexStatus,
  ]);
  const effectiveReportItems = useMemo(
    () =>
      isAdminView && effectiveReportIndexStatus !== 'loaded'
        ? []
        : combinedReportItems,
    [combinedReportItems, effectiveReportIndexStatus, isAdminView],
  );
  const effectiveReportIndexError = isAdminView
    ? reportIndexError ||
      (currentSite && adminLegacyState.siteId === currentSite.id ? adminLegacyState.error : null)
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

    const safetySite = await ensureAssignedSafetySite(currentSite.id);
    const initialScheduleResponse = await fetchAllMySchedules({
      includeAll: true,
      siteId: currentSite.id,
    });
    const firstOpenSchedule = [...initialScheduleResponse.rows]
      .sort((left, right) => left.roundNo - right.roundNo)
      .find((row) => !row.linkedReportKey?.trim());
    const targetReportNumber = firstOpenSchedule?.roundNo || nextReportNumber;
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
        if (firstOpenSchedule) {
          return updateMySchedule(firstOpenSchedule.id, {
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
    const seed = await fetchTechnicalGuidanceSeed(token, currentSite.id, {
      targetVisitDate: normalizedReportDate,
      targetVisitRound: seedReportNumber,
    });
    const previousRoundAccidentOverview = buildPreviousRoundAccidentOverviewSeed(seed);
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
      document2Overview: previousRoundAccidentOverview,
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
      reports: nextReportItems.filter(isWritableReportListItem),
      schedules: scheduleRows,
    });

    if (!syncPlan.ok) {
      throw new SafetyApiError(syncPlan.message, 400);
    }

    for (const update of syncPlan.scheduleUpdates) {
      await updateMySchedule(update.scheduleId, {
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
    await saveNow({ throwOnError: true });

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
