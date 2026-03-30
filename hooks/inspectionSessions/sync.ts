'use client';

import { startTransition, useCallback, useEffect, useRef } from 'react';
import { normalizeInspectionSite } from '@/constants/inspectionSession/normalizeSite';
import { readPersistedValue } from '@/lib/clientPersistence';
import {
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
  fetchSafetyReportByKey,
  fetchSafetyReportList,
  loginSafetyApi,
  readSafetyAuthToken,
  writeSafetyAuthToken,
} from '@/lib/safetyApi';
import { primeControllerDashboardData } from '@/hooks/controller/useControllerDashboard';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import {
  buildSafetyMasterData,
  isSafetyAdmin,
  mapSafetyReportListItem,
  mapSafetyReportToInspectionSession,
  mapSafetySiteToInspectionSite,
  mergeMasterDataIntoSession,
} from '@/lib/safetyApiMappers';
import type {
  SafetyLoginInput,
  SafetyMasterData,
  SafetyReport,
  SafetyUser,
} from '@/types/backend';
import type {
  InspectionSite,
  InspectionSession,
  SiteReportIndexState,
} from '@/types/inspectionSession';
import {
  createEmptyReportIndexState,
  EMPTY_MASTER_DATA,
  getErrorMessage,
  isAuthFailure,
  mergeReportIndexItems,
  normalizeSessions,
  SITE_STORAGE_KEY,
  STORAGE_KEY,
  USER_STORAGE_KEY,
} from './helpers';
import type { InspectionSessionsStore } from './store';

const ADMIN_BACKGROUND_HYDRATION_DELAY_MS = 350;
const PERSISTED_BOOTSTRAP_TIMEOUT_MS = 250;

interface HydratedBaseState {
  user: SafetyUser;
  sites: InspectionSite[];
  masterData: SafetyMasterData;
}

interface HydratedSiteState {
  user: SafetyUser;
  sites: InspectionSite[];
}

function scheduleAdminBackgroundTask(task: () => void) {
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

function isTechnicalGuidanceReport(item: { meta?: Record<string, unknown> }) {
  const rawKind = typeof item.meta?.reportKind === 'string'
    ? item.meta.reportKind.trim().toLowerCase()
    : '';

  return !rawKind || rawKind === TECHNICAL_GUIDANCE_REPORT_KIND;
}

function buildReportIndexState(
  base: SiteReportIndexState | null | undefined,
  patch: Partial<SiteReportIndexState>,
): SiteReportIndexState {
  return {
    ...createEmptyReportIndexState(),
    ...(base ?? {}),
    ...patch,
  };
}

function buildFallbackSiteFromReport(report: SafetyReport): InspectionSite {
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

export function useInspectionSessionsSync(store: InspectionSessionsStore) {
  const {
    authTokenRef,
    clearAuthState,
    masterDataRef,
    persistCurrentUser,
    persistSessions,
    persistSites,
    reportIndexBySiteIdRef,
    resetSessionVersions,
    setAuthError,
    setCurrentUser,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsHydratingReports,
    setIsReady,
    setMasterData,
    setReportIndexBySiteId,
    setSessionState,
    setSiteState,
    setSyncError,
    sessionsRef,
    sitesRef,
  } = store;
  const syncRequestIdRef = useRef(0);
  const hasLoadedRemoteMasterDataRef = useRef(false);
  const masterDataPromiseRef = useRef<Promise<SafetyMasterData> | null>(null);
  const reportIndexRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const sessionLoadRequestsRef = useRef<Map<string, Promise<void>>>(new Map());

  const applyMasterDataToSessions = useCallback(
    async (masterData: SafetyMasterData) => {
      const nextSessions = sessionsRef.current.map((session) =>
        mergeMasterDataIntoSession(session, masterData),
      );

      masterDataRef.current = masterData;
      hasLoadedRemoteMasterDataRef.current = true;

      startTransition(() => {
        setMasterData(masterData);
        setSessionState(nextSessions);
      });

      void persistSessions(nextSessions).catch(() => {
        // Ignore cache persistence failures during optimistic sync.
      });
    },
    [masterDataRef, persistSessions, sessionsRef, setMasterData, setSessionState],
  );

  const hydrateRemoteSiteState = useCallback(
    async (token: string, preloadedUser?: SafetyUser): Promise<HydratedSiteState> => {
      const user = preloadedUser ?? (await fetchCurrentSafetyUser(token));
      const rawSites = await fetchAssignedSafetySites(token);
      return {
        user,
        sites: rawSites.map(mapSafetySiteToInspectionSite),
      };
    },
    [],
  );

  const hydrateRemoteMasterData = useCallback(async (token: string) => {
    const contentItems = await fetchSafetyContentItems(token);
    return buildSafetyMasterData(contentItems);
  }, []);

  const applyImmediateUserState = useCallback(
    async (user: SafetyUser, token: string) => {
      authTokenRef.current = token;

      startTransition(() => {
        setCurrentUser(user);
      });

      setIsReady(true);
      void persistCurrentUser(user).catch(() => {
        // Ignore cache persistence failures during optimistic boot.
      });
    },
    [authTokenRef, persistCurrentUser, setCurrentUser, setIsReady],
  );

  const applyHydratedBaseState = useCallback(
    async (data: HydratedBaseState, token: string) => {
      authTokenRef.current = token;
      masterDataRef.current = data.masterData;

      startTransition(() => {
        setCurrentUser(data.user);
        setMasterData(data.masterData);
        setSiteState(data.sites);
      });

      void Promise.all([persistCurrentUser(data.user), persistSites(data.sites)]).catch(() => {
        // Ignore cache persistence failures during optimistic boot.
      });
    },
    [
      authTokenRef,
      masterDataRef,
      persistCurrentUser,
      persistSites,
      setCurrentUser,
      setMasterData,
      setSiteState,
    ],
  );

  const applyHydratedSessions = useCallback(
    async (sessions: InspectionSession[]) => {
      startTransition(() => {
        setSessionState(sessions);
        resetSessionVersions(sessions);
      });
      void persistSessions(sessions).catch(() => {
        // Ignore cache persistence failures during optimistic sync.
      });
    },
    [persistSessions, resetSessionVersions, setSessionState],
  );

  const refreshMasterData = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) return;

    const masterData = await hydrateRemoteMasterData(token);
    await applyMasterDataToSessions(masterData);
  }, [applyMasterDataToSessions, authTokenRef, hydrateRemoteMasterData]);

  const ensureMasterDataLoaded = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) return;
    if (hasLoadedRemoteMasterDataRef.current) return;

    if (!masterDataPromiseRef.current) {
      masterDataPromiseRef.current = hydrateRemoteMasterData(token).finally(() => {
        masterDataPromiseRef.current = null;
      });
    }

    try {
      const masterData = await masterDataPromiseRef.current;
      if (authTokenRef.current !== token) {
        return;
      }

      await applyMasterDataToSessions(masterData);
    } catch (error) {
      if (isAuthFailure(error)) {
        syncRequestIdRef.current += 1;
        clearAuthState();
        setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        return;
      }

      setDataError(getErrorMessage(error));
    }
  }, [
    applyMasterDataToSessions,
    authTokenRef,
    clearAuthState,
    hydrateRemoteMasterData,
    setAuthError,
    setDataError,
  ]);

  const ensureSiteReportIndexLoaded = useCallback(
    async (siteId: string) => {
      const token = authTokenRef.current;
      if (!token) {
        return;
      }

      const existingState = reportIndexBySiteIdRef.current[siteId];
      if (existingState?.status === 'loaded') {
        return;
      }

      const inFlightRequest = reportIndexRequestsRef.current.get(siteId);
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
      setIsHydratingReports(true);

      const request = (async () => {
        try {
          const reports = await fetchSafetyReportList(token, {
            siteId,
            activeOnly: true,
          });

          if (authTokenRef.current !== token) {
            return;
          }

          const items = reports
            .filter(isTechnicalGuidanceReport)
            .map(mapSafetyReportListItem);

          setReportIndexBySiteId((current) => ({
            ...current,
            [siteId]: buildReportIndexState(current[siteId], {
              status: 'loaded',
              items,
              fetchedAt: new Date().toISOString(),
              error: null,
            }),
          }));
        } catch (error) {
          if (isAuthFailure(error)) {
            syncRequestIdRef.current += 1;
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
          }
        } finally {
          reportIndexRequestsRef.current.delete(siteId);
          setIsHydratingReports(
            reportIndexRequestsRef.current.size > 0 || sessionLoadRequestsRef.current.size > 0,
          );
        }
      })();

      reportIndexRequestsRef.current.set(siteId, request);
      return request;
    },
    [
      authTokenRef,
      clearAuthState,
      reportIndexBySiteIdRef,
      setAuthError,
      setDataError,
      setIsHydratingReports,
      setReportIndexBySiteId,
    ],
  );

  const ensureSessionLoaded = useCallback(
    async (reportKey: string) => {
      const token = authTokenRef.current;
      if (!token) {
        return;
      }

      if (sessionsRef.current.some((session) => session.id === reportKey)) {
        return;
      }

      const inFlightRequest = sessionLoadRequestsRef.current.get(reportKey);
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
          await applyHydratedSessions(mergedSessions);
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
            syncRequestIdRef.current += 1;
            clearAuthState();
            setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          } else {
            setDataError(getErrorMessage(error));
          }
        } finally {
          sessionLoadRequestsRef.current.delete(reportKey);
          setIsHydratingReports(
            reportIndexRequestsRef.current.size > 0 || sessionLoadRequestsRef.current.size > 0,
          );
        }
      })();

      sessionLoadRequestsRef.current.set(reportKey, request);
      return request;
    },
    [
      applyHydratedSessions,
      authTokenRef,
      clearAuthState,
      masterDataRef,
      persistSites,
      sessionsRef,
      setAuthError,
      setDataError,
      setIsHydratingReports,
      setReportIndexBySiteId,
      setSiteState,
      sitesRef,
    ],
  );

  const bootWithUser = useCallback(
    async (token: string, user: SafetyUser, requestId: number) => {
      if (
        syncRequestIdRef.current !== requestId ||
        authTokenRef.current !== token
      ) {
        return;
      }

      if (isSafetyAdmin(user)) {
        const coreDataPromise = primeControllerDashboardData(token);
        await applyImmediateUserState(user, token);

        scheduleAdminBackgroundTask(() => {
          if (
            syncRequestIdRef.current !== requestId ||
            authTokenRef.current !== token
          ) {
            return;
          }

          void (async () => {
            try {
              const { sites } = await coreDataPromise;

              if (
                syncRequestIdRef.current !== requestId ||
                authTokenRef.current !== token
              ) {
                return;
              }

              await applyHydratedBaseState(
                {
                  user,
                  sites: sites.map(mapSafetySiteToInspectionSite),
                  masterData: EMPTY_MASTER_DATA,
                },
                token,
              );
            } catch (error) {
              if (
                syncRequestIdRef.current !== requestId ||
                authTokenRef.current !== token
              ) {
                return;
              }

              if (isAuthFailure(error)) {
                syncRequestIdRef.current += 1;
                clearAuthState();
                setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
              } else {
                setDataError(getErrorMessage(error));
              }
            }
          })();
        });

        return;
      }

      const siteState = await hydrateRemoteSiteState(token, user);

      if (
        syncRequestIdRef.current !== requestId ||
        authTokenRef.current !== token
      ) {
        return;
      }

      await applyHydratedBaseState(
        {
          ...siteState,
          masterData: EMPTY_MASTER_DATA,
        },
        token,
      );

      if (
        syncRequestIdRef.current !== requestId ||
        authTokenRef.current !== token
      ) {
        return;
      }

      setIsReady(true);
    },
    [
      applyHydratedBaseState,
      applyImmediateUserState,
      authTokenRef,
      clearAuthState,
      hydrateRemoteSiteState,
      setAuthError,
      setDataError,
      setIsReady,
    ],
  );

  const hydrateAndSync = useCallback(
    async (token: string) => {
      const requestId = ++syncRequestIdRef.current;
      setDataError(null);

      try {
        const user = await fetchCurrentSafetyUser(token);
        await bootWithUser(token, user, requestId);
      } catch (error) {
        if (isAuthFailure(error)) {
          syncRequestIdRef.current += 1;
          clearAuthState();
          setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        } else {
          setDataError(getErrorMessage(error));
        }
        setIsReady(true);
      }
    },
    [bootWithUser, clearAuthState, setAuthError, setDataError, setIsReady],
  );

  const reload = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) {
      setHasAuthToken(false);
      setIsHydrating(false);
      setIsReady(true);
      return;
    }

    setHasAuthToken(true);
    setDataError(null);
    setIsHydrating(true);

    try {
      await hydrateAndSync(token);
    } finally {
      setIsHydrating(false);
      setIsReady(true);
    }
  }, [
    authTokenRef,
    hydrateAndSync,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsReady,
  ]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const token = readSafetyAuthToken();
      if (!token) {
        hasLoadedRemoteMasterDataRef.current = false;
        masterDataPromiseRef.current = null;
        reportIndexRequestsRef.current.clear();
        sessionLoadRequestsRef.current.clear();
        setHasAuthToken(false);
        setIsReady(true);
        return;
      }

      const cachedBootstrapPromise = Promise.all([
        readPersistedValue<InspectionSession[]>(STORAGE_KEY),
        readPersistedValue<InspectionSite[]>(SITE_STORAGE_KEY),
        readPersistedValue<SafetyUser>(USER_STORAGE_KEY),
      ]);
      const cachedBootstrapResult = await Promise.race([
        cachedBootstrapPromise.then((value) => ({ timedOut: false, value })),
        new Promise<{
          timedOut: true;
          value: [null, null, null];
        }>((resolve) =>
          window.setTimeout(
            () => resolve({ timedOut: true, value: [null, null, null] }),
            PERSISTED_BOOTSTRAP_TIMEOUT_MS,
          ),
        ),
      ]);
      if (cancelled) return;

      const [cachedSessions, cachedSites, cachedUser] = cachedBootstrapResult.value;
      if (cachedSites?.length) {
        setSiteState(cachedSites);
      }
      if (cachedSessions?.length) {
        setSessionState(cachedSessions);
        resetSessionVersions(cachedSessions);
      }

      authTokenRef.current = token;
      setHasAuthToken(true);

      if (cachedUser) {
        setCurrentUser(cachedUser);
        setIsReady(true);
      }

      setIsHydrating(true);
      try {
        await hydrateAndSync(token);
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
          setIsReady(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    authTokenRef,
    hydrateAndSync,
    resetSessionVersions,
    setCurrentUser,
    setHasAuthToken,
    setIsHydrating,
    setIsReady,
    setSessionState,
    setSiteState,
  ]);

  const login = useCallback(
    async (input: SafetyLoginInput) => {
      setAuthError(null);
      setDataError(null);
      setSyncError(null);
      setHasAuthToken(false);
      setIsHydrating(true);
      setIsHydratingReports(false);
      setIsReady(false);
      hasLoadedRemoteMasterDataRef.current = false;
      masterDataPromiseRef.current = null;
      reportIndexRequestsRef.current.clear();
      sessionLoadRequestsRef.current.clear();
      setReportIndexBySiteId({});

      try {
        const token = await loginSafetyApi(input);
        writeSafetyAuthToken(token.access_token);
        authTokenRef.current = token.access_token;
        setHasAuthToken(true);

        const requestId = ++syncRequestIdRef.current;
        const user = await fetchCurrentSafetyUser(token.access_token);
        await bootWithUser(token.access_token, user, requestId);
      } catch (error) {
        syncRequestIdRef.current += 1;
        clearAuthState();
        setAuthError(getErrorMessage(error));
        throw error;
      } finally {
        setIsHydrating(false);
        setIsReady(true);
      }
    },
    [
      authTokenRef,
      bootWithUser,
      clearAuthState,
      setAuthError,
      setDataError,
      setHasAuthToken,
      setIsHydrating,
      setIsHydratingReports,
      setIsReady,
      setReportIndexBySiteId,
      setSyncError,
    ],
  );

  const logout = useCallback(() => {
    syncRequestIdRef.current += 1;
    hasLoadedRemoteMasterDataRef.current = false;
    masterDataPromiseRef.current = null;
    reportIndexRequestsRef.current.clear();
    sessionLoadRequestsRef.current.clear();
    clearAuthState();
    setReportIndexBySiteId({});
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(true);
  }, [clearAuthState, setAuthError, setDataError, setIsReady, setReportIndexBySiteId, setSyncError]);

  return {
    ensureMasterDataLoaded,
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    ensureSiteReportsLoaded: ensureSiteReportIndexLoaded,
    login,
    logout,
    refreshMasterData,
    reload,
  };
}
