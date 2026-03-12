'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInspectionSite,
  createInspectionSession,
  getSessionSiteKey,
  getSessionSiteTitle,
  getSessionSortTime,
} from '@/constants/inspectionSession';
import type {
  InspectionCover,
  InspectionSite,
  InspectionSession,
  SessionSaveState,
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

function loadSessions(): InspectionSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const migrated = (parsed as InspectionSession[]).map((session) => ({
      ...session,
      siteKey:
        typeof session.siteKey === 'string' && session.siteKey.trim()
          ? session.siteKey
          : getSessionSiteKey({
              cover: session.cover,
              siteKey: '',
            }),
    }));

    return sortSessions(migrated);
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
  const [saveState, setSaveState] = useState<SessionSaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const skipNextSessionPersistRef = useRef(true);
  const skipNextSitePersistRef = useRef(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Local storage hydration is intentionally deferred until mount.
    const nextSessions = loadSessions();
    const nextSites = loadSites(nextSessions);
    setSessions(nextSessions);
    setSites(nextSites);
    setLastSavedAt(nextSessions[0]?.lastSavedAt ?? null);
    setIsReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistSessions = useCallback((nextSessions: InspectionSession[]) => {
    try {
      const normalized = sortSessions(nextSessions);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      skipNextSessionPersistRef.current = true;
      setSessions(normalized);
      setLastSavedAt(normalized[0]?.lastSavedAt ?? null);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  const persistSites = useCallback((nextSites: InspectionSite[]) => {
    try {
      window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(nextSites));
      skipNextSitePersistRef.current = true;
      setSites(nextSites);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

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
    setSaveState('saving');
    persistSites([nextSite, ...sites]);
    return nextSite;
  }, [persistSites, sites]);

  const updateSite = useCallback(
    (siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
      const updatedAt = new Date().toISOString();
      setSaveState('saving');
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
    setSaveState('saving');
    setSites((current) => current.filter((site) => site.id !== siteId));
    setSessions((current) =>
      current.filter((session) => getSessionSiteKey(session) !== siteId)
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
        ...createInspectionSession(initialCover, resolvedSiteKey),
        updatedAt: savedAt,
        lastSavedAt: savedAt,
      };

      setSaveState('saving');
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
      setSaveState('saving');

      setSessions((current) =>
        sortSessions(
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
      setSaveState('saving');

      setSessions((current) =>
        sortSessions(
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
    setSaveState('saving');
    setSessions((current) => current.filter((session) => session.id !== sessionId));
  }, []);

  const deleteSessions = useCallback(
    (predicate: (session: InspectionSession) => boolean) => {
      setSaveState('saving');
      setSessions((current) => current.filter((session) => !predicate(session)));
    },
    []
  );

  const saveNow = useCallback(() => {
    if (!isReady) return;
    setSaveState('saving');
    persistSessions(sessions);
  }, [isReady, persistSessions, sessions]);

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
      saveState,
      lastSavedAt,
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
      saveState,
      lastSavedAt,
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
