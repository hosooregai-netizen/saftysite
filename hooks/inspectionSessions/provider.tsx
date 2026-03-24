'use client';

import { useCallback, useMemo } from 'react';
import { isSafetyAdmin } from '@/lib/safetyApiMappers';
import type { ReactNode } from 'react';
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
  const { login, logout, reload } = useInspectionSessionsSync(store);
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
    [store.sessions]
  );

  const getSiteById = useCallback(
    (siteId: string) => store.sites.find((site) => site.id === siteId) || null,
    [store.sites]
  );

  const contextValue = useMemo<InspectionSessionsContextValue>(
    () => ({
      sites: store.sites,
      sessions: store.sessions,
      hasAuthToken: store.hasAuthToken,
      isReady: store.isReady,
      isHydrating: store.isHydrating,
      isAuthenticated: Boolean(store.currentUser && store.authTokenRef.current),
      isSaving: store.isSaving,
      currentUser: store.currentUser,
      masterData: store.masterData,
      authError: store.authError,
      dataError: store.dataError,
      syncError: store.syncError,
      canArchiveReports: isSafetyAdmin(store.currentUser),
      login,
      logout,
      reload,
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
    }),
    [
      createSession,
      createSite,
      deleteSessionRemotely,
      deleteSessions,
      deleteSite,
      getSessionById,
      getSiteById,
      login,
      logout,
      reload,
      saveNow,
      store.authError,
      store.authTokenRef,
      store.currentUser,
      store.dataError,
      store.hasAuthToken,
      store.isHydrating,
      store.isReady,
      store.isSaving,
      store.masterData,
      store.sessions,
      store.sites,
      store.syncError,
      updateSession,
      updateSessions,
      updateSite,
    ]
  );

  return (
    <InspectionSessionsContext.Provider value={contextValue}>
      {children}
    </InspectionSessionsContext.Provider>
  );
}
