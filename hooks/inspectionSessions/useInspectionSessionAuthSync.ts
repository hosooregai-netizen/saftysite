'use client';

import { useCallback, useEffect } from 'react';
import { readPersistedValue } from '@/lib/clientPersistence';
import { readOwnedPersistedValue } from '@/lib/ownedPersistence';
import {
  fetchCurrentSafetyUser,
  loginSafetyApi,
  readSafetyAuthToken,
  writeSafetyAuthToken,
} from '@/lib/safetyApi';
import { primeControllerDashboardData } from '@/hooks/controller/useControllerDashboard';
import { isSafetyAdmin, mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers';
import type {
  InspectionSite,
  InspectionSession,
  SiteReportIndexState,
} from '@/types/inspectionSession';
import { normalizeReportIndexBySiteId, REPORT_INDEX_STORAGE_KEY, SITE_STORAGE_KEY, STORAGE_KEY, USER_STORAGE_KEY, EMPTY_MASTER_DATA, getErrorMessage, isAuthFailure } from './helpers';
import type { InspectionSessionsStore } from './store';
import {
  resetInspectionSyncRuntime,
  scheduleAdminBackgroundTask,
  type InspectionSyncRuntime,
} from './syncSupport';

const PERSISTED_BOOTSTRAP_TIMEOUT_MS = 250;

interface AuthSyncActions {
  applyHydratedBaseState: (
    data: import('./syncSupport').HydratedBaseState,
    token: string,
  ) => Promise<void>;
  applyImmediateUserState: (
    user: import('@/types/backend').SafetyUser,
    token: string,
  ) => Promise<void>;
  hydrateRemoteSiteState: (
    token: string,
    preloadedUser?: import('@/types/backend').SafetyUser,
  ) => Promise<import('./syncSupport').HydratedSiteState>;
}

async function readCachedBootstrap() {
  const cachedBootstrapPromise = Promise.all([
    readPersistedValue<InspectionSession[]>(STORAGE_KEY),
    readPersistedValue<InspectionSite[]>(SITE_STORAGE_KEY),
    readPersistedValue<import('@/types/backend').SafetyUser>(USER_STORAGE_KEY),
  ]).then(async ([cachedSessions, cachedSites, cachedUser]) => {
    const cachedReportIndex = await readOwnedPersistedValue<
      Record<string, SiteReportIndexState>
    >(REPORT_INDEX_STORAGE_KEY, cachedUser?.id ?? null);

    return [cachedSessions, cachedSites, cachedUser, cachedReportIndex] as const;
  });

  return Promise.race([
    cachedBootstrapPromise.then((value) => ({ timedOut: false, value })),
    new Promise<{
      timedOut: true;
      value: [null, null, null, null];
    }>((resolve) =>
      window.setTimeout(
        () => resolve({ timedOut: true, value: [null, null, null, null] }),
        PERSISTED_BOOTSTRAP_TIMEOUT_MS,
      ),
    ),
  ]);
}

export function useInspectionSessionAuthSync(
  store: InspectionSessionsStore,
  runtime: InspectionSyncRuntime,
  actions: AuthSyncActions,
) {
  const {
    authTokenRef,
    clearAuthState,
    resetSessionVersions,
    setAuthError,
    setCurrentUser,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsHydratingReports,
    setIsReady,
    setReportIndexBySiteId,
    setSessionState,
    setSiteRelationsStatusBySiteId,
    setSiteState,
    setSyncError,
  } = store;

  const bootWithUser = useCallback(
    async (token: string, user: import('@/types/backend').SafetyUser, requestId: number) => {
      if (
        runtime.syncRequestIdRef.current !== requestId ||
        authTokenRef.current !== token
      ) {
        return;
      }

      if (isSafetyAdmin(user)) {
        const coreDataPromise = primeControllerDashboardData(token);
        await actions.applyImmediateUserState(user, token);

        scheduleAdminBackgroundTask(() => {
          if (
            runtime.syncRequestIdRef.current !== requestId ||
            authTokenRef.current !== token
          ) {
            return;
          }

          void (async () => {
            try {
              const { sites } = await coreDataPromise;

              if (
                runtime.syncRequestIdRef.current !== requestId ||
                authTokenRef.current !== token
              ) {
                return;
              }

              await actions.applyHydratedBaseState(
                {
                  user,
                  sites: sites.map(mapSafetySiteToInspectionSite),
                  masterData: EMPTY_MASTER_DATA,
                  assignedSafetySites: sites,
                },
                token,
              );
            } catch (error) {
              if (
                runtime.syncRequestIdRef.current !== requestId ||
                authTokenRef.current !== token
              ) {
                return;
              }

              if (isAuthFailure(error)) {
                runtime.syncRequestIdRef.current += 1;
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

      await actions.applyImmediateUserState(user, token);

      const siteState = await actions.hydrateRemoteSiteState(token, user);

      if (
        runtime.syncRequestIdRef.current !== requestId ||
        authTokenRef.current !== token
      ) {
        return;
      }

      await actions.applyHydratedBaseState(
        {
          ...siteState,
          masterData: EMPTY_MASTER_DATA,
        },
        token,
      );
    },
    [actions, authTokenRef, clearAuthState, runtime.syncRequestIdRef, setAuthError, setDataError],
  );

  const hydrateAndSync = useCallback(
    async (token: string) => {
      const requestId = ++runtime.syncRequestIdRef.current;
      setDataError(null);

      try {
        const user = await fetchCurrentSafetyUser(token);
        await bootWithUser(token, user, requestId);
      } catch (error) {
        if (isAuthFailure(error)) {
          runtime.syncRequestIdRef.current += 1;
          clearAuthState();
          setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        } else {
          setDataError(getErrorMessage(error));
        }
        setIsReady(true);
      }
    },
    [bootWithUser, clearAuthState, runtime.syncRequestIdRef, setAuthError, setDataError, setIsReady],
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
    resetInspectionSyncRuntime(runtime);
    setSiteRelationsStatusBySiteId({});

    try {
      await hydrateAndSync(token);
    } finally {
      setIsHydrating(false);
      setIsReady(true);
    }
  }, [
    authTokenRef,
    hydrateAndSync,
    runtime,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsReady,
    setSiteRelationsStatusBySiteId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const token = readSafetyAuthToken();
      if (!token) {
        resetInspectionSyncRuntime(runtime);
        setSiteRelationsStatusBySiteId({});
        setHasAuthToken(false);
        setIsReady(true);
        return;
      }

      const cachedBootstrapResult = await readCachedBootstrap();
      if (cancelled) return;

      const [cachedSessions, cachedSites, cachedUser, cachedReportIndex] =
        cachedBootstrapResult.value;
      if (cachedSites?.length) {
        setSiteState(cachedSites);
      }
      if (cachedSessions?.length) {
        setSessionState(cachedSessions);
        resetSessionVersions(cachedSessions);
      }
      if (cachedReportIndex && Object.keys(cachedReportIndex).length > 0) {
        setReportIndexBySiteId(normalizeReportIndexBySiteId(cachedReportIndex));
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
    runtime,
    setCurrentUser,
    setHasAuthToken,
    setIsHydrating,
    setIsReady,
    setReportIndexBySiteId,
    setSessionState,
    setSiteRelationsStatusBySiteId,
    setSiteState,
  ]);

  const login = useCallback(
    async (input: import('@/types/backend').SafetyLoginInput) => {
      setAuthError(null);
      setDataError(null);
      setSyncError(null);
      setHasAuthToken(false);
      setIsHydrating(true);
      setIsHydratingReports(false);
      setIsReady(false);
      resetInspectionSyncRuntime(runtime);
      setReportIndexBySiteId({});
      setSiteRelationsStatusBySiteId({});

      try {
        const token = await loginSafetyApi(input);
        writeSafetyAuthToken(token.access_token);
        authTokenRef.current = token.access_token;
        setHasAuthToken(true);

        const requestId = ++runtime.syncRequestIdRef.current;
        const user = await fetchCurrentSafetyUser(token.access_token);
        await bootWithUser(token.access_token, user, requestId);
      } catch (error) {
        runtime.syncRequestIdRef.current += 1;
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
      runtime,
      setAuthError,
      setDataError,
      setHasAuthToken,
      setIsHydrating,
      setIsHydratingReports,
      setIsReady,
      setReportIndexBySiteId,
      setSiteRelationsStatusBySiteId,
      setSyncError,
    ],
  );

  const logout = useCallback(() => {
    runtime.syncRequestIdRef.current += 1;
    resetInspectionSyncRuntime(runtime);
    setSiteRelationsStatusBySiteId({});
    clearAuthState();
    setReportIndexBySiteId({});
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(true);
  }, [
    clearAuthState,
    runtime,
    setAuthError,
    setDataError,
    setIsReady,
    setReportIndexBySiteId,
    setSiteRelationsStatusBySiteId,
    setSyncError,
  ]);

  return {
    login,
    logout,
    reload,
  };
}
