'use client';

import { useMemo, useRef } from 'react';
import type { SafetyMasterData } from '@/types/backend';
import type { InspectionSessionsStore } from './store';
import { useInspectionSessionAuthSync } from './useInspectionSessionAuthSync';
import { useInspectionSessionMasterDataSync } from './useInspectionSessionMasterDataSync';
import { useInspectionSessionReportLoaders } from './useInspectionSessionReportLoaders';
import { useInspectionSessionStateHydration } from './useInspectionSessionStateHydration';

export function useInspectionSessionsSync(store: InspectionSessionsStore) {
  const syncRequestIdRef = useRef(0);
  const hasLoadedRemoteMasterDataRef = useRef(false);
  const masterDataPromiseRef = useRef<Promise<SafetyMasterData> | null>(null);
  const reportIndexRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const sessionLoadRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const siteReportsLoadRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const loadedSiteReportsRef = useRef<Set<string>>(new Set());

  const runtime = useMemo(
    () => ({
      hasLoadedRemoteMasterDataRef,
      loadedSiteReportsRef,
      masterDataPromiseRef,
      reportIndexRequestsRef,
      sessionLoadRequestsRef,
      siteReportsLoadRequestsRef,
      syncRequestIdRef,
    }),
    [],
  );

  const hydration = useInspectionSessionStateHydration(store, runtime);
  const masterDataActions = useMemo(
    () => ({
      applyMasterDataToSessions: hydration.applyMasterDataToSessions,
      hydrateRemoteMasterData: hydration.hydrateRemoteMasterData,
    }),
    [hydration.applyMasterDataToSessions, hydration.hydrateRemoteMasterData],
  );
  const { ensureMasterDataLoaded, refreshMasterData } = useInspectionSessionMasterDataSync(
    store,
    runtime,
    masterDataActions,
  );
  const reportLoaderActions = useMemo(
    () => ({
      applyHydratedSessions: hydration.applyHydratedSessions,
      removeSessionFromLocalState: hydration.removeSessionFromLocalState,
    }),
    [hydration.applyHydratedSessions, hydration.removeSessionFromLocalState],
  );
  const {
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    ensureSiteReportsLoaded,
  } = useInspectionSessionReportLoaders(store, runtime, reportLoaderActions);
  const authSyncActions = useMemo(
    () => ({
      applyHydratedBaseState: hydration.applyHydratedBaseState,
      applyImmediateUserState: hydration.applyImmediateUserState,
      hydrateRemoteSiteState: hydration.hydrateRemoteSiteState,
    }),
    [
      hydration.applyHydratedBaseState,
      hydration.applyImmediateUserState,
      hydration.hydrateRemoteSiteState,
    ],
  );
  const { login, logout, reload } = useInspectionSessionAuthSync(
    store,
    runtime,
    authSyncActions,
  );

  return {
    ensureMasterDataLoaded,
    ensureSessionLoaded,
    ensureSiteReportIndexLoaded,
    ensureSiteReportsLoaded,
    login,
    logout,
    refreshMasterData,
    reload,
  };
}
