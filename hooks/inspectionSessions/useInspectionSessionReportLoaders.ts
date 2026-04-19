'use client';

import { useCallback } from 'react';
import { mergeAdminSiteSnapshots, normalizeInspectionSite } from '@/constants/inspectionSession/normalizeSite';
import { SafetyApiError } from '@/lib/safetyApi';
import {
  fetchSafetyReportByKey,
  fetchSafetyReportList,
  fetchSafetyReportsBySite,
} from '@/lib/safetyApi';
import {
  mapSafetyReportListItem,
  mapSafetyReportToInspectionSession,
  mapSafetySiteToInspectionSite,
} from '@/lib/safetyApiMappers';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import {
  getReportCacheFreshness,
  shouldSurfaceCacheError,
  shouldUseBlockingReload,
} from '@/lib/reportCachePolicy';
import type { SafetyReport } from '@/types/backend';
import { getErrorMessage, isAuthFailure, mergeReportIndexItems, normalizeSessions } from './helpers';
import type { InspectionSessionsStore } from './store';
import {
  buildFallbackSiteFromReport,
  buildLocalReportIndexItems,
  buildReportIndexState,
  hasActiveReportHydrationRequests,
  isTechnicalGuidanceReport,
  mergeFetchedSiteSessions,
  type InspectionSyncRuntime,
} from './syncSupport';
import type { InspectionSite } from '@/types/inspectionSession';

interface ReportLoaderActions {
  applyHydratedSessions: (
    sessions: import('@/types/inspectionSession').InspectionSession[],
  ) => Promise<void>;
  removeSessionFromLocalState: (reportKey: string) => Promise<void>;
}

function mergePreferredSite(
  primary: InspectionSite | null,
  fallback: InspectionSite | null,
): InspectionSite | null {
  if (!primary) return fallback;
  if (!fallback) return primary;

  return normalizeInspectionSite({
    ...fallback,
    ...primary,
    headquarterId: primary.headquarterId || fallback.headquarterId,
    title: primary.title || fallback.title,
    customerName: primary.customerName || fallback.customerName,
    siteName: primary.siteName || fallback.siteName,
    assigneeName: primary.assigneeName || fallback.assigneeName,
    adminSiteSnapshot: mergeAdminSiteSnapshots(
      primary.adminSiteSnapshot,
      fallback.adminSiteSnapshot,
    ),
    createdAt: primary.createdAt || fallback.createdAt,
    updatedAt: primary.updatedAt || fallback.updatedAt,
  });
}

function hasSiteChanged(current: InspectionSite | null, next: InspectionSite) {
  if (!current) return true;

  if (
    current.headquarterId !== next.headquarterId ||
    current.title !== next.title ||
    current.customerName !== next.customerName ||
    current.siteName !== next.siteName ||
    current.assigneeName !== next.assigneeName
  ) {
    return true;
  }

  return Object.keys(current.adminSiteSnapshot).some((key) => {
    const typedKey = key as keyof InspectionSite['adminSiteSnapshot'];
    return current.adminSiteSnapshot[typedKey] !== next.adminSiteSnapshot[typedKey];
  });
}

export function useInspectionSessionReportLoaders(
  store: InspectionSessionsStore,
  runtime: InspectionSyncRuntime,
  actions: ReportLoaderActions,
) {
  const {
    assignedSafetySitesByIdRef,
    authTokenRef,
    clearAuthState,
    dirtySessionIdsRef,
    masterDataRef,
    persistSites,
    reportIndexBySiteIdRef,
    sessionsRef,
    setAuthError,
    setDataError,
    setIsHydratingReports,
    setReportIndexBySiteId,
    setSiteRelationsStatusBySiteId,
    setSiteState,
    sitesRef,
  } = store;

  const resolveKnownSite = useCallback(
    (siteId: string, fallbackReport?: SafetyReport | null) => {
      const currentSite = sitesRef.current.find((item) => item.id === siteId) ?? null;
      const assignedSite = assignedSafetySitesByIdRef.current.has(siteId)
        ? mapSafetySiteToInspectionSite(assignedSafetySitesByIdRef.current.get(siteId)!)
        : null;
      const fallbackSite =
        fallbackReport && fallbackReport.site_id === siteId
          ? buildFallbackSiteFromReport(fallbackReport)
          : null;

      return mergePreferredSite(
        mergePreferredSite(currentSite, assignedSite),
        fallbackSite,
      );
    },
    [assignedSafetySitesByIdRef, sitesRef],
  );

  const ensureSiteReportIndexLoaded = useCallback(
    async (siteId: string, options?: { force?: boolean }) => {
      const token = authTokenRef.current;
      if (!token) {
        return;
      }

      const existingState = reportIndexBySiteIdRef.current[siteId];
      const freshness = getReportCacheFreshness(existingState?.fetchedAt);
      const hasCachedItems = Boolean(existingState?.items.length);
      const shouldBlock = shouldUseBlockingReload({
        force: options?.force,
        freshness,
        hasVisibleData: hasCachedItems,
      });

      if (!options?.force && hasCachedItems && freshness === 'fresh') {
        return;
      }

      const inFlightRequest = runtime.reportIndexRequestsRef.current.get(siteId);
      if (inFlightRequest) {
        return inFlightRequest;
      }

      if (shouldBlock) {
        setReportIndexBySiteId((current) => ({
          ...current,
          [siteId]: buildReportIndexState(current[siteId], {
            status: 'loading',
            error: null,
          }),
        }));
      }
      setIsHydratingReports(true);

      const request = (async () => {
        try {
          const reports = await fetchSafetyReportList(token, {
            siteId,
            activeOnly: true,
            reportKinds: [TECHNICAL_GUIDANCE_REPORT_KIND],
          });

          if (authTokenRef.current !== token) {
            return;
          }

          const items = reports
            .filter(isTechnicalGuidanceReport)
            .map(mapSafetyReportListItem);
          const localItems = buildLocalReportIndexItems(
            siteId,
            sessionsRef.current,
            sitesRef.current,
            dirtySessionIdsRef.current,
          );

          setReportIndexBySiteId((current) => ({
            ...current,
            [siteId]: buildReportIndexState(current[siteId], {
              status: 'loaded',
              items: mergeReportIndexItems(items, localItems),
              fetchedAt: new Date().toISOString(),
              error: null,
            }),
          }));
        } catch (error) {
          if (isAuthFailure(error)) {
            runtime.syncRequestIdRef.current += 1;
            clearAuthState();
            setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          } else {
            const message = getErrorMessage(error);
            const shouldKeepVisibleCache =
              hasCachedItems &&
              !shouldBlock &&
              !shouldSurfaceCacheError({
                force: options?.force,
                hasVisibleData: hasCachedItems,
              });

            if (shouldKeepVisibleCache) {
              setReportIndexBySiteId((current) => ({
                ...current,
                [siteId]: buildReportIndexState(current[siteId], {
                  status: 'loaded',
                  error: null,
                }),
              }));
            } else {
              setDataError(message);
              setReportIndexBySiteId((current) => ({
                ...current,
                [siteId]: buildReportIndexState(current[siteId], {
                  status: 'error',
                  error: message,
                }),
              }));
            }
          }
        } finally {
          runtime.reportIndexRequestsRef.current.delete(siteId);
          setIsHydratingReports(hasActiveReportHydrationRequests(runtime));
        }
      })();

      runtime.reportIndexRequestsRef.current.set(siteId, request);
      return request;
    },
    [
      authTokenRef,
      clearAuthState,
      dirtySessionIdsRef,
      reportIndexBySiteIdRef,
      runtime,
      sessionsRef,
      setAuthError,
      setDataError,
      setIsHydratingReports,
      setReportIndexBySiteId,
      sitesRef,
    ],
  );

  const ensureSessionLoaded = useCallback(
    async (reportKey: string, options?: { force?: boolean }) => {
      const token = authTokenRef.current;
      if (!token) {
        return;
      }

      const hasLocalSession = sessionsRef.current.some((session) => session.id === reportKey);
      const hasDirtyLocalSession = dirtySessionIdsRef.current.has(reportKey);

      if (!options?.force && hasLocalSession && hasDirtyLocalSession) {
        return;
      }

      const inFlightRequest = runtime.sessionLoadRequestsRef.current.get(reportKey);
      if (inFlightRequest) {
        return inFlightRequest;
      }

      setIsHydratingReports(true);

      const request = (async () => {
        try {
          const report = await fetchSafetyReportByKey(token, reportKey);

          if (authTokenRef.current !== token) {
            return;
          }

          const site = resolveKnownSite(report.site_id, report) ?? buildFallbackSiteFromReport(report);
          const nextSession = mapSafetyReportToInspectionSession(
            report,
            site,
            masterDataRef.current,
          );

          const currentSite = sitesRef.current.find((item) => item.id === site.id) ?? null;
          if (hasSiteChanged(currentSite, site)) {
            const nextSites = currentSite
              ? sitesRef.current.map((item) => (item.id === site.id ? site : item))
              : [...sitesRef.current, site];
            setSiteState(nextSites);
            void persistSites(nextSites).catch(() => {
              // Ignore cache persistence failures during detail hydration.
            });
          }

          const mergedSessions = normalizeSessions([
            ...sessionsRef.current.filter((session) => session.id !== reportKey),
            nextSession,
          ]);
          await actions.applyHydratedSessions(mergedSessions);
          setReportIndexBySiteId((current) => ({
            ...current,
            [site.id]: buildReportIndexState(current[site.id], {
              status: 'loaded',
              items: mergeReportIndexItems(
                current[site.id]?.items ?? [],
                [mapSafetyReportListItem(report)],
              ),
              fetchedAt: current[site.id]?.fetchedAt ?? new Date().toISOString(),
              error: null,
            }),
          }));
        } catch (error) {
          if (isAuthFailure(error)) {
            runtime.syncRequestIdRef.current += 1;
            clearAuthState();
            setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          } else if (error instanceof SafetyApiError && error.status === 404) {
            await actions.removeSessionFromLocalState(reportKey);
          } else {
            setDataError(getErrorMessage(error));
          }
        } finally {
          runtime.sessionLoadRequestsRef.current.delete(reportKey);
          setIsHydratingReports(hasActiveReportHydrationRequests(runtime));
        }
      })();

      runtime.sessionLoadRequestsRef.current.set(reportKey, request);
      return request;
    },
    [
      actions,
      authTokenRef,
      clearAuthState,
      dirtySessionIdsRef,
      masterDataRef,
      persistSites,
      resolveKnownSite,
      runtime,
      sessionsRef,
      setAuthError,
      setDataError,
      setIsHydratingReports,
      setReportIndexBySiteId,
      setSiteState,
      sitesRef,
    ],
  );

  const ensureSiteReportsLoaded = useCallback(
    async (siteId: string, options?: { force?: boolean }) => {
      const token = authTokenRef.current;
      if (!token) {
        return;
      }

      if (!options?.force && runtime.loadedSiteReportsRef.current.has(siteId)) {
        setSiteRelationsStatusBySiteId((current) => ({
          ...current,
          [siteId]: 'loaded',
        }));
        return;
      }

      const inFlightRequest = runtime.siteReportsLoadRequestsRef.current.get(siteId);
      if (inFlightRequest) {
        return inFlightRequest;
      }

      setReportIndexBySiteId((current) => ({
        ...current,
        [siteId]: buildReportIndexState(current[siteId], {
          status: 'loading',
          error: null,
        }),
      }));
      setSiteRelationsStatusBySiteId((current) => ({
        ...current,
        [siteId]: 'loading',
      }));
      setIsHydratingReports(true);

      const request = (async () => {
        try {
          const reports = await fetchSafetyReportsBySite(token, siteId);

          if (authTokenRef.current !== token) {
            return;
          }

          const technicalReports = reports.filter(isTechnicalGuidanceReport);
          const site = resolveKnownSite(siteId, technicalReports[0] ?? null);
          const currentSite = site
            ? sitesRef.current.find((item) => item.id === site.id) ?? null
            : null;

          if (site && hasSiteChanged(currentSite, site)) {
            const nextSites = currentSite
              ? sitesRef.current.map((item) => (item.id === site.id ? site : item))
              : [...sitesRef.current, site];
            setSiteState(nextSites);
            void persistSites(nextSites).catch(() => {
              // Ignore cache persistence failures during detail hydration.
            });
          }

          const resolvedSite =
            site ??
            normalizeInspectionSite({
              id: siteId,
            });
          const nextSessions = mergeFetchedSiteSessions(
            siteId,
            technicalReports.map((report) =>
              mapSafetyReportToInspectionSession(
                report,
                resolvedSite,
                masterDataRef.current,
              ),
            ),
            sessionsRef.current,
            dirtySessionIdsRef.current,
          );

          await actions.applyHydratedSessions(nextSessions);
          runtime.loadedSiteReportsRef.current.add(siteId);

          const nextSites = site
            ? currentSite
              ? sitesRef.current.map((item) => (item.id === site.id ? site : item))
              : [...sitesRef.current, site]
            : sitesRef.current;
          const localItems = buildLocalReportIndexItems(
            siteId,
            nextSessions,
            nextSites,
            dirtySessionIdsRef.current,
          );

          setReportIndexBySiteId((current) => ({
            ...current,
            [siteId]: buildReportIndexState(current[siteId], {
              status: 'loaded',
              items: mergeReportIndexItems(
                technicalReports.map(mapSafetyReportListItem),
                localItems,
              ),
              fetchedAt: new Date().toISOString(),
              error: null,
            }),
          }));
          setSiteRelationsStatusBySiteId((current) => ({
            ...current,
            [siteId]: 'loaded',
          }));
        } catch (error) {
          if (isAuthFailure(error)) {
            runtime.syncRequestIdRef.current += 1;
            clearAuthState();
            setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          } else {
            const message = getErrorMessage(error);
            setDataError(message);
            setReportIndexBySiteId((current) => ({
              ...current,
              [siteId]: buildReportIndexState(current[siteId], {
                status: 'error',
                error: message,
              }),
            }));
            setSiteRelationsStatusBySiteId((current) => ({
              ...current,
              [siteId]: 'error',
            }));
          }
        } finally {
          runtime.siteReportsLoadRequestsRef.current.delete(siteId);
          setIsHydratingReports(hasActiveReportHydrationRequests(runtime));
        }
      })();

      runtime.siteReportsLoadRequestsRef.current.set(siteId, request);
      return request;
    },
    [
      actions,
      authTokenRef,
      clearAuthState,
      dirtySessionIdsRef,
      masterDataRef,
      persistSites,
      resolveKnownSite,
      runtime,
      sessionsRef,
      setAuthError,
      setDataError,
      setIsHydratingReports,
      setReportIndexBySiteId,
      setSiteRelationsStatusBySiteId,
      setSiteState,
      sitesRef,
    ],
  );

  return {
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    ensureSiteReportsLoaded,
  };
}
