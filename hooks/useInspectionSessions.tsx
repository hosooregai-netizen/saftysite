'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  createInspectionSite,
  ensureSessionReportNumbers,
  getSessionSiteKey,
  getSessionSortTime,
  normalizeInspectionSession,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
import {
  archiveSafetyReportByKey,
  clearSafetyAuthToken,
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
  fetchSafetyReportsBySite,
  loginSafetyApi,
  readSafetyAuthToken,
  SafetyApiError,
  upsertSafetyReport,
  writeSafetyAuthToken,
} from '@/lib/safetyApi';
import {
  buildSafetyMasterData,
  buildSafetyReportUpsertInput,
  createNewSafetySession,
  isSafetyAdmin,
  mapSafetyReportToInspectionSession,
  mapSafetySiteToInspectionSite,
} from '@/lib/safetyApiMappers';
import {
  readPersistedValue,
  writePersistedValue,
} from '@/lib/clientPersistence';
import type {
  SafetyHydratedData,
  SafetyLoginInput,
  SafetyMasterData,
  SafetyUser,
} from '@/types/backend';
import type {
  AdminSiteSnapshot,
  InspectionReportMeta,
  InspectionSite,
  InspectionSession,
} from '@/types/inspectionSession';

const STORAGE_KEY = 'inspection-sessions-v8';
const SITE_STORAGE_KEY = 'inspection-sites-v8';
const EMPTY_MASTER_DATA = buildSafetyMasterData([]);

interface InspectionSessionsContextValue {
  sites: InspectionSite[];
  sessions: InspectionSession[];
  isReady: boolean;
  isAuthenticated: boolean;
  isSaving: boolean;
  currentUser: SafetyUser | null;
  masterData: SafetyMasterData;
  authError: string | null;
  dataError: string | null;
  syncError: string | null;
  canArchiveReports: boolean;
  login: (input: SafetyLoginInput) => Promise<void>;
  logout: () => void;
  reload: () => Promise<void>;
  createSite: (snapshot: Partial<AdminSiteSnapshot>) => InspectionSite;
  updateSite: (
    siteId: string,
    updater: (current: InspectionSite) => InspectionSite
  ) => void;
  deleteSite: (siteId: string) => void;
  createSession: (
    site: InspectionSite,
    initial?: {
      meta?: Partial<InspectionReportMeta>;
    }
  ) => InspectionSession;
  updateSession: (
    sessionId: string,
    updater: (current: InspectionSession) => InspectionSession
  ) => void;
  updateSessions: (
    predicate: (session: InspectionSession) => boolean,
    updater: (current: InspectionSession) => InspectionSession
  ) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteSessions: (predicate: (session: InspectionSession) => boolean) => void;
  saveNow: () => Promise<void>;
  getSessionById: (sessionId: string) => InspectionSession | null;
  getSiteById: (siteId: string) => InspectionSite | null;
}

const InspectionSessionsContext =
  createContext<InspectionSessionsContextValue | null>(null);

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

function normalizeSites(items: InspectionSite[]): InspectionSite[] {
  return items.map((item) => normalizeInspectionSite(item));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '요청을 처리하는 중 오류가 발생했습니다.';
}

function isAuthFailure(error: unknown): boolean {
  return error instanceof SafetyApiError && (error.status === 401 || error.status === 403);
}

export function InspectionSessionsProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [sites, setSites] = useState<InspectionSite[]>([]);
  const [masterData, setMasterData] = useState<SafetyMasterData>(EMPTY_MASTER_DATA);
  const [currentUser, setCurrentUser] = useState<SafetyUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sessionsRef = useRef<InspectionSession[]>([]);
  const sitesRef = useRef<InspectionSite[]>([]);
  const masterDataRef = useRef<SafetyMasterData>(EMPTY_MASTER_DATA);
  const authTokenRef = useRef<string | null>(null);
  const dirtySessionIdsRef = useRef<Set<string>>(new Set());
  const sessionVersionsRef = useRef<Record<string, number>>({});
  const isFlushingRef = useRef(false);

  const setSessionState = useCallback((nextSessions: InspectionSession[]) => {
    const normalized = normalizeSessions(nextSessions);
    sessionsRef.current = normalized;
    setSessions(normalized);
  }, []);

  const setSiteState = useCallback((nextSites: InspectionSite[]) => {
    const normalized = normalizeSites(nextSites);
    sitesRef.current = normalized;
    setSites(normalized);
  }, []);

  const resetSessionVersions = useCallback((nextSessions: InspectionSession[]) => {
    sessionVersionsRef.current = nextSessions.reduce<Record<string, number>>(
      (accumulator, session) => {
        accumulator[session.id] = 0;
        return accumulator;
      },
      {}
    );
    dirtySessionIdsRef.current.clear();
  }, []);

  const persistSessions = useCallback(async (nextSessions: InspectionSession[]) => {
    await writePersistedValue(STORAGE_KEY, normalizeSessions(nextSessions));
  }, []);

  const persistSites = useCallback(async (nextSites: InspectionSite[]) => {
    await writePersistedValue(SITE_STORAGE_KEY, normalizeSites(nextSites));
  }, []);

  const clearAuthState = useCallback(() => {
    clearSafetyAuthToken();
    authTokenRef.current = null;
    dirtySessionIdsRef.current.clear();
    sessionVersionsRef.current = {};
    sessionsRef.current = [];
    sitesRef.current = [];
    masterDataRef.current = EMPTY_MASTER_DATA;
    setSessions([]);
    setSites([]);
    setMasterData(EMPTY_MASTER_DATA);
    setCurrentUser(null);
    setIsSaving(false);
  }, []);

  const hydrateRemoteState = useCallback(
    async (token: string): Promise<SafetyHydratedData> => {
      const [user, rawSites, contentItems] = await Promise.all([
        fetchCurrentSafetyUser(token),
        fetchAssignedSafetySites(token),
        fetchSafetyContentItems(token),
      ]);
      const mappedSites = rawSites.map(mapSafetySiteToInspectionSite);
      const nextMasterData = buildSafetyMasterData(contentItems);

      const reportGroups = await Promise.all(
        mappedSites.map(async (site) => ({
          site,
          reports: await fetchSafetyReportsBySite(token, site.id),
        }))
      );

      const nextSessions = normalizeSessions(
        reportGroups.flatMap(({ site, reports }) =>
          reports.map((report) =>
            mapSafetyReportToInspectionSession(report, site, nextMasterData)
          )
        )
      );

      return {
        user,
        sites: mappedSites,
        sessions: nextSessions,
        masterData: nextMasterData,
      };
    },
    []
  );

  const applyHydratedState = useCallback(
    async (data: SafetyHydratedData) => {
      authTokenRef.current = readSafetyAuthToken();
      masterDataRef.current = data.masterData;
      setCurrentUser(data.user);
      setMasterData(data.masterData);
      setSiteState(data.sites);
      setSessionState(data.sessions);
      resetSessionVersions(data.sessions);
      await Promise.all([persistSites(data.sites), persistSessions(data.sessions)]);
    },
    [persistSessions, persistSites, resetSessionVersions, setSessionState, setSiteState]
  );

  const reload = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token) {
      setIsReady(true);
      return;
    }

    setDataError(null);

    try {
      const data = await hydrateRemoteState(token);
      await applyHydratedState(data);
    } catch (error) {
      if (isAuthFailure(error)) {
        clearAuthState();
        setAuthError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        setDataError(getErrorMessage(error));
      }
    } finally {
      setIsReady(true);
    }
  }, [applyHydratedState, clearAuthState, hydrateRemoteState]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const [cachedSessions, cachedSites] = await Promise.all([
        readPersistedValue<InspectionSession[]>(STORAGE_KEY),
        readPersistedValue<InspectionSite[]>(SITE_STORAGE_KEY),
      ]);

      if (cancelled) return;

      if (cachedSites?.length) {
        setSiteState(cachedSites);
      }

      if (cachedSessions?.length) {
        setSessionState(cachedSessions);
        resetSessionVersions(cachedSessions);
      }

      const token = readSafetyAuthToken();
      if (!token) {
        setIsReady(true);
        return;
      }

      authTokenRef.current = token;
      await reload();
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [reload, resetSessionVersions, setSessionState, setSiteState]);

  useEffect(() => {
    if (!isReady) return;

    const timeout = window.setTimeout(() => {
      void persistSessions(sessionsRef.current);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isReady, persistSessions, sessions]);

  useEffect(() => {
    if (!isReady) return;

    const timeout = window.setTimeout(() => {
      void persistSites(sitesRef.current);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isReady, persistSites, sites]);

  const markSessionDirty = useCallback((sessionId: string) => {
    dirtySessionIdsRef.current.add(sessionId);
    sessionVersionsRef.current[sessionId] =
      (sessionVersionsRef.current[sessionId] ?? 0) + 1;
  }, []);

  const updateSavedTimestamp = useCallback(
    (sessionId: string, savedAt: string) => {
      setSessions((current) => {
        const nextSessions = normalizeSessions(
          current.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  updatedAt: savedAt,
                  lastSavedAt: savedAt,
                }
              : session
          )
        );
        sessionsRef.current = nextSessions;
        return nextSessions;
      });
    },
    []
  );

  const flushDirtySessions = useCallback(async () => {
    if (isFlushingRef.current) return;
    if (!authTokenRef.current || !currentUser) return;

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
        if (!site) {
          continue;
        }

        const versionAtSync = sessionVersionsRef.current[sessionId] ?? 0;
        const savedReport = await upsertSafetyReport(
          authTokenRef.current,
          buildSafetyReportUpsertInput(session, site)
        );

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
  }, [clearAuthState, currentUser, updateSavedTimestamp]);

  useEffect(() => {
    if (!isReady || !currentUser || !authTokenRef.current) return;
    if (dirtySessionIdsRef.current.size === 0) return;

    const timeout = window.setTimeout(() => {
      void flushDirtySessions();
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [currentUser, flushDirtySessions, isReady, sessions]);

  const login = useCallback(
    async (input: SafetyLoginInput) => {
      setAuthError(null);
      setDataError(null);
      setSyncError(null);
      setIsReady(false);

      try {
        const token = await loginSafetyApi(input);
        writeSafetyAuthToken(token.access_token);
        authTokenRef.current = token.access_token;

        const data = await hydrateRemoteState(token.access_token);
        await applyHydratedState(data);
      } catch (error) {
        clearAuthState();
        setAuthError(getErrorMessage(error));
        throw error;
      } finally {
        setIsReady(true);
      }
    },
    [applyHydratedState, clearAuthState, hydrateRemoteState]
  );

  const logout = useCallback(() => {
    clearAuthState();
    setAuthError(null);
    setDataError(null);
    setSyncError(null);
    setIsReady(true);
  }, [clearAuthState]);

  const createSite = useCallback(
    (snapshot: Partial<AdminSiteSnapshot>) => {
      const nextSite = createInspectionSite(snapshot);
      const nextSites = [nextSite, ...sitesRef.current];
      setSiteState(nextSites);
      return nextSite;
    },
    [setSiteState]
  );

  const updateSite = useCallback(
    (siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
      setSites((current) => {
        const updatedAt = new Date().toISOString();
        const nextSites = normalizeSites(
          current.map((site) =>
            site.id === siteId
              ? {
                  ...normalizeInspectionSite(updater(site)),
                  updatedAt,
                }
              : site
          )
        );
        sitesRef.current = nextSites;
        return nextSites;
      });
    },
    []
  );

  const deleteSite = useCallback((siteId: string) => {
    setSiteState(sitesRef.current.filter((site) => site.id !== siteId));
    setSessionState(
      sessionsRef.current.filter((session) => getSessionSiteKey(session) !== siteId)
    );
  }, [setSessionState, setSiteState]);

  const createSession = useCallback(
    (
      site: InspectionSite,
      initial?: {
        meta?: Partial<InspectionReportMeta>;
      }
    ) => {
      const nextSession = createNewSafetySession(
        site,
        Math.max(
          0,
          ...sessionsRef.current
            .filter((session) => getSessionSiteKey(session) === site.id)
            .map((session) => session.reportNumber || 0)
        ) + 1,
        masterDataRef.current,
        initial
      );

      const nextSessions = [nextSession, ...sessionsRef.current];
      setSessionState(nextSessions);
      markSessionDirty(nextSession.id);
      return nextSession;
    },
    [markSessionDirty, setSessionState]
  );

  const updateSession = useCallback(
    (
      sessionId: string,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const updatedAt = new Date().toISOString();

      setSessions((current) => {
        const nextSessions = normalizeSessions(
          current.map((session) =>
            session.id === sessionId
              ? {
                  ...normalizeInspectionSession(updater(session)),
                  updatedAt,
                }
              : session
          )
        );

        sessionsRef.current = nextSessions;
        return nextSessions;
      });

      markSessionDirty(sessionId);
    },
    [markSessionDirty]
  );

  const updateSessions = useCallback(
    (
      predicate: (session: InspectionSession) => boolean,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const updatedAt = new Date().toISOString();
      const touchedIds: string[] = [];

      setSessions((current) => {
        const nextSessions = normalizeSessions(
          current.map((session) => {
            if (!predicate(session)) return session;

            touchedIds.push(session.id);
            return {
              ...normalizeInspectionSession(updater(session)),
              updatedAt,
            };
          })
        );

        sessionsRef.current = nextSessions;
        return nextSessions;
      });

      touchedIds.forEach((sessionId) => {
        markSessionDirty(sessionId);
      });
    },
    [markSessionDirty]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const targetSession = sessionsRef.current.find((session) => session.id === sessionId);
      if (!targetSession) return;

      if (!currentUser || !authTokenRef.current || !isSafetyAdmin(currentUser)) {
        setSyncError('보고서 삭제는 관리자 또는 관제 권한에서만 가능합니다.');
        return;
      }

      setSyncError(null);

      const nextSessions = sessionsRef.current.filter((session) => session.id !== sessionId);
      setSessionState(nextSessions);
      dirtySessionIdsRef.current.delete(sessionId);
      delete sessionVersionsRef.current[sessionId];

      try {
        await archiveSafetyReportByKey(authTokenRef.current, targetSession.id);
      } catch (error) {
        setSyncError(getErrorMessage(error));
        const restored = normalizeSessions([...sessionsRef.current, targetSession]);
        setSessionState(restored);
        sessionVersionsRef.current[sessionId] = sessionVersionsRef.current[sessionId] ?? 0;
      }
    },
    [currentUser, setSessionState]
  );

  const deleteSessions = useCallback(
    (predicate: (session: InspectionSession) => boolean) => {
      const remaining = sessionsRef.current.filter((session) => !predicate(session));
      const removed = sessionsRef.current.filter((session) => predicate(session));

      removed.forEach((session) => {
        dirtySessionIdsRef.current.delete(session.id);
        delete sessionVersionsRef.current[session.id];
      });

      setSessionState(remaining);
    },
    [setSessionState]
  );

  const saveNow = useCallback(async () => {
    await Promise.all([
      persistSessions(sessionsRef.current),
      persistSites(sitesRef.current),
    ]);
    await flushDirtySessions();
  }, [flushDirtySessions, persistSessions, persistSites]);

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

  const contextValue = useMemo<InspectionSessionsContextValue>(
    () => ({
      sites,
      sessions,
      isReady,
      isAuthenticated: Boolean(currentUser && authTokenRef.current),
      isSaving,
      currentUser,
      masterData,
      authError,
      dataError,
      syncError,
      canArchiveReports: isSafetyAdmin(currentUser),
      login,
      logout,
      reload,
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
      authError,
      createSession,
      createSite,
      currentUser,
      dataError,
      deleteSession,
      deleteSessions,
      deleteSite,
      getSessionById,
      getSiteById,
      isReady,
      isSaving,
      login,
      logout,
      masterData,
      reload,
      saveNow,
      sessions,
      sites,
      syncError,
      updateSession,
      updateSessions,
      updateSite,
    ]
  );

  return (
    <InspectionSessionsContext.Provider value={contextValue}>
      {children}
    </InspectionSessionsContext.Provider>
  );
}

export function useInspectionSessions(): InspectionSessionsContextValue {
  const context = useContext(InspectionSessionsContext);

  if (!context) {
    throw new Error('useInspectionSessions must be used within InspectionSessionsProvider.');
  }

  return context;
}
