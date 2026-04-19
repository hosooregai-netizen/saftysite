'use client';

import { useCallback, useMemo } from 'react';
import {
  createEmptyReportIndexState,
  mergeReportIndexItems,
} from '@/hooks/inspectionSessions/helpers';
import { fetchAssignedSafetySites } from '@/lib/safetyApi';
import { isSafetyAdmin, mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers';
import type { ReactNode } from 'react';
import type { InspectionReportListItem } from '@/types/inspectionSession';
import { useInspectionSessionsAutosave } from './autosave';
import {
  InspectionSessionsContext,
  type InspectionSessionsContextValue,
} from './context';
import { useInspectionSessionsMutations } from './mutations';
import { useInspectionSessionsStore } from './store';
import { useInspectionSessionsSync } from './sync';

export function InspectionSessionsProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const store = useInspectionSessionsStore();
  const {
    ensureMasterDataLoaded,
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    ensureSiteReportsLoaded,
    login,
    logout,
    reload,
    refreshMasterData,
  } = useInspectionSessionsSync(store);
  const { deleteSessionRemotely, markSessionDirty, saveNow } =
    useInspectionSessionsAutosave(store);
  const {
    createSession,
    createSite,
    deleteSessions,
    deleteSite,
    upsertHydratedSiteSessions,
    updateSession,
    updateSessions,
    updateSite,
  } = useInspectionSessionsMutations(store, markSessionDirty);

  const getSessionById = useCallback(
    (sessionId: string) =>
      store.sessionsRef.current.find((session) => session.id === sessionId) || null,
    [store.sessionsRef],
  );

  const getSessionsBySiteId = useCallback(
    (siteId: string) =>
      store.sessionsRef.current.filter((session) => session.siteKey === siteId),
    [store.sessionsRef],
  );

  const getSiteById = useCallback(
    (siteId: string) => store.sitesRef.current.find((site) => site.id === siteId) || null,
    [store.sitesRef],
  );

  const getSiteRelationsStatus = useCallback(
    (siteId: string) => store.siteRelationsStatusBySiteId[siteId] || 'idle',
    [store.siteRelationsStatusBySiteId],
  );

  const getReportIndexBySiteId = useCallback(
    (siteId: string) => store.reportIndexBySiteId[siteId] || null,
    [store.reportIndexBySiteId],
  );

  const upsertReportIndexItems = useCallback(
    (siteId: string, items: InspectionReportListItem[]) => {
      store.setReportIndexBySiteId((current) => {
        const nextItems = mergeReportIndexItems(current[siteId]?.items ?? [], items);
        return {
          ...current,
          [siteId]: {
            ...createEmptyReportIndexState(),
            ...(current[siteId] ?? {}),
            status: 'loaded',
            items: nextItems,
            fetchedAt: current[siteId]?.fetchedAt ?? new Date().toISOString(),
            error: null,
          },
        };
      });
    },
    [store],
  );

  const upsertAssignedSitesIntoStore = useCallback(
    (rawSites: import('@/types/backend').SafetySite[]) => {
      if (rawSites.length === 0) {
        return;
      }

      const nextSitesById = new Map(
        store.sitesRef.current.map((site) => [site.id, site]),
      );
      rawSites.forEach((site) => {
        nextSitesById.set(site.id, mapSafetySiteToInspectionSite(site));
      });
      const nextSites = Array.from(nextSitesById.values());
      store.setSiteState(nextSites);
      void store.persistSites(nextSites).catch(() => {
        // Ignore cache persistence failures during site enrichment.
      });
    },
    [store],
  );

  const ensureAssignedSafetySite = useCallback(
    async (siteId: string) => {
      const cached = store.assignedSafetySitesByIdRef.current.get(siteId);
      if (cached) {
        const hasStoredSite = store.sitesRef.current.some((site) => site.id === siteId);
        if (!hasStoredSite) {
          upsertAssignedSitesIntoStore([cached]);
        }
        return cached;
      }

      const token = store.authTokenRef.current;
      if (!token) {
        return null;
      }

      try {
        const sites = await fetchAssignedSafetySites(token);
        store.replaceAssignedSafetySites(sites);
        upsertAssignedSitesIntoStore(sites);
        return store.assignedSafetySitesByIdRef.current.get(siteId) ?? null;
      } catch {
        return null;
      }
    },
    [store, upsertAssignedSitesIntoStore],
  );

  const contextValue = useMemo<InspectionSessionsContextValue>(
    () => ({
      sites: store.sites,
      sessions: store.sessions,
      hasAuthToken: store.hasAuthToken,
      isReady: store.isReady,
      isHydrating: store.isHydrating,
      isAuthenticated: Boolean(store.currentUser && store.authTokenRef.current),
      isHydratingReports: store.isHydratingReports,
      isSaving: store.isSaving,
      currentUser: store.currentUser,
      masterData: store.masterData,
      authError: store.authError,
      dataError: store.dataError,
      syncError: store.syncError,
      canArchiveReports: isSafetyAdmin(store.currentUser),
      ensureMasterDataLoaded,
      ensureSessionLoaded,
      ensureSiteReportIndexLoaded,
      ensureSiteReportsLoaded,
      getSiteRelationsStatus,
      getReportIndexBySiteId,
      login,
      logout,
      reload,
      refreshMasterData,
      createSite,
      updateSite,
      deleteSite,
      createSession,
      updateSession,
      updateSessions,
      deleteSession: deleteSessionRemotely,
      deleteSessions,
      saveNow,
      getSessionById,
      getSessionsBySiteId,
      getSiteById,
      upsertHydratedSiteSessions,
      upsertReportIndexItems,
      ensureAssignedSafetySite,
    }),
    [
      ensureAssignedSafetySite,
      createSession,
      createSite,
      deleteSessionRemotely,
      deleteSessions,
      deleteSite,
      ensureMasterDataLoaded,
      ensureSessionLoaded,
      ensureSiteReportIndexLoaded,
      ensureSiteReportsLoaded,
      getSiteRelationsStatus,
      getReportIndexBySiteId,
      getSessionById,
      getSessionsBySiteId,
      getSiteById,
      login,
      logout,
      reload,
      refreshMasterData,
      saveNow,
      store.authError,
      store.authTokenRef,
      store.currentUser,
      store.dataError,
      store.hasAuthToken,
      store.isHydrating,
      store.isHydratingReports,
      store.isReady,
      store.isSaving,
      store.masterData,
      store.sessions,
      store.sites,
      store.syncError,
      upsertHydratedSiteSessions,
      upsertReportIndexItems,
      updateSession,
      updateSessions,
      updateSite,
    ],
  );

  return (
    <InspectionSessionsContext.Provider value={contextValue}>
      {children}
    </InspectionSessionsContext.Provider>
  );
}
