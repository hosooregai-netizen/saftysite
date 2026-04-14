'use client';

import type { MutableRefObject } from 'react';
import { normalizeInspectionSite } from '@/constants/inspectionSession/normalizeSite';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import {
  mapInspectionSessionToReportListItem,
  mapSafetyReportListItem,
  mapSafetyReportToInspectionSession,
} from '@/lib/safetyApiMappers';
import type { SafetyMasterData, SafetyReport, SafetyUser } from '@/types/backend';
import type {
  InspectionSite,
  InspectionSession,
  SiteReportIndexState,
} from '@/types/inspectionSession';
import {
  createEmptyReportIndexState,
  mergeReportIndexItems,
  normalizeSessions,
} from './helpers';

const ADMIN_BACKGROUND_HYDRATION_DELAY_MS = 350;

export interface HydratedBaseState {
  user: SafetyUser;
  sites: InspectionSite[];
  masterData: SafetyMasterData;
}

export interface HydratedSiteState {
  user: SafetyUser;
  sites: InspectionSite[];
}

export interface InspectionSyncRequestRefs {
  reportIndexRequestsRef: MutableRefObject<Map<string, Promise<void>>>;
  sessionLoadRequestsRef: MutableRefObject<Map<string, Promise<void>>>;
  siteReportsLoadRequestsRef: MutableRefObject<Map<string, Promise<void>>>;
}

export interface InspectionSyncRuntime extends InspectionSyncRequestRefs {
  syncRequestIdRef: MutableRefObject<number>;
  hasLoadedRemoteMasterDataRef: MutableRefObject<boolean>;
  masterDataPromiseRef: MutableRefObject<Promise<SafetyMasterData> | null>;
  loadedSiteReportsRef: MutableRefObject<Set<string>>;
}

export function scheduleAdminBackgroundTask(task: () => void) {
  const idleApi = globalThis as typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
  };

  if (typeof idleApi.requestIdleCallback === 'function') {
    idleApi.requestIdleCallback(() => {
      task();
    }, { timeout: ADMIN_BACKGROUND_HYDRATION_DELAY_MS });
    return;
  }

  setTimeout(task, ADMIN_BACKGROUND_HYDRATION_DELAY_MS);
}

export function isTechnicalGuidanceReport(item: { meta?: Record<string, unknown> }) {
  const rawKind = typeof item.meta?.reportKind === 'string'
    ? item.meta.reportKind.trim().toLowerCase()
    : '';

  return !rawKind || rawKind === TECHNICAL_GUIDANCE_REPORT_KIND;
}

export function buildReportIndexState(
  base: SiteReportIndexState | null | undefined,
  patch: Partial<SiteReportIndexState>,
): SiteReportIndexState {
  return {
    ...createEmptyReportIndexState(),
    ...(base ?? {}),
    ...patch,
  };
}

export function buildLocalReportIndexItems(
  siteId: string,
  sessions: InspectionSession[],
  sites: InspectionSite[],
  dirtySessionIds: Set<string>,
) {
  const site = sites.find((item) => item.id === siteId);
  if (!site) {
    return [];
  }

  return sessions
    .filter((session) => session.siteKey === siteId && dirtySessionIds.has(session.id))
    .map((session) => mapInspectionSessionToReportListItem(session, site));
}

export function buildFallbackSiteFromReport(report: SafetyReport): InspectionSite {
  const payload =
    report.payload && typeof report.payload === 'object'
      ? (report.payload as Record<string, unknown>)
      : {};
  const snapshot =
    payload.adminSiteSnapshot && typeof payload.adminSiteSnapshot === 'object'
      ? payload.adminSiteSnapshot
      : {};
  const meta = report.meta ?? {};

  return normalizeInspectionSite({
    id: report.site_id,
    headquarterId: report.headquarter_id,
    title:
      (typeof payload.title === 'string' && payload.title) ||
      (typeof meta.siteName === 'string' && meta.siteName) ||
      report.report_title,
    siteName:
      (typeof meta.siteName === 'string' && meta.siteName) ||
      (typeof payload.siteName === 'string' && payload.siteName) ||
      report.report_title,
    assigneeName:
      (typeof meta.drafter === 'string' && meta.drafter) ||
      (typeof payload.assigneeName === 'string' && payload.assigneeName),
    adminSiteSnapshot: snapshot,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  });
}

export function mergeFetchedSiteSessions(
  siteId: string,
  fetchedSessions: InspectionSession[],
  currentSessions: InspectionSession[],
  dirtySessionIds: Set<string>,
) {
  const currentSiteSessions = currentSessions.filter((session) => session.siteKey === siteId);
  const currentSiteSessionById = new Map(
    currentSiteSessions.map((session) => [session.id, session]),
  );
  const fetchedSessionIds = new Set(fetchedSessions.map((session) => session.id));

  const mergedSiteSessions = fetchedSessions.map((session) => {
    const localSession = currentSiteSessionById.get(session.id);
    if (localSession && dirtySessionIds.has(session.id)) {
      return localSession;
    }

    return session;
  });

  currentSiteSessions.forEach((session) => {
    if (!fetchedSessionIds.has(session.id) && dirtySessionIds.has(session.id)) {
      mergedSiteSessions.push(session);
    }
  });

  return normalizeSessions([
    ...currentSessions.filter((session) => session.siteKey !== siteId),
    ...mergedSiteSessions,
  ]);
}

export function buildRemoteSiteSessions(
  reports: SafetyReport[],
  site: InspectionSite,
  masterData: SafetyMasterData,
) {
  return reports
    .filter(isTechnicalGuidanceReport)
    .map((report) => mapSafetyReportToInspectionSession(report, site, masterData));
}

export function buildMergedReportIndexItems(
  reports: SafetyReport[],
  siteId: string,
  sessions: InspectionSession[],
  sites: InspectionSite[],
  dirtySessionIds: Set<string>,
) {
  const remoteItems = reports
    .filter(isTechnicalGuidanceReport)
    .map(mapSafetyReportListItem);
  const localItems = buildLocalReportIndexItems(siteId, sessions, sites, dirtySessionIds);
  return mergeReportIndexItems(remoteItems, localItems);
}

export function hasActiveReportHydrationRequests(requests: InspectionSyncRequestRefs) {
  return (
    requests.reportIndexRequestsRef.current.size > 0 ||
    requests.sessionLoadRequestsRef.current.size > 0 ||
    requests.siteReportsLoadRequestsRef.current.size > 0
  );
}

export function resetInspectionSyncRuntime(runtime: InspectionSyncRuntime) {
  runtime.hasLoadedRemoteMasterDataRef.current = false;
  runtime.masterDataPromiseRef.current = null;
  runtime.reportIndexRequestsRef.current.clear();
  runtime.sessionLoadRequestsRef.current.clear();
  runtime.siteReportsLoadRequestsRef.current.clear();
  runtime.loadedSiteReportsRef.current.clear();
}
