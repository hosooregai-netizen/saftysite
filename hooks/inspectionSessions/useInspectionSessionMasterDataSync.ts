'use client';

import { useCallback } from 'react';
import type { SafetyMasterData } from '@/types/backend';
import { getErrorMessage, isAuthFailure } from './helpers';
import type { InspectionSessionsStore } from './store';
import type { InspectionSyncRuntime } from './syncSupport';

interface MasterDataActions {
  applyMasterDataToSessions: (masterData: SafetyMasterData) => Promise<void>;
  hydrateRemoteMasterData: (token: string) => Promise<SafetyMasterData>;
}

export function useInspectionSessionMasterDataSync(
  store: InspectionSessionsStore,
  runtime: InspectionSyncRuntime,
  actions: MasterDataActions,
) {
  const {
    hasLoadedRemoteMasterDataRef,
    masterDataPromiseRef,
    syncRequestIdRef,
  } = runtime;
  const {
    authTokenRef,
    clearAuthState,
    setAuthError,
    setDataError,
  } = store;

  const refreshMasterData = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) return;

    const masterData = await actions.hydrateRemoteMasterData(token);
    await actions.applyMasterDataToSessions(masterData);
  }, [actions, authTokenRef]);

  const ensureMasterDataLoaded = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) return;
    if (hasLoadedRemoteMasterDataRef.current) return;

    if (!masterDataPromiseRef.current) {
      masterDataPromiseRef.current = actions
        .hydrateRemoteMasterData(token)
        .finally(() => {
          masterDataPromiseRef.current = null;
        });
    }

    try {
      const masterData = await masterDataPromiseRef.current;
      if (authTokenRef.current !== token) {
        return;
      }

      await actions.applyMasterDataToSessions(masterData);
    } catch (error) {
      if (isAuthFailure(error)) {
        syncRequestIdRef.current += 1;
        clearAuthState();
        setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        return;
      }

      setDataError(getErrorMessage(error));
    }
  }, [
    actions,
    authTokenRef,
    clearAuthState,
    hasLoadedRemoteMasterDataRef,
    masterDataPromiseRef,
    setAuthError,
    setDataError,
    syncRequestIdRef,
  ]);

  return {
    ensureMasterDataLoaded,
    refreshMasterData,
  };
}
