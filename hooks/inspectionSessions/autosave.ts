'use client';

import { useCallback, useEffect } from 'react';
import { getSessionSiteKey } from '@/constants/inspectionSession';
import {
  createEmptyReportIndexState,
  mergeReportIndexItems,
} from '@/hooks/inspectionSessions/helpers';
import {
  archiveSafetyReportByKey,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import {
  buildSafetyReportUpsertInput,
  isSafetyAdmin,
  mapInspectionSessionToReportListItem,
  mapSafetyReportListItem,
} from '@/lib/safetyApiMappers';
import { getErrorMessage, isAuthFailure } from './helpers';
import type { InspectionSessionsStore } from './store';

export function useInspectionSessionsAutosave(store: InspectionSessionsStore) {
  const {
    authTokenRef,
    clearAuthState,
    currentUser,
    dirtySessionIdsRef,
    isFlushingRef,
    isReady,
    persistSessions,
    persistSites,
    sessionVersionsRef,
    sessions,
    sessionsRef,
    setAuthError,
    setIsSaving,
    setReportIndexBySiteId,
    setSessionState,
    setSessions,
    setSyncError,
    sites,
    sitesRef,
  } = store;

  const markSessionDirty = useCallback((sessionId: string) => {
    dirtySessionIdsRef.current.add(sessionId);
    sessionVersionsRef.current[sessionId] =
      (sessionVersionsRef.current[sessionId] ?? 0) + 1;
  }, [dirtySessionIdsRef, sessionVersionsRef]);

  const updateSavedTimestamp = useCallback((sessionId: string, savedAt: string) => {
    setSessions((current) => {
      const nextSessions = current.map((session) =>
        session.id === sessionId ? { ...session, updatedAt: savedAt, lastSavedAt: savedAt } : session
      );
      sessionsRef.current = nextSessions;
      return nextSessions;
    });
  }, [sessionsRef, setSessions]);

  const flushDirtySessions = useCallback(async () => {
    if (isFlushingRef.current || !authTokenRef.current || !currentUser) return;
    const pendingSessionIds = Array.from(dirtySessionIdsRef.current);
    if (pendingSessionIds.length === 0) return;

    isFlushingRef.current = true;
    setIsSaving(true);
    setSyncError(null);

    try {
      for (const sessionId of pendingSessionIds) {
        const session = sessionsRef.current.find((item) => item.id === sessionId);
        if (!session) {
          dirtySessionIdsRef.current.delete(sessionId);
          continue;
        }
        const site = sitesRef.current.find((item) => item.id === getSessionSiteKey(session));
        if (!site) continue;

        const versionAtSync = sessionVersionsRef.current[sessionId] ?? 0;
        const savedReport = await upsertSafetyReport(
          authTokenRef.current,
          buildSafetyReportUpsertInput(session, site)
        );

        setReportIndexBySiteId((current) => ({
          ...current,
          [site.id]: {
            ...createEmptyReportIndexState(),
            ...(current[site.id] ?? {}),
            status: 'loaded',
            items: mergeReportIndexItems(
              current[site.id]?.items ?? [],
              [mapSafetyReportListItem(savedReport)],
            ),
            fetchedAt: current[site.id]?.fetchedAt ?? new Date().toISOString(),
            error: null,
          },
        }));

        if ((sessionVersionsRef.current[sessionId] ?? 0) === versionAtSync) {
          dirtySessionIdsRef.current.delete(sessionId);
          updateSavedTimestamp(
            sessionId,
            savedReport.last_autosaved_at || savedReport.updated_at || new Date().toISOString()
          );
        }
      }
    } catch (error) {
      if (isAuthFailure(error)) {
        clearAuthState();
        setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        setSyncError(getErrorMessage(error));
      }
    } finally {
      isFlushingRef.current = false;
      setIsSaving(false);
    }
  }, [
    authTokenRef,
    clearAuthState,
    currentUser,
    dirtySessionIdsRef,
    isFlushingRef,
    sessionVersionsRef,
    sessionsRef,
    setAuthError,
    setIsSaving,
    setReportIndexBySiteId,
    setSyncError,
    sitesRef,
    updateSavedTimestamp,
  ]);

  const saveNow = useCallback(async () => {
    await Promise.all([
      persistSessions(sessionsRef.current),
      persistSites(sitesRef.current),
    ]);
    await flushDirtySessions();
  }, [flushDirtySessions, persistSessions, persistSites, sessionsRef, sitesRef]);

  const deleteSessionRemotely = useCallback(async (sessionId: string) => {
    const targetSession = sessionsRef.current.find((session) => session.id === sessionId);
    if (!targetSession) return;

    if (!currentUser || !authTokenRef.current || !isSafetyAdmin(currentUser)) {
      setSyncError('보고서 삭제는 관리자 권한에서만 가능합니다.');
      return;
    }

    const site = sitesRef.current.find((item) => item.id === targetSession.siteKey) ?? null;

    setSyncError(null);
    const nextSessions = sessionsRef.current.filter((session) => session.id !== sessionId);
    setSessionState(nextSessions);
    dirtySessionIdsRef.current.delete(sessionId);
    delete sessionVersionsRef.current[sessionId];
    if (site) {
      setReportIndexBySiteId((current) => {
        const currentState = current[site.id];
        if (!currentState) return current;

        return {
          ...current,
          [site.id]: {
            ...currentState,
            items: currentState.items.filter((item) => item.reportKey !== targetSession.id),
          },
        };
      });
    }

    try {
      await archiveSafetyReportByKey(authTokenRef.current, targetSession.id);
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSessionState([...sessionsRef.current, targetSession]);
      if (site) {
        setReportIndexBySiteId((current) => ({
          ...current,
          [site.id]: {
            ...createEmptyReportIndexState(),
            ...(current[site.id] ?? {}),
            status: current[site.id]?.status ?? 'loaded',
            items: mergeReportIndexItems(
              current[site.id]?.items ?? [],
              [mapInspectionSessionToReportListItem(targetSession, site)],
            ),
            fetchedAt: current[site.id]?.fetchedAt ?? new Date().toISOString(),
            error: current[site.id]?.error ?? null,
          },
        }));
      }
      sessionVersionsRef.current[sessionId] = sessionVersionsRef.current[sessionId] ?? 0;
    }
  }, [authTokenRef, currentUser, dirtySessionIdsRef, sessionVersionsRef, sessionsRef, setReportIndexBySiteId, setSessionState, setSyncError, sitesRef]);

  useEffect(() => {
    if (!isReady) return;
    const timeout = window.setTimeout(() => void persistSessions(sessionsRef.current), 300);
    return () => window.clearTimeout(timeout);
  }, [isReady, persistSessions, sessions, sessionsRef]);

  useEffect(() => {
    if (!isReady) return;
    const timeout = window.setTimeout(() => void persistSites(sitesRef.current), 300);
    return () => window.clearTimeout(timeout);
  }, [isReady, persistSites, sites, sitesRef]);

  useEffect(() => {
    if (!isReady || !currentUser || !authTokenRef.current) return;
    if (dirtySessionIdsRef.current.size === 0) return;
    const timeout = window.setTimeout(() => void flushDirtySessions(), 900);
    return () => window.clearTimeout(timeout);
  }, [authTokenRef, currentUser, dirtySessionIdsRef, flushDirtySessions, isReady, sessions]);

  useEffect(() => {
    if (!isReady) return;
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
  }, [isReady, saveNow]);

  return { deleteSessionRemotely, flushDirtySessions, markSessionDirty, saveNow };
}
