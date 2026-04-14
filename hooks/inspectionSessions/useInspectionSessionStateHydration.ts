'use client';

import { startTransition, useCallback } from 'react';
import {
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
} from '@/lib/safetyApi';
import {
  buildSafetyMasterData,
  mapSafetySiteToInspectionSite,
  mergeMasterDataIntoSession,
} from '@/lib/safetyApiMappers';
import type {
  SafetyMasterData,
  SafetyUser,
} from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import { normalizeSessions } from './helpers';
import type { InspectionSessionsStore } from './store';
import type {
  HydratedBaseState,
  HydratedSiteState,
  InspectionSyncRuntime,
} from './syncSupport';

export function useInspectionSessionStateHydration(
  store: InspectionSessionsStore,
  runtime: InspectionSyncRuntime,
) {
  const { hasLoadedRemoteMasterDataRef } = runtime;
  const {
    authTokenRef,
    dirtySessionIdsRef,
    masterDataRef,
    persistCurrentUser,
    persistSessions,
    persistSites,
    sessionVersionsRef,
    sessionsRef,
    setCurrentUser,
    setIsReady,
    setMasterData,
    setReportIndexBySiteId,
    setSessionState,
    setSiteState,
  } = store;

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
    [hasLoadedRemoteMasterDataRef, masterDataRef, persistSessions, sessionsRef, setMasterData, setSessionState],
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
      const nextSessionIds = new Set(sessions.map((session) => session.id));
      dirtySessionIdsRef.current = new Set(
        Array.from(dirtySessionIdsRef.current).filter((sessionId) =>
          nextSessionIds.has(sessionId),
        ),
      );
      sessionVersionsRef.current = sessions.reduce<Record<string, number>>(
        (accumulator, session) => {
          accumulator[session.id] = sessionVersionsRef.current[session.id] ?? 0;
          return accumulator;
        },
        {},
      );
      startTransition(() => {
        setSessionState(sessions);
      });
      void persistSessions(sessions).catch(() => {
        // Ignore cache persistence failures during optimistic sync.
      });
    },
    [
      dirtySessionIdsRef,
      persistSessions,
      sessionVersionsRef,
      setSessionState,
    ],
  );

  const removeSessionFromLocalState = useCallback(
    async (reportKey: string) => {
      const nextSessions = normalizeSessions(
        sessionsRef.current.filter((session) => session.id !== reportKey),
      );
      dirtySessionIdsRef.current.delete(reportKey);
      delete sessionVersionsRef.current[reportKey];
      await applyHydratedSessions(nextSessions);
      setReportIndexBySiteId((current) => {
        let changed = false;
        const nextState = Object.fromEntries(
          Object.entries(current).map(([siteId, state]) => {
            const nextItems = state.items.filter((item) => item.reportKey !== reportKey);
            const hasRemovedItem = nextItems.length !== state.items.length;
            if (hasRemovedItem) {
              changed = true;
            }
            return [
              siteId,
              hasRemovedItem
                ? {
                    ...state,
                    items: nextItems,
                  }
                : state,
            ];
          }),
        );
        return changed ? nextState : current;
      });
    },
    [
      applyHydratedSessions,
      dirtySessionIdsRef,
      sessionVersionsRef,
      sessionsRef,
      setReportIndexBySiteId,
    ],
  );

  return {
    applyHydratedBaseState,
    applyHydratedSessions,
    applyImmediateUserState,
    applyMasterDataToSessions,
    hydrateRemoteMasterData,
    hydrateRemoteSiteState,
    removeSessionFromLocalState,
  };
}
