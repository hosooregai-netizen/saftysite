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
  mapSafetySiteToInspectionSite,
} from '@/lib/safetyApiMappers';
import type { SafetyHydratedData, SafetyLoginInput } from '@/types/backend';
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
    setIsReady,
    setMasterData,
    setSessionState,
    setSiteState,
    setSyncError,
  } = store;

  const hydrateRemoteState = useCallback(
    async (token: string): Promise<SafetyHydratedData> => {
      const [user, contentItems] = await Promise.all([
        fetchCurrentSafetyUser(token),
        fetchSafetyContentItems(token),
      ]);
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
        user,
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

  const reload = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) {
      setIsReady(true);
      return;
    }

    setDataError(null);
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
      setIsReady(true);
    }
  }, [applyHydratedState, authTokenRef, clearAuthState, hydrateRemoteState, setAuthError, setDataError, setIsReady]);

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
        setIsReady(true);
        return;
      }
      authTokenRef.current = token;
      await reload();
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [authTokenRef, reload, resetSessionVersions, setIsReady, setSessionState, setSiteState]);

  const login = useCallback(async (input: SafetyLoginInput) => {
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(false);

    try {
      const token = await loginSafetyApi(input);
      writeSafetyAuthToken(token.access_token);
      authTokenRef.current = token.access_token;
      await applyHydratedState(await hydrateRemoteState(token.access_token));
    } catch (error) {
      clearAuthState();
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      setIsReady(true);
    }
  }, [applyHydratedState, authTokenRef, clearAuthState, hydrateRemoteState, setAuthError, setDataError, setIsReady, setSyncError]);

  const logout = useCallback(() => {
    clearAuthState();
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(true);
  }, [clearAuthState, setAuthError, setDataError, setIsReady, setSyncError]);

  return { login, logout, reload };
}
