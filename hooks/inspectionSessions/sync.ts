'use client';

import { useCallback, useMemo, useRef } from 'react';
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
  const reportIndexRequestGenerationRef = useRef<Map<string, number>>(new Map());
  const reportIndexRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const sessionLoadRequestGenerationRef = useRef<Map<string, number>>(new Map());
  const sessionLoadRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const siteReportsLoadRequestGenerationRef = useRef<Map<string, number>>(new Map());
  const siteReportsLoadRequestsRef = useRef<Map<string, Promise<void>>>(new Map());
  const loadedSiteReportsRef = useRef<Set<string>>(new Set());

  const runtime = useMemo(
    () => ({
      hasLoadedRemoteMasterDataRef,
      loadedSiteReportsRef,
      masterDataPromiseRef,
      reportIndexRequestGenerationRef,
      reportIndexRequestsRef,
      sessionLoadRequestGenerationRef,
      sessionLoadRequestsRef,
      siteReportsLoadRequestGenerationRef,
      siteReportsLoadRequestsRef,
      syncRequestIdRef,
    }),
    [],
  );
  const markReportIndexMutation = useCallback((siteId: string, reportKeys: string[]) => {
    if (!siteId) {
      return;
    }

    reportIndexRequestGenerationRef.current.set(
      siteId,
      (reportIndexRequestGenerationRef.current.get(siteId) ?? 0) + 1,
    );
    siteReportsLoadRequestGenerationRef.current.set(
      siteId,
      (siteReportsLoadRequestGenerationRef.current.get(siteId) ?? 0) + 1,
    );
    reportIndexRequestsRef.current.delete(siteId);
    siteReportsLoadRequestsRef.current.delete(siteId);

    reportKeys.forEach((reportKey) => {
      if (!reportKey) {
        return;
      }

      sessionLoadRequestGenerationRef.current.set(
        reportKey,
        (sessionLoadRequestGenerationRef.current.get(reportKey) ?? 0) + 1,
      );
      sessionLoadRequestsRef.current.delete(reportKey);
    });
  }, []);

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
    markReportIndexMutation,
    refreshMasterData,
    reload,
  };
}
