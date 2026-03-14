'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInspectionSite,
  createInspectionSession,
  ensureSessionReportNumbers,
  getSessionSiteKey,
  getSessionSiteTitle,
  getSessionSortTime,
  normalizeInspectionSession,
} from '@/constants/inspectionSession';
import type {
  InspectionCover,
  InspectionSite,
  InspectionSession,
} from '@/types/inspectionSession';

const STORAGE_KEY = 'inspection-sessions-v1';
const SITE_STORAGE_KEY = 'inspection-sites-v1';

function sortSessions(items: InspectionSession[]): InspectionSession[] {
  return [...items].sort((left, right) => {
    const primary = getSessionSortTime(right) - getSessionSortTime(left);
    if (primary !== 0) return primary;

    const secondary =
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    if (secondary !== 0) return secondary;

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function normalizeSessions(items: InspectionSession[]): InspectionSession[] {
  return sortSessions(ensureSessionReportNumbers(items));
}

function loadSessions(): InspectionSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const migrated = (parsed as InspectionSession[]).map((session) =>
      normalizeInspectionSession({
        ...session,
        siteKey:
          typeof session.siteKey === 'string' && session.siteKey.trim()
            ? session.siteKey
            : getSessionSiteKey({
                cover: session.cover,
                siteKey: '',
              }),
      })
    );

    return normalizeSessions(migrated);
  } catch {
    return [];
  }
}

function loadSites(sessions: InspectionSession[]): InspectionSite[] {
  try {
    const raw = window.localStorage.getItem(SITE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as InspectionSite[];
      }
    }
  } catch {
    // Fall through to migration from stored sessions.
  }

  const derivedSites = new Map<string, InspectionSite>();

  for (const session of sessions) {
    const siteKey = getSessionSiteKey(session);
    if (derivedSites.has(siteKey)) continue;

    const title = getSessionSiteTitle(session);
    derivedSites.set(siteKey, {
      id: siteKey,
      title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  }

  return Array.from(derivedSites.values()).sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export function useInspectionSessions() {
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [sites, setSites] = useState<InspectionSite[]>([]);
  const [isReady, setIsReady] = useState(false);
  const skipNextSessionPersistRef = useRef(true);
  const skipNextSitePersistRef = useRef(true);
  const sessionsRef = useRef<InspectionSession[]>([]);
  const sitesRef = useRef<InspectionSite[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Local storage hydration is intentionally deferred until mount.
    const nextSessions = loadSessions();
    const nextSites = loadSites(nextSessions);
    sessionsRef.current = nextSessions;
    sitesRef.current = nextSites;
    setSessions(nextSessions);
    setSites(nextSites);
    setIsReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistSessions = useCallback((nextSessions: InspectionSession[]) => {
    try {
      const normalized = normalizeSessions(nextSessions);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      skipNextSessionPersistRef.current = true;
      sessionsRef.current = normalized;
      setSessions(normalized);
    } catch {}
  }, []);

  const persistSites = useCallback((nextSites: InspectionSite[]) => {
    try {
      window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(nextSites));
      skipNextSitePersistRef.current = true;
      sitesRef.current = nextSites;
      setSites(nextSites);
    } catch {}
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    sitesRef.current = sites;
  }, [sites]);

  useEffect(() => {
    if (!isReady) return;
    if (skipNextSessionPersistRef.current) {
      skipNextSessionPersistRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      persistSessions(sessions);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [isReady, persistSessions, sessions]);

  useEffect(() => {
    if (!isReady) return;
    if (skipNextSitePersistRef.current) {
      skipNextSitePersistRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      persistSites(sites);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [isReady, persistSites, sites]);

  const createSite = useCallback((title: string) => {
    const nextSite = createInspectionSite(title);
    persistSites([nextSite, ...sites]);
    return nextSite;
  }, [persistSites, sites]);

  const updateSite = useCallback(
    (siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
      const updatedAt = new Date().toISOString();
      setSites((current) =>
        current.map((site) =>
          site.id === siteId
            ? {
                ...updater(site),
                updatedAt,
              }
            : site
        )
      );
    },
    []
  );

  const deleteSite = useCallback((siteId: string) => {
    setSites((current) => current.filter((site) => site.id !== siteId));
    setSessions((current) =>
      normalizeSessions(current.filter((session) => getSessionSiteKey(session) !== siteId))
    );
  }, []);

  const createSession = useCallback(
    (initialCover: Partial<InspectionCover> = {}, siteKey?: string) => {
      const savedAt = new Date().toISOString();
      const resolvedSiteKey =
        siteKey ??
        getSessionSiteKey({
          cover: {
            businessName: initialCover.businessName ?? '',
            projectName: initialCover.projectName ?? '',
            inspectionDate: initialCover.inspectionDate ?? '',
            consultantName: initialCover.consultantName ?? '',
            processSummary: initialCover.processSummary ?? '',
            siteAddress: initialCover.siteAddress ?? '',
            contractorName: initialCover.contractorName ?? '',
            notes: initialCover.notes ?? '',
          },
          siteKey: '',
        });
      const nextSession = {
        ...createInspectionSession(
          initialCover,
          resolvedSiteKey,
          Math.max(
            0,
            ...sessions
              .filter((session) => getSessionSiteKey(session) === resolvedSiteKey)
              .map((session) => session.reportNumber || 0)
          ) + 1
        ),
        updatedAt: savedAt,
        lastSavedAt: savedAt,
      };

      persistSessions([nextSession, ...sessions]);
      return nextSession;
    },
    [persistSessions, sessions]
  );

  const updateSession = useCallback(
    (
      sessionId: string,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const savedAt = new Date().toISOString();

      setSessions((current) =>
        normalizeSessions(
          current.map((session) => {
            if (session.id !== sessionId) return session;

            const updated = updater(session);
            return {
              ...updated,
              updatedAt: savedAt,
              lastSavedAt: savedAt,
            };
          })
        )
      );
    },
    []
  );

  const updateSessions = useCallback(
    (
      predicate: (session: InspectionSession) => boolean,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const savedAt = new Date().toISOString();

      setSessions((current) =>
        normalizeSessions(
          current.map((session) => {
            if (!predicate(session)) return session;

            const updated = updater(session);
            return {
              ...updated,
              updatedAt: savedAt,
              lastSavedAt: savedAt,
            };
          })
        )
      );
    },
    []
  );

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((current) =>
      normalizeSessions(current.filter((session) => session.id !== sessionId))
    );
  }, []);

  const deleteSessions = useCallback(
    (predicate: (session: InspectionSession) => boolean) => {
      setSessions((current) =>
        normalizeSessions(current.filter((session) => !predicate(session)))
      );
    },
    []
  );

  const saveNow = useCallback(() => {
    if (!isReady) return;
    persistSessions(sessionsRef.current);
    persistSites(sitesRef.current);
  }, [isReady, persistSessions, persistSites]);

  useEffect(() => {
    if (!isReady) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveNow();
      }
    };

    const handlePageHide = () => {
      saveNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [isReady, saveNow]);

  const getSessionById = useCallback(
    (sessionId: string) => sessions.find((session) => session.id === sessionId) || null,
    [sessions]
  );

  const getSiteById = useCallback(
    (siteId: string) => sites.find((site) => site.id === siteId) || null,
    [sites]
  );

  return useMemo(
    () => ({
      sites,
      sessions,
      isReady,
      createSite,
      updateSite,
      deleteSite,
      createSession,
      updateSession,
      updateSessions,
      deleteSession,
      deleteSessions,
      saveNow,
      getSessionById,
      getSiteById,
    }),
    [
      sites,
      sessions,
      isReady,
      createSite,
      updateSite,
      deleteSite,
      createSession,
      updateSession,
      updateSessions,
      deleteSession,
      deleteSessions,
      saveNow,
      getSessionById,
      getSiteById,
    ]
  );
}
