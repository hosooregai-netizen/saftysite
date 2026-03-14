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
import { readPersistedValue, writePersistedValue } from '@/lib/clientPersistence';
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
  const sessionsRef = useRef<InspectionSession[]>([]);
  const sitesRef = useRef<InspectionSite[]>([]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const storedSessions = await readPersistedValue<InspectionSession[]>(STORAGE_KEY);
      const shouldMigrateSessions = !Array.isArray(storedSessions);
      const nextSessions = Array.isArray(storedSessions)
        ? normalizeSessions(
            storedSessions.map((session) =>
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
            )
          )
        : loadSessions();

      const storedSites = await readPersistedValue<InspectionSite[]>(SITE_STORAGE_KEY);
      const shouldMigrateSites = !Array.isArray(storedSites);
      const nextSites = Array.isArray(storedSites)
        ? storedSites
        : loadSites(nextSessions);

      if (cancelled) return;

      sessionsRef.current = nextSessions;
      sitesRef.current = nextSites;
      setSessions(nextSessions);
      setSites(nextSites);
      setIsReady(true);

      if (shouldMigrateSessions) {
        void writePersistedValue(STORAGE_KEY, nextSessions);
      }
      if (shouldMigrateSites) {
        void writePersistedValue(SITE_STORAGE_KEY, nextSites);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSessions = useCallback(async (nextSessions: InspectionSession[]) => {
    const normalized = normalizeSessions(nextSessions);
    await writePersistedValue(STORAGE_KEY, normalized);
  }, []);

  const persistSites = useCallback(async (nextSites: InspectionSite[]) => {
    await writePersistedValue(SITE_STORAGE_KEY, nextSites);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const timeout = window.setTimeout(() => {
      void persistSessions(sessionsRef.current);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [isReady, persistSessions, sessions]);

  useEffect(() => {
    if (!isReady) return;

    const timeout = window.setTimeout(() => {
      void persistSites(sitesRef.current);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [isReady, persistSites, sites]);

  const createSite = useCallback((title: string) => {
    const nextSite = createInspectionSite(title);
    const nextSites = [nextSite, ...sitesRef.current];
    sitesRef.current = nextSites;
    setSites(nextSites);
    void persistSites(nextSites);
    return nextSite;
  }, [persistSites]);

  const updateSite = useCallback(
    (siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
      const updatedAt = new Date().toISOString();
      setSites((current) => {
        const nextSites = current.map((site) =>
          site.id === siteId
            ? {
                ...updater(site),
                updatedAt,
              }
            : site
        );
        sitesRef.current = nextSites;
        return nextSites;
      });
    },
    []
  );

  const deleteSite = useCallback((siteId: string) => {
    setSites((current) => {
      const nextSites = current.filter((site) => site.id !== siteId);
      sitesRef.current = nextSites;
      return nextSites;
    });
    setSessions((current) => {
      const nextSessions = normalizeSessions(
        current.filter((session) => getSessionSiteKey(session) !== siteId)
      );
      sessionsRef.current = nextSessions;
      return nextSessions;
    });
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
            ...sessionsRef.current
              .filter((session) => getSessionSiteKey(session) === resolvedSiteKey)
              .map((session) => session.reportNumber || 0)
          ) + 1
        ),
        updatedAt: savedAt,
        lastSavedAt: savedAt,
      };

      const nextSessions = [nextSession, ...sessionsRef.current];
      const normalized = normalizeSessions(nextSessions);
      sessionsRef.current = normalized;
      setSessions(normalized);
      void persistSessions(normalized);
      return nextSession;
    },
    [persistSessions]
  );

  const updateSession = useCallback(
    (
      sessionId: string,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const savedAt = new Date().toISOString();

      setSessions((current) => {
        const nextSessions = normalizeSessions(
          current.map((session) => {
            if (session.id !== sessionId) return session;

            const updated = updater(session);
            return {
              ...updated,
              updatedAt: savedAt,
              lastSavedAt: savedAt,
            };
          })
        );
        sessionsRef.current = nextSessions;
        return nextSessions;
      });
    },
    []
  );

  const updateSessions = useCallback(
    (
      predicate: (session: InspectionSession) => boolean,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const savedAt = new Date().toISOString();

      setSessions((current) => {
        const nextSessions = normalizeSessions(
          current.map((session) => {
            if (!predicate(session)) return session;

            const updated = updater(session);
            return {
              ...updated,
              updatedAt: savedAt,
              lastSavedAt: savedAt,
            };
          })
        );
        sessionsRef.current = nextSessions;
        return nextSessions;
      });
    },
    []
  );

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((current) => {
      const nextSessions = normalizeSessions(
        current.filter((session) => session.id !== sessionId)
      );
      sessionsRef.current = nextSessions;
      return nextSessions;
    });
  }, []);

  const deleteSessions = useCallback(
    (predicate: (session: InspectionSession) => boolean) => {
      setSessions((current) => {
        const nextSessions = normalizeSessions(
          current.filter((session) => !predicate(session))
        );
        sessionsRef.current = nextSessions;
        return nextSessions;
      });
    },
    []
  );

  const saveNow = useCallback(async () => {
    if (!isReady) return;
    await Promise.all([
      persistSessions(sessionsRef.current),
      persistSites(sitesRef.current),
    ]);
  }, [isReady, persistSessions, persistSites]);

  useEffect(() => {
    if (!isReady) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void saveNow();
      }
    };

    const handlePageHide = () => {
      void saveNow();
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
