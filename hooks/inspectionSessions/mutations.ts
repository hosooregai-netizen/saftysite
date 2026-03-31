'use client';

import { useCallback } from 'react';
import {
  createInspectionSite,
  getSessionSiteKey,
  normalizeInspectionSession,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
import {
  createNewSafetySession,
  mapInspectionSessionToReportListItem,
} from '@/lib/safetyApiMappers';
import type {
  AdminSiteSnapshot,
  InspectionReportMeta,
  InspectionSite,
  InspectionSession,
} from '@/types/inspectionSession';
import {
  createEmptyReportIndexState,
  mergeReportIndexItems,
} from './helpers';
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
    setReportIndexBySiteId,
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
    setReportIndexBySiteId((current) => {
      if (!(siteId in current)) return current;
      const next = { ...current };
      delete next[siteId];
      return next;
    });
  }, [sessionsRef, setReportIndexBySiteId, setSessionState, setSiteState, sitesRef]);

  const createSession = useCallback((site: InspectionSite, initial?: { meta?: Partial<InspectionReportMeta> }) => {
    const nextSession = createNewSafetySession(
      site,
      sessionsRef.current.filter((session) => session.siteKey === site.id).length + 1,
      masterDataRef.current,
      { meta: initial?.meta }
    );
    setSessionState([nextSession, ...sessionsRef.current]);
    setReportIndexBySiteId((current) => ({
      ...current,
      [site.id]: {
        ...createEmptyReportIndexState(),
        ...(current[site.id] ?? {}),
        status: current[site.id]?.status ?? 'loaded',
        items: mergeReportIndexItems(
          current[site.id]?.items ?? [],
          [mapInspectionSessionToReportListItem(nextSession, site)],
        ),
        fetchedAt: current[site.id]?.fetchedAt ?? new Date().toISOString(),
        error: null,
      },
    }));
    markSessionDirty(nextSession.id);
    return nextSession;
  }, [markSessionDirty, masterDataRef, sessionsRef, setReportIndexBySiteId, setSessionState]);

  const updateSession = useCallback((sessionId: string, updater: (current: InspectionSession) => InspectionSession) => {
    const updatedAt = new Date().toISOString();
    const currentSession = sessionsRef.current.find((session) => session.id === sessionId);
    if (!currentSession) return;

    const updatedSession = {
      ...normalizeInspectionSession(updater(currentSession)),
      updatedAt,
    };

    setSessions((current) => {
      const nextSessions = current.map((session) =>
        session.id === sessionId ? updatedSession : session
      );
      sessionsRef.current = nextSessions;
      return nextSessions;
    });

    const siteId = getSessionSiteKey(updatedSession);
    const site = sitesRef.current.find((item) => item.id === siteId);
    if (site) {
      setReportIndexBySiteId((current) => ({
        ...current,
        [siteId]: {
          ...createEmptyReportIndexState(),
          ...(current[siteId] ?? {}),
          status: current[siteId]?.status ?? 'loaded',
          items: mergeReportIndexItems(
            current[siteId]?.items ?? [],
            [mapInspectionSessionToReportListItem(updatedSession, site)],
          ),
          fetchedAt: current[siteId]?.fetchedAt ?? new Date().toISOString(),
          error: null,
        },
      }));
    }
    markSessionDirty(sessionId);
  }, [markSessionDirty, sessionsRef, setReportIndexBySiteId, setSessions, sitesRef]);

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
    if (removed.length > 0) {
      setReportIndexBySiteId((current) => {
        const next = { ...current };
        removed.forEach((session) => {
          const siteId = getSessionSiteKey(session);
          const currentState = next[siteId];
          if (!currentState) return;
          next[siteId] = {
            ...currentState,
            items: currentState.items.filter((item) => item.reportKey !== session.id),
          };
        });
        return next;
      });
    }
  }, [dirtySessionIdsRef, sessionVersionsRef, sessionsRef, setReportIndexBySiteId, setSessionState]);

  return { createSession, createSite, deleteSessions, deleteSite, updateSession, updateSessions, updateSite };
}

