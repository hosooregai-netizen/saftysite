'use client';

import { useCallback, useEffect } from 'react';
import { getSessionSiteKey } from '@/constants/inspectionSession';
import {
  archiveSafetyReportByKey,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import {
  buildSafetyReportUpsertInput,
  isSafetyAdmin,
} from '@/lib/safetyApiMappers';
import { getErrorMessage, isAuthFailure } from './helpers';
import type { InspectionSessionsStore } from './store';

export function useInspectionSessionsAutosave(store: InspectionSessionsStore) {
  const markSessionDirty = useCallback((sessionId: string) => {
    store.dirtySessionIdsRef.current.add(sessionId);
    store.sessionVersionsRef.current[sessionId] =
      (store.sessionVersionsRef.current[sessionId] ?? 0) + 1;
  }, [store]);

  const updateSavedTimestamp = useCallback((sessionId: string, savedAt: string) => {
    store.setSessions((current) => {
      const nextSessions = current.map((session) =>
        session.id === sessionId ? { ...session, updatedAt: savedAt, lastSavedAt: savedAt } : session
      );
      store.sessionsRef.current = nextSessions;
      return nextSessions;
    });
  }, [store]);

  const flushDirtySessions = useCallback(async () => {
    if (store.isFlushingRef.current || !store.authTokenRef.current || !store.currentUser) return;
    const pendingSessionIds = Array.from(store.dirtySessionIdsRef.current);
    if (pendingSessionIds.length === 0) return;

    store.isFlushingRef.current = true;
    store.setIsSaving(true);
    store.setSyncError(null);

    try {
      for (const sessionId of pendingSessionIds) {
        const session = store.sessionsRef.current.find((item) => item.id === sessionId);
        if (!session) {
          store.dirtySessionIdsRef.current.delete(sessionId);
          continue;
        }
        const site = store.sitesRef.current.find((item) => item.id === getSessionSiteKey(session));
        if (!site) continue;

        const versionAtSync = store.sessionVersionsRef.current[sessionId] ?? 0;
        const savedReport = await upsertSafetyReport(
          store.authTokenRef.current,
          buildSafetyReportUpsertInput(session, site)
        );
        if ((store.sessionVersionsRef.current[sessionId] ?? 0) === versionAtSync) {
          store.dirtySessionIdsRef.current.delete(sessionId);
          updateSavedTimestamp(
            sessionId,
            savedReport.last_autosaved_at || savedReport.updated_at || new Date().toISOString()
          );
        }
      }
    } catch (error) {
      if (isAuthFailure(error)) {
        store.clearAuthState();
        store.setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        store.setSyncError(getErrorMessage(error));
      }
    } finally {
      store.isFlushingRef.current = false;
      store.setIsSaving(false);
    }
  }, [store, updateSavedTimestamp]);

  const saveNow = useCallback(async () => {
    await Promise.all([
      store.persistSessions(store.sessionsRef.current),
      store.persistSites(store.sitesRef.current),
    ]);
    await flushDirtySessions();
  }, [flushDirtySessions, store]);

  const deleteSessionRemotely = useCallback(async (sessionId: string) => {
    const targetSession = store.sessionsRef.current.find((session) => session.id === sessionId);
    if (!targetSession) return;

    if (!store.currentUser || !store.authTokenRef.current || !isSafetyAdmin(store.currentUser)) {
      store.setSyncError('보고서 삭제는 관리자 또는 관제 권한에서만 가능합니다.');
      return;
    }

    store.setSyncError(null);
    const nextSessions = store.sessionsRef.current.filter((session) => session.id !== sessionId);
    store.setSessionState(nextSessions);
    store.dirtySessionIdsRef.current.delete(sessionId);
    delete store.sessionVersionsRef.current[sessionId];

    try {
      await archiveSafetyReportByKey(store.authTokenRef.current, targetSession.id);
    } catch (error) {
      store.setSyncError(getErrorMessage(error));
      store.setSessionState([...store.sessionsRef.current, targetSession]);
      store.sessionVersionsRef.current[sessionId] = store.sessionVersionsRef.current[sessionId] ?? 0;
    }
  }, [store]);

  useEffect(() => {
    if (!store.isReady) return;
    const timeout = window.setTimeout(() => void store.persistSessions(store.sessionsRef.current), 300);
    return () => window.clearTimeout(timeout);
  }, [store, store.isReady, store.sessions]);

  useEffect(() => {
    if (!store.isReady) return;
    const timeout = window.setTimeout(() => void store.persistSites(store.sitesRef.current), 300);
    return () => window.clearTimeout(timeout);
  }, [store, store.isReady, store.sites]);

  useEffect(() => {
    if (!store.isReady || !store.currentUser || !store.authTokenRef.current) return;
    if (store.dirtySessionIdsRef.current.size === 0) return;
    const timeout = window.setTimeout(() => void flushDirtySessions(), 900);
    return () => window.clearTimeout(timeout);
  }, [flushDirtySessions, store, store.currentUser, store.isReady, store.sessions]);

  useEffect(() => {
    if (!store.isReady) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void saveNow();
    };
    const handlePageHide = () => void saveNow();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [saveNow, store.isReady]);

  return { deleteSessionRemotely, flushDirtySessions, markSessionDirty, saveNow };
}
