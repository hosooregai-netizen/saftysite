'use client';

import { useCallback, useMemo } from 'react';
import {
  createEmptyReportIndexState,
  mergeReportIndexItems,
} from '@/hooks/inspectionSessions/helpers';
import { isSafetyAdmin } from '@/lib/safetyApiMappers';
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
    updateSession,
    updateSessions,
    updateSite,
  } = useInspectionSessionsMutations(store, markSessionDirty);

  const getSessionById = useCallback(
    (sessionId: string) => store.sessions.find((session) => session.id === sessionId) || null,
    [store.sessions],
  );

  const getSiteById = useCallback(
    (siteId: string) => store.sites.find((site) => site.id === siteId) || null,
    [store.sites],
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
      getSiteById,
      upsertReportIndexItems,
    }),
    [
      createSession,
      createSite,
      deleteSessionRemotely,
      deleteSessions,
      deleteSite,
      ensureMasterDataLoaded,
      ensureSessionLoaded,
      ensureSiteReportIndexLoaded,
      ensureSiteReportsLoaded,
      getReportIndexBySiteId,
      getSessionById,
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
