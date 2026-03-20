'use client';

import { useCallback } from 'react';
import {
  createInspectionSite,
  createInspectionSession,
  getSessionSiteKey,
  normalizeInspectionSession,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
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
  const createSite = useCallback((snapshot: Partial<AdminSiteSnapshot>) => {
    const nextSite = createInspectionSite(snapshot);
    store.setSiteState([nextSite, ...store.sitesRef.current]);
    return nextSite;
  }, [store]);

  const updateSite = useCallback((siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
    store.setSites((current) => {
      const updatedAt = new Date().toISOString();
      const nextSites = current.map((site) =>
        site.id === siteId ? { ...normalizeInspectionSite(updater(site)), updatedAt } : site
      );
      store.sitesRef.current = nextSites;
      return nextSites;
    });
  }, [store]);

  const deleteSite = useCallback((siteId: string) => {
    store.setSiteState(store.sitesRef.current.filter((site) => site.id !== siteId));
    store.setSessionState(
      store.sessionsRef.current.filter((session) => getSessionSiteKey(session) !== siteId)
    );
  }, [store]);

  const createSession = useCallback((site: InspectionSite, initial?: { meta?: Partial<InspectionReportMeta> }) => {
    const nextSession = createInspectionSession(
      { adminSiteSnapshot: site.adminSiteSnapshot, meta: initial?.meta },
      site.id,
      Math.max(
        0,
        ...store.sessionsRef.current.filter((session) => session.siteKey === site.id).map((session) => session.reportNumber || 0)
      ) + 1
    );
    store.setSessionState([nextSession, ...store.sessionsRef.current]);
    markSessionDirty(nextSession.id);
    return nextSession;
  }, [markSessionDirty, store]);

  const updateSession = useCallback((sessionId: string, updater: (current: InspectionSession) => InspectionSession) => {
    const updatedAt = new Date().toISOString();
    store.setSessions((current) => {
      const nextSessions = current.map((session) =>
        session.id === sessionId ? { ...normalizeInspectionSession(updater(session)), updatedAt } : session
      );
      store.sessionsRef.current = nextSessions;
      return nextSessions;
    });
    markSessionDirty(sessionId);
  }, [markSessionDirty, store]);

  const updateSessions = useCallback((predicate: (session: InspectionSession) => boolean, updater: (current: InspectionSession) => InspectionSession) => {
    const updatedAt = new Date().toISOString();
    const touchedIds: string[] = [];
    store.setSessions((current) => {
      const nextSessions = current.map((session) => {
        if (!predicate(session)) return session;
        touchedIds.push(session.id);
        return { ...normalizeInspectionSession(updater(session)), updatedAt };
      });
      store.sessionsRef.current = nextSessions;
      return nextSessions;
    });
    touchedIds.forEach(markSessionDirty);
  }, [markSessionDirty, store]);

  const deleteSessions = useCallback((predicate: (session: InspectionSession) => boolean) => {
    const remaining = store.sessionsRef.current.filter((session) => !predicate(session));
    const removed = store.sessionsRef.current.filter((session) => predicate(session));
    removed.forEach((session) => {
      store.dirtySessionIdsRef.current.delete(session.id);
      delete store.sessionVersionsRef.current[session.id];
    });
    store.setSessionState(remaining);
  }, [store]);

  return { createSession, createSite, deleteSessions, deleteSite, updateSession, updateSessions, updateSite };
}
