'use client';

import { useCallback, useRef, useState } from 'react';
import { clearSafetyAuthToken } from '@/lib/safetyApi';
import { writePersistedValue } from '@/lib/clientPersistence';
import type { SafetyMasterData, SafetyUser } from '@/types/backend';
import type { InspectionSite, InspectionSession } from '@/types/inspectionSession';
import {
  EMPTY_MASTER_DATA,
  normalizeSessions,
  normalizeSites,
  SITE_STORAGE_KEY,
  STORAGE_KEY,
  useCollectionState,
} from './helpers';

export function useInspectionSessionsStore() {
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

  const setSessionState = useCollectionState(setSessions, sessionsRef, normalizeSessions);
  const setSiteState = useCollectionState(setSites, sitesRef, normalizeSites);

  const resetSessionVersions = useCallback((nextSessions: InspectionSession[]) => {
    sessionVersionsRef.current = nextSessions.reduce<Record<string, number>>((accumulator, session) => {
      accumulator[session.id] = 0;
      return accumulator;
    }, {});
    dirtySessionIdsRef.current.clear();
  }, []);

  const persistSessions = useCallback(
    async (nextSessions: InspectionSession[]) => {
      await writePersistedValue(STORAGE_KEY, normalizeSessions(nextSessions));
    },
    []
  );

  const persistSites = useCallback(
    async (nextSites: InspectionSite[]) => {
      await writePersistedValue(SITE_STORAGE_KEY, normalizeSites(nextSites));
    },
    []
  );

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

  return {
    authError,
    authTokenRef,
    clearAuthState,
    currentUser,
    dataError,
    dirtySessionIdsRef,
    isFlushingRef,
    isReady,
    isSaving,
    masterData,
    masterDataRef,
    persistSessions,
    persistSites,
    resetSessionVersions,
    sessionVersionsRef,
    sessions,
    sessionsRef,
    setAuthError,
    setCurrentUser,
    setDataError,
    setIsReady,
    setIsSaving,
    setMasterData,
    setSessionState,
    setSessions,
    setSiteState,
    setSites,
    setSyncError,
    sites,
    sitesRef,
    syncError,
  };
}

export type InspectionSessionsStore = ReturnType<typeof useInspectionSessionsStore>;
