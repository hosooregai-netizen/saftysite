'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInspectionSession,
  getSessionSortTime,
} from '@/constants/inspectionSession';
import type {
  InspectionCover,
  InspectionSession,
  SessionSaveState,
} from '@/types/inspectionSession';

const STORAGE_KEY = 'inspection-sessions-v1';

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
    return Array.isArray(parsed) ? sortSessions(parsed as InspectionSession[]) : [];
  } catch {
    return [];
  }
}

export function useInspectionSessions() {
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [saveState, setSaveState] = useState<SessionSaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const skipNextPersistRef = useRef(true);

  useEffect(() => {
    const nextSessions = loadSessions();
    setSessions(nextSessions);
    setLastSavedAt(nextSessions[0]?.lastSavedAt ?? null);
    setIsReady(true);
  }, []);

  const persist = useCallback((nextSessions: InspectionSession[]) => {
    try {
      const normalized = sortSessions(nextSessions);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      skipNextPersistRef.current = true;
      setSessions(normalized);
      setLastSavedAt(normalized[0]?.lastSavedAt ?? null);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      persist(sessions);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [isReady, persist, sessions]);

  const createSession = useCallback(
    (initialCover: Partial<InspectionCover> = {}) => {
      const savedAt = new Date().toISOString();
      const nextSession = {
        ...createInspectionSession(initialCover),
        updatedAt: savedAt,
        lastSavedAt: savedAt,
      };

      persist([nextSession, ...sessions]);
      return nextSession;
    },
    [persist, sessions]
  );

  const updateSession = useCallback(
    (
      sessionId: string,
      updater: (current: InspectionSession) => InspectionSession
    ) => {
      const savedAt = new Date().toISOString();

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
    setSessions((current) => current.filter((session) => session.id !== sessionId));
  }, []);

  const deleteSessions = useCallback(
    (predicate: (session: InspectionSession) => boolean) => {
      setSessions((current) => current.filter((session) => !predicate(session)));
    },
    []
  );

  const saveNow = useCallback(() => {
    if (!isReady) return;
    setSaveState('saving');
    persist(sessions);
  }, [isReady, persist, sessions]);

  const getSessionById = useCallback(
    (sessionId: string) => sessions.find((session) => session.id === sessionId) || null,
    [sessions]
  );

  return useMemo(
    () => ({
      sessions,
      isReady,
      saveState,
      lastSavedAt,
      createSession,
      updateSession,
      updateSessions,
      deleteSession,
      deleteSessions,
      saveNow,
      getSessionById,
    }),
    [
      sessions,
      isReady,
      saveState,
      lastSavedAt,
      createSession,
      updateSession,
      updateSessions,
      deleteSession,
      deleteSessions,
      saveNow,
      getSessionById,
    ]
  );
}
