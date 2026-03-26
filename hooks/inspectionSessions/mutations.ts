'use client';

import { useCallback } from 'react';
import {
  createInspectionSite,
  getSessionSiteKey,
  normalizeInspectionSession,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
import { createNewSafetySession } from '@/lib/safetyApiMappers';
import type {
  AdminSiteSnapshot,
  InspectionReportMeta,
  InspectionSite,
  InspectionSession,
} from '@/types/inspectionSession';
import type { InspectionSessionsStore } from './store';

export function useInspectionSessionsMutations(
  store: InspectionSessionsStore,
  markSessionDirty: (sessionId: string) => void
) {
  const {
    dirtySessionIdsRef,
    masterDataRef,
    sessionVersionsRef,
    sessionsRef,
    setSessionState,
    setSessions,
    setSiteState,
    setSites,
    sitesRef,
  } = store;

  const createSite = useCallback((snapshot: Partial<AdminSiteSnapshot>) => {
    const nextSite = createInspectionSite(snapshot);
    setSiteState([nextSite, ...sitesRef.current]);
    return nextSite;
  }, [setSiteState, sitesRef]);

  const updateSite = useCallback((siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
    setSites((current) => {
      const updatedAt = new Date().toISOString();
      const nextSites = current.map((site) =>
        site.id === siteId ? { ...normalizeInspectionSite(updater(site)), updatedAt } : site
      );
      sitesRef.current = nextSites;
      return nextSites;
    });
  }, [setSites, sitesRef]);

  const deleteSite = useCallback((siteId: string) => {
    setSiteState(sitesRef.current.filter((site) => site.id !== siteId));
    setSessionState(
      sessionsRef.current.filter((session) => getSessionSiteKey(session) !== siteId)
    );
  }, [sessionsRef, setSessionState, setSiteState, sitesRef]);

  const createSession = useCallback((site: InspectionSite, initial?: { meta?: Partial<InspectionReportMeta> }) => {
    const nextSession = createNewSafetySession(
      site,
      Math.max(
        0,
        ...sessionsRef.current.filter((session) => session.siteKey === site.id).map((session) => session.reportNumber || 0)
      ) + 1,
      masterDataRef.current,
      { meta: initial?.meta }
    );
    setSessionState([nextSession, ...sessionsRef.current]);
    markSessionDirty(nextSession.id);
    return nextSession;
  }, [markSessionDirty, masterDataRef, sessionsRef, setSessionState]);

  const updateSession = useCallback((sessionId: string, updater: (current: InspectionSession) => InspectionSession) => {
    const updatedAt = new Date().toISOString();
    setSessions((current) => {
      const nextSessions = current.map((session) =>
        session.id === sessionId ? { ...normalizeInspectionSession(updater(session)), updatedAt } : session
      );
      sessionsRef.current = nextSessions;
      return nextSessions;
    });
    markSessionDirty(sessionId);
  }, [markSessionDirty, sessionsRef, setSessions]);

  const updateSessions = useCallback((predicate: (session: InspectionSession) => boolean, updater: (current: InspectionSession) => InspectionSession) => {
    const updatedAt = new Date().toISOString();
    const touchedIds: string[] = [];
    setSessions((current) => {
      const nextSessions = current.map((session) => {
        if (!predicate(session)) return session;
        touchedIds.push(session.id);
        return { ...normalizeInspectionSession(updater(session)), updatedAt };
      });
      sessionsRef.current = nextSessions;
      return nextSessions;
    });
    touchedIds.forEach(markSessionDirty);
  }, [markSessionDirty, sessionsRef, setSessions]);

  const deleteSessions = useCallback((predicate: (session: InspectionSession) => boolean) => {
    const remaining = sessionsRef.current.filter((session) => !predicate(session));
    const removed = sessionsRef.current.filter((session) => predicate(session));
    removed.forEach((session) => {
      dirtySessionIdsRef.current.delete(session.id);
      delete sessionVersionsRef.current[session.id];
    });
    setSessionState(remaining);
  }, [dirtySessionIdsRef, sessionVersionsRef, sessionsRef, setSessionState]);

  return { createSession, createSite, deleteSessions, deleteSite, updateSession, updateSessions, updateSite };
}

