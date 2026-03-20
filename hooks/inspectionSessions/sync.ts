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
      store.authTokenRef.current = readSafetyAuthToken();
      store.masterDataRef.current = data.masterData;
      store.setCurrentUser(data.user);
      store.setMasterData(data.masterData);
      store.setSiteState(data.sites);
      store.setSessionState(data.sessions);
      store.resetSessionVersions(data.sessions);
      await Promise.all([store.persistSites(data.sites), store.persistSessions(data.sessions)]);
    },
    [store]
  );

  const reload = useCallback(async () => {
    const token = store.authTokenRef.current;
    if (!token) {
      store.setIsReady(true);
      return;
    }

    store.setDataError(null);
    try {
      await applyHydratedState(await hydrateRemoteState(token));
    } catch (error) {
      if (isAuthFailure(error)) {
        store.clearAuthState();
        store.setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        store.setDataError(getErrorMessage(error));
      }
    } finally {
      store.setIsReady(true);
    }
  }, [applyHydratedState, hydrateRemoteState, store]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const [cachedSessions, cachedSites] = await Promise.all([
        readPersistedValue<InspectionSession[]>(STORAGE_KEY),
        readPersistedValue<InspectionSite[]>(SITE_STORAGE_KEY),
      ]);
      if (cancelled) return;
      if (cachedSites?.length) store.setSiteState(cachedSites);
      if (cachedSessions?.length) {
        store.setSessionState(cachedSessions);
        store.resetSessionVersions(cachedSessions);
      }
      const token = readSafetyAuthToken();
      if (!token) {
        store.setIsReady(true);
        return;
      }
      store.authTokenRef.current = token;
      await reload();
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [reload, store]);

  const login = useCallback(async (input: SafetyLoginInput) => {
    store.setAuthError(null);
    store.setDataError(null);
    store.setSyncError(null);
    store.setIsReady(false);

    try {
      const token = await loginSafetyApi(input);
      writeSafetyAuthToken(token.access_token);
      store.authTokenRef.current = token.access_token;
      await applyHydratedState(await hydrateRemoteState(token.access_token));
    } catch (error) {
      store.clearAuthState();
      store.setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      store.setIsReady(true);
    }
  }, [applyHydratedState, hydrateRemoteState, store]);

  const logout = useCallback(() => {
    store.clearAuthState();
    store.setAuthError(null);
    store.setDataError(null);
    store.setSyncError(null);
    store.setIsReady(true);
  }, [store]);

  return { login, logout, reload };
}
