'use client';

import { useCallback } from 'react';
import { normalizeInspectionSite } from '@/constants/inspectionSession/normalizeSite';
import { SafetyApiError } from '@/lib/safetyApi';
import {
  fetchSafetyReportByKey,
  fetchSafetyReportList,
  fetchSafetyReportsBySite,
} from '@/lib/safetyApi';
import { mapSafetyReportListItem, mapSafetyReportToInspectionSession } from '@/lib/safetyApiMappers';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import {
  getReportCacheFreshness,
  shouldSurfaceCacheError,
  shouldUseBlockingReload,
} from '@/lib/reportCachePolicy';
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

interface ReportLoaderActions {
  applyHydratedSessions: (
    sessions: import('@/types/inspectionSession').InspectionSession[],
  ) => Promise<void>;
  removeSessionFromLocalState: (reportKey: string) => Promise<void>;
}

export function useInspectionSessionReportLoaders(
  store: InspectionSessionsStore,
  runtime: InspectionSyncRuntime,
  actions: ReportLoaderActions,
) {
  const {
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

          const site =
            sitesRef.current.find((item) => item.id === report.site_id) ??
            buildFallbackSiteFromReport(report);
          const nextSession = mapSafetyReportToInspectionSession(
            report,
            site,
            masterDataRef.current,
          );

          if (!sitesRef.current.some((item) => item.id === site.id)) {
            const nextSites = [...sitesRef.current, site];
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
          const fallbackSite = technicalReports[0]
            ? buildFallbackSiteFromReport(technicalReports[0])
            : null;
          const site =
            sitesRef.current.find((item) => item.id === siteId) ??
            fallbackSite;

          if (site && !sitesRef.current.some((item) => item.id === site.id)) {
            const nextSites = [...sitesRef.current, site];
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

          const nextSites = site && !sitesRef.current.some((item) => item.id === site.id)
            ? [...sitesRef.current, site]
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
