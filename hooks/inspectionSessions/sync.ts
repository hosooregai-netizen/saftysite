'use client';

import { useCallback, useEffect } from 'react';
import { readPersistedValue } from '@/lib/clientPersistence';
import { fetchSafetySitesAdmin } from '@/lib/safetyApi/adminEndpoints';
import {
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
  fetchSafetyReportsBySite,
  loginSafetyApi,
  readSafetyAuthToken,
  writeSafetyAuthToken,
} from '@/lib/safetyApi';
import {
  buildSafetyMasterData,
  isSafetyAdmin,
  mapSafetyReportToInspectionSession,
  mergeMasterDataIntoSession,
  mapSafetySiteToInspectionSite,
} from '@/lib/safetyApiMappers';
import type { SafetyHydratedData, SafetyLoginInput, SafetyUser } from '@/types/backend';
import type { InspectionSite, InspectionSession } from '@/types/inspectionSession';
import { getErrorMessage, isAuthFailure, normalizeSessions, SITE_STORAGE_KEY, STORAGE_KEY } from './helpers';
import type { InspectionSessionsStore } from './store';

export function useInspectionSessionsSync(store: InspectionSessionsStore) {
  const {
    authTokenRef,
    clearAuthState,
    masterDataRef,
    persistSessions,
    persistSites,
    resetSessionVersions,
    setAuthError,
    setCurrentUser,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsReady,
    setMasterData,
    setSessionState,
    setSiteState,
    setSyncError,
    sessionsRef,
  } = store;

  const hydrateRemoteCollections = useCallback(
    async (token: string, user: SafetyUser) => {
      const contentItems = await fetchSafetyContentItems(token);
      const rawSites = isSafetyAdmin(user)
        ? await fetchSafetySitesAdmin(token)
        : await fetchAssignedSafetySites(token);
      const mappedSites = rawSites.map(mapSafetySiteToInspectionSite);
      const nextMasterData = buildSafetyMasterData(contentItems);
      const reportGroups = await Promise.all(
        mappedSites.map(async (site) => ({
          site,
          reports: await fetchSafetyReportsBySite(token, site.id),
        }))
      );

      return {
        sites: mappedSites,
        sessions: normalizeSessions(
          reportGroups.flatMap(({ site, reports }) =>
            reports.map((report) => mapSafetyReportToInspectionSession(report, site, nextMasterData))
          )
        ),
        masterData: nextMasterData,
      };
    },
    []
  );

  const hydrateRemoteState = useCallback(
    async (token: string): Promise<SafetyHydratedData> => {
      const user = await fetchCurrentSafetyUser(token);
      const collections = await hydrateRemoteCollections(token, user);

      return {
        user,
        ...collections,
      };
    },
    [hydrateRemoteCollections]
  );

  const applyHydratedState = useCallback(
    async (data: SafetyHydratedData) => {
      authTokenRef.current = readSafetyAuthToken();
      masterDataRef.current = data.masterData;
      setCurrentUser(data.user);
      setMasterData(data.masterData);
      setSiteState(data.sites);
      setSessionState(data.sessions);
      resetSessionVersions(data.sessions);
      await Promise.all([persistSites(data.sites), persistSessions(data.sessions)]);
    },
    [
      authTokenRef,
      masterDataRef,
      persistSessions,
      persistSites,
      resetSessionVersions,
      setCurrentUser,
      setMasterData,
      setSessionState,
      setSiteState,
    ]
  );

  const refreshMasterData = async () => {
    const token = authTokenRef.current;
    if (!token) return;

    const contentItems = await fetchSafetyContentItems(token);
    const nextMasterData = buildSafetyMasterData(contentItems);
    const nextSessions = sessionsRef.current.map((session) =>
      mergeMasterDataIntoSession(session, nextMasterData),
    );

    masterDataRef.current = nextMasterData;
    setMasterData(nextMasterData);
    setSessionState(nextSessions);
    await persistSessions(nextSessions);
  };

  const reload = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) {
      setHasAuthToken(false);
      setIsReady(true);
      setIsHydrating(false);
      return;
    }

    setHasAuthToken(true);
    setDataError(null);
    setIsHydrating(true);
    try {
      await applyHydratedState(await hydrateRemoteState(token));
    } catch (error) {
      if (isAuthFailure(error)) {
        clearAuthState();
        setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        setDataError(getErrorMessage(error));
      }
    } finally {
      setIsHydrating(false);
      setIsReady(true);
    }
  }, [applyHydratedState, authTokenRef, clearAuthState, hydrateRemoteState, setAuthError, setDataError, setHasAuthToken, setIsHydrating, setIsReady]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const [cachedSessions, cachedSites] = await Promise.all([
        readPersistedValue<InspectionSession[]>(STORAGE_KEY),
        readPersistedValue<InspectionSite[]>(SITE_STORAGE_KEY),
      ]);
      if (cancelled) return;
      if (cachedSites?.length) setSiteState(cachedSites);
      if (cachedSessions?.length) {
        setSessionState(cachedSessions);
        resetSessionVersions(cachedSessions);
      }
      const token = readSafetyAuthToken();
      if (!token) {
        setHasAuthToken(false);
        setIsReady(true);
        return;
      }
      authTokenRef.current = token;
      setHasAuthToken(true);
      await reload();
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [authTokenRef, reload, resetSessionVersions, setHasAuthToken, setIsReady, setSessionState, setSiteState]);

  const login = useCallback(async (input: SafetyLoginInput) => {
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsHydrating(true);
    let backgroundStarted = false;

    try {
      const token = await loginSafetyApi(input);
      writeSafetyAuthToken(token.access_token);
      authTokenRef.current = token.access_token;
      setHasAuthToken(true);
      const user = await fetchCurrentSafetyUser(token.access_token);
      setCurrentUser(user);
      setIsReady(true);
      backgroundStarted = true;

      void (async () => {
        try {
          const collections = await hydrateRemoteCollections(token.access_token, user);
          await applyHydratedState({ user, ...collections });
        } catch (error) {
          if (isAuthFailure(error)) {
            clearAuthState();
            setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          } else {
            setDataError(getErrorMessage(error));
          }
        } finally {
          setIsHydrating(false);
          setIsReady(true);
        }
      })();
    } catch (error) {
      clearAuthState();
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      if (!backgroundStarted) {
        setIsHydrating(false);
        setIsReady(true);
      }
    }
  }, [applyHydratedState, authTokenRef, clearAuthState, hydrateRemoteCollections, setAuthError, setCurrentUser, setDataError, setHasAuthToken, setIsHydrating, setIsReady, setSyncError]);

  const logout = useCallback(() => {
    clearAuthState();
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(true);
  }, [clearAuthState, setAuthError, setDataError, setIsReady, setSyncError]);

  return { login, logout, reload, refreshMasterData };
}

