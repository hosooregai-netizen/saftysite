'use client';

import { useCallback, useRef, useState } from 'react';
import { deletePersistedValue, writePersistedValue } from '@/lib/clientPersistence';
import { clearOperationalReportIndexCaches } from '@/lib/operationalReportIndexCache';
import { writeOwnedPersistedValue } from '@/lib/ownedPersistence';
import { clearSafetyAuthToken } from '@/lib/safetyApi';
import type { SafetyMasterData, SafetyUser } from '@/types/backend';
import type {
  InspectionSite,
  InspectionSession,
  ReportIndexStatus,
  SiteReportIndexState,
} from '@/types/inspectionSession';
import {
  EMPTY_MASTER_DATA,
  normalizeReportIndexBySiteId,
  REPORT_INDEX_STORAGE_KEY,
  normalizeSessions,
  normalizeSites,
  SITE_STORAGE_KEY,
  STORAGE_KEY,
  USER_STORAGE_KEY,
  useCollectionState,
} from './helpers';

export function useInspectionSessionsStore() {
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [sites, setSites] = useState<InspectionSite[]>([]);
  const [masterData, setMasterData] = useState<SafetyMasterData>(EMPTY_MASTER_DATA);
  const [currentUser, setCurrentUserState] = useState<SafetyUser | null>(null);
  const [reportIndexBySiteId, setReportIndexBySiteIdState] = useState<
    Record<string, SiteReportIndexState>
  >({});
  const [siteRelationsStatusBySiteId, setSiteRelationsStatusBySiteIdState] = useState<
    Record<string, ReportIndexStatus>
  >({});
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydratingReports, setIsHydratingReports] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sessionsRef = useRef<InspectionSession[]>([]);
  const sitesRef = useRef<InspectionSite[]>([]);
  const masterDataRef = useRef<SafetyMasterData>(EMPTY_MASTER_DATA);
  const reportIndexBySiteIdRef = useRef<Record<string, SiteReportIndexState>>({});
  const siteRelationsStatusBySiteIdRef = useRef<Record<string, ReportIndexStatus>>({});
  const currentUserRef = useRef<SafetyUser | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const dirtySessionIdsRef = useRef<Set<string>>(new Set());
  const sessionVersionsRef = useRef<Record<string, number>>({});
  const isFlushingRef = useRef(false);

  const setSessionState = useCollectionState(setSessions, sessionsRef, normalizeSessions);
  const setSiteState = useCollectionState(setSites, sitesRef, normalizeSites);
  const setReportIndexBySiteId = useCallback(
    (
      updater:
        | Record<string, SiteReportIndexState>
        | ((
            current: Record<string, SiteReportIndexState>
          ) => Record<string, SiteReportIndexState>),
    ) => {
      setReportIndexBySiteIdState((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater;
        reportIndexBySiteIdRef.current = next;
        return next;
      });
    },
    [],
  );
  const setSiteRelationsStatusBySiteId = useCallback(
    (
      updater:
        | Record<string, ReportIndexStatus>
        | ((
            current: Record<string, ReportIndexStatus>
          ) => Record<string, ReportIndexStatus>),
    ) => {
      setSiteRelationsStatusBySiteIdState((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater;
        siteRelationsStatusBySiteIdRef.current = next;
        return next;
      });
    },
    [],
  );

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

  const persistCurrentUser = useCallback(async (nextUser: SafetyUser | null) => {
    if (!nextUser) {
      await deletePersistedValue(USER_STORAGE_KEY);
      return;
    }

    await writePersistedValue(USER_STORAGE_KEY, nextUser);
  }, []);

  const persistReportIndexBySiteId = useCallback(
    async (nextReportIndexBySiteId: Record<string, SiteReportIndexState>) => {
      const normalized = normalizeReportIndexBySiteId(nextReportIndexBySiteId);
      const ownerId = currentUserRef.current?.id?.trim() || '';

      if (!ownerId || Object.keys(normalized).length === 0) {
        await deletePersistedValue(REPORT_INDEX_STORAGE_KEY);
        return;
      }

      await writeOwnedPersistedValue(REPORT_INDEX_STORAGE_KEY, ownerId, normalized);
    },
    [],
  );
  const setCurrentUser = useCallback((nextUser: SafetyUser | null) => {
    currentUserRef.current = nextUser;
    setCurrentUserState(nextUser);
  }, []);

  const clearAuthState = useCallback(() => {
    clearSafetyAuthToken();
    authTokenRef.current = null;
    dirtySessionIdsRef.current.clear();
    sessionVersionsRef.current = {};
    sessionsRef.current = [];
    sitesRef.current = [];
    masterDataRef.current = EMPTY_MASTER_DATA;
    reportIndexBySiteIdRef.current = {};
    siteRelationsStatusBySiteIdRef.current = {};
    setSessions([]);
    setSites([]);
    setMasterData(EMPTY_MASTER_DATA);
    setReportIndexBySiteIdState({});
    setSiteRelationsStatusBySiteIdState({});
    setCurrentUser(null);
    setHasAuthToken(false);
    setIsHydrating(false);
    setIsHydratingReports(false);
    setIsSaving(false);
    void deletePersistedValue(USER_STORAGE_KEY);
    void deletePersistedValue(REPORT_INDEX_STORAGE_KEY);
    void clearOperationalReportIndexCaches();
  }, [setCurrentUser]);

  return {
    authError,
    authTokenRef,
    clearAuthState,
    currentUser,
    currentUserRef,
    dataError,
    dirtySessionIdsRef,
    hasAuthToken,
    isFlushingRef,
    isHydrating,
    isHydratingReports,
    isReady,
    isSaving,
    masterData,
    masterDataRef,
    persistCurrentUser,
    persistReportIndexBySiteId,
    persistSessions,
    persistSites,
    reportIndexBySiteId,
    reportIndexBySiteIdRef,
    resetSessionVersions,
    sessionVersionsRef,
    sessions,
    sessionsRef,
    setAuthError,
    setCurrentUser,
    setDataError,
    setHasAuthToken,
    setIsHydrating,
    setIsHydratingReports,
    setIsReady,
    setIsSaving,
    setMasterData,
    setReportIndexBySiteId,
    setSiteRelationsStatusBySiteId,
    setSessionState,
    setSessions,
    setSiteState,
    setSites,
    setSyncError,
    sites,
    sitesRef,
    siteRelationsStatusBySiteId,
    siteRelationsStatusBySiteIdRef,
    syncError,
  };
}

export type InspectionSessionsStore = ReturnType<typeof useInspectionSessionsStore>;
