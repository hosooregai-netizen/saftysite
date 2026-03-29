'use client';

import { startTransition, useCallback, useEffect, useRef } from 'react';
import { readPersistedValue } from '@/lib/clientPersistence';
import {
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
  fetchSafetyReportsBySite,
  loginSafetyApi,
  readSafetyAuthToken,
  writeSafetyAuthToken,
} from '@/lib/safetyApi';
import { primeControllerDashboardData } from '@/hooks/controller/useControllerDashboard';
import {
  getStoredReportKind,
  TECHNICAL_GUIDANCE_REPORT_KIND,
} from '@/lib/erpReports/shared';
import {
  buildSafetyMasterData,
  isSafetyAdmin,
  mapSafetyReportToInspectionSession,
  mapSafetySiteToInspectionSite,
  mergeMasterDataIntoSession,
} from '@/lib/safetyApiMappers';
import type {
  SafetyLoginInput,
  SafetyMasterData,
  SafetyUser,
} from '@/types/backend';
import type { InspectionSite, InspectionSession } from '@/types/inspectionSession';
import {
  EMPTY_MASTER_DATA,
  getErrorMessage,
  isAuthFailure,
  normalizeSessions,
  SITE_STORAGE_KEY,
  STORAGE_KEY,
  USER_STORAGE_KEY,
} from './helpers';
import type { InspectionSessionsStore } from './store';

const REPORT_FETCH_CONCURRENCY = 6;
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

export function useInspectionSessionsSync(store: InspectionSessionsStore) {
  const {
    authTokenRef,
    clearAuthState,
    masterDataRef,
    persistCurrentUser,
    persistSessions,
    persistSites,
    resetSessionVersions,
    setAuthError,
    setCurrentUser,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsHydratingReports,
    setIsReady,
    setMasterData,
    setSessionState,
    setSiteState,
    setSyncError,
    sessionsRef,
    sitesRef,
  } = store;
  const syncRequestIdRef = useRef(0);
  const hasLoadedRemoteMasterDataRef = useRef(false);
  const masterDataPromiseRef = useRef<Promise<SafetyMasterData> | null>(null);
  const loadedReportSiteIdsRef = useRef<Set<string>>(new Set());

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

  const hydrateRemoteSessions = useCallback(
    async (
      token: string,
      sites: InspectionSite[],
      masterData: SafetyMasterData,
    ): Promise<InspectionSession[]> => {
      if (sites.length === 0) return [];

      const pendingSites = [...sites];
      const reportGroups: Array<{
        reports: Awaited<ReturnType<typeof fetchSafetyReportsBySite>>;
        site: InspectionSite;
      }> = [];
      const workerCount = Math.min(REPORT_FETCH_CONCURRENCY, pendingSites.length);

      await Promise.all(
        Array.from({ length: workerCount }, async () => {
          while (pendingSites.length > 0) {
            const site = pendingSites.shift();
            if (!site) return;

            const reports = await fetchSafetyReportsBySite(token, site.id);
            reportGroups.push({ site, reports });
          }
        }),
      );

      return normalizeSessions(
        reportGroups.flatMap(({ site, reports }) =>
          reports
            .filter(
              (report) => getStoredReportKind(report) === TECHNICAL_GUIDANCE_REPORT_KIND,
            )
            .map((report) =>
              mapSafetyReportToInspectionSession(report, site, masterData),
            ),
        ),
      );
    },
    [],
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

  const ensureSiteReportsLoaded = useCallback(
    async (siteId: string) => {
      const token = authTokenRef.current;
      if (!token || loadedReportSiteIdsRef.current.has(siteId)) {
        return;
      }

      const site = sitesRef.current.find((item) => item.id === siteId);
      if (!site) {
        return;
      }

      setIsHydratingReports(true);

      try {
        const reports = await fetchSafetyReportsBySite(token, site.id);

        if (authTokenRef.current !== token) {
          return;
        }

        const technicalGuidanceSessions = reports
          .filter(
            (report) => getStoredReportKind(report) === TECHNICAL_GUIDANCE_REPORT_KIND,
          )
          .map((report) =>
            mapSafetyReportToInspectionSession(report, site, masterDataRef.current),
          );

        const mergedSessions = normalizeSessions([
          ...sessionsRef.current.filter((session) => session.siteKey !== siteId),
          ...technicalGuidanceSessions,
        ]);

        await applyHydratedSessions(mergedSessions);
        loadedReportSiteIdsRef.current.add(siteId);
      } catch (error) {
        if (isAuthFailure(error)) {
          syncRequestIdRef.current += 1;
          clearAuthState();
          setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        } else {
          setDataError(getErrorMessage(error));
        }
      } finally {
        setIsHydratingReports(false);
      }
    },
    [
      applyHydratedSessions,
      authTokenRef,
      clearAuthState,
      masterDataRef,
      sessionsRef,
      setAuthError,
      setDataError,
      setIsHydratingReports,
      sitesRef,
    ],
  );

  const syncReportSessions = useCallback(
    async (token: string, baseState: HydratedBaseState, requestId: number) => {
      setIsHydratingReports(true);

      try {
        const sessions = await hydrateRemoteSessions(
          token,
          baseState.sites,
          baseState.masterData,
        );

        if (
          syncRequestIdRef.current !== requestId ||
          authTokenRef.current !== token
        ) {
          return;
        }

        await applyHydratedSessions(sessions);
        loadedReportSiteIdsRef.current = new Set(baseState.sites.map((site) => site.id));
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
      } finally {
        if (syncRequestIdRef.current === requestId) {
          setIsHydratingReports(false);
        }
      }
    },
    [
      applyHydratedSessions,
      authTokenRef,
      clearAuthState,
      hydrateRemoteSessions,
      setAuthError,
      setDataError,
      setIsHydratingReports,
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
        await applyHydratedSessions([]);
        loadedReportSiteIdsRef.current = new Set();
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

      const baseState = {
        ...siteState,
        masterData: EMPTY_MASTER_DATA,
      };

      await applyHydratedBaseState(baseState, token);

      if (
        syncRequestIdRef.current !== requestId ||
        authTokenRef.current !== token
      ) {
        return;
      }

      setIsReady(true);
      void syncReportSessions(token, baseState, requestId);
    },
    [
      applyHydratedBaseState,
      applyHydratedSessions,
      applyImmediateUserState,
      authTokenRef,
      clearAuthState,
      hydrateRemoteSiteState,
      setAuthError,
      setDataError,
      setIsReady,
      syncReportSessions,
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
        loadedReportSiteIdsRef.current = new Set();
        masterDataPromiseRef.current = null;
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
      loadedReportSiteIdsRef.current = new Set();
      masterDataPromiseRef.current = null;

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
      setSyncError,
    ],
  );

  const logout = useCallback(() => {
    syncRequestIdRef.current += 1;
    hasLoadedRemoteMasterDataRef.current = false;
    loadedReportSiteIdsRef.current = new Set();
    masterDataPromiseRef.current = null;
    clearAuthState();
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(true);
  }, [clearAuthState, setAuthError, setDataError, setIsReady, setSyncError]);

  return {
    ensureMasterDataLoaded,
    ensureSiteReportsLoaded,
    login,
    logout,
    refreshMasterData,
    reload,
  };
}
