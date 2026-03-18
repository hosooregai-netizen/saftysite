'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInspectionSession,
  createInspectionSite,
  ensureSessionReportNumbers,
  getSessionSiteKey,
  getSessionSortTime,
  normalizeInspectionSession,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
import {
  deletePersistedValue,
  writePersistedValue,
} from '@/lib/clientPersistence';
import type {
  AdminSiteSnapshot,
  InspectionReportMeta,
  InspectionSite,
  InspectionSession,
} from '@/types/inspectionSession';

const STORAGE_KEY = 'inspection-sessions-v7';
const SITE_STORAGE_KEY = 'inspection-sites-v7';
const RESET_TARGET_KEYS = [
  'inspection-sessions-v1',
  'inspection-sites-v1',
  'inspection-sessions-v2',
  'inspection-sites-v2',
  'inspection-sessions-v3',
  'inspection-sites-v3',
  'inspection-sessions-v4',
  'inspection-sites-v4',
  'inspection-sessions-v5',
  'inspection-sites-v5',
  'inspection-sessions-v6',
  'inspection-sites-v6',
  'inspection-sessions-v7',
  'inspection-sites-v7',
];

function createMockData(): {
  sessions: InspectionSession[];
  sites: InspectionSite[];
} {
  const site = createInspectionSite({
    customerName: '대명건설 주식회사',
    siteName: '평택 고덕 A-12BL 지식산업센터 신축공사',
    assigneeName: '박준호',
    siteManagementNumber: 'PS-2026-018',
    businessStartNumber: '240318-01',
    constructionPeriod: '2026.02.10 ~ 2027.01.30',
    constructionAmount: '15,800,000,000원',
    siteManagerName: '김도현 현장소장',
    siteContactEmail: '010-2486-1033 / pjh@daemyung-enc.co.kr',
    siteAddress: '경기도 평택시 고덕동 1887-2',
    companyName: '대명건설 주식회사',
    corporationRegistrationNumber: '110111-2345678',
    businessRegistrationNumber: '214-81-45678',
    licenseNumber: '건축공사업 경기-26-0412',
    headquartersContact: '02-6123-7788',
    headquartersAddress: '서울특별시 송파구 법원로 11길 25',
  });
  const mockSiteId = 'mock-site-pyeongtaek-godeok-a12bl';
  const session = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        siteName: site.siteName,
        reportDate: '2026-03-18',
        drafter: site.assigneeName,
        reviewer: '이선영',
        approver: '최민석',
      },
    },
    mockSiteId,
    1
  );

  const seededSession: InspectionSession = {
    ...session,
    id: 'mock-session-pyeongtaek-godeok-a12bl-20260318',
    siteKey: mockSiteId,
    currentSection: 'doc2',
    createdAt: '2026-03-18T08:40:00.000Z',
    updatedAt: '2026-03-18T09:10:00.000Z',
    lastSavedAt: '2026-03-18T09:10:00.000Z',
  };
  const seededSite: InspectionSite = {
    ...site,
    id: mockSiteId,
    updatedAt: '2026-03-18T09:10:00.000Z',
  };

  return {
    sites: [seededSite],
    sessions: normalizeSessions([seededSession]),
  };
}

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

export function useInspectionSessions() {
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [sites, setSites] = useState<InspectionSite[]>([]);
  const [isReady, setIsReady] = useState(false);
  const sessionsRef = useRef<InspectionSession[]>([]);
  const sitesRef = useRef<InspectionSite[]>([]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      await Promise.all(RESET_TARGET_KEYS.map((key) => deletePersistedValue(key)));
      const mockData = createMockData();
      const nextSessions = mockData.sessions;
      const nextSites = mockData.sites;

      if (cancelled) return;

      sessionsRef.current = nextSessions;
      sitesRef.current = nextSites;
      setSessions(nextSessions);
      setSites(nextSites);
      setIsReady(true);

      void writePersistedValue(STORAGE_KEY, nextSessions);
      void writePersistedValue(SITE_STORAGE_KEY, nextSites);
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

  const createSite = useCallback(
    (snapshot: Partial<AdminSiteSnapshot>) => {
      const nextSite = createInspectionSite(snapshot);
      const nextSites = [nextSite, ...sitesRef.current];
      sitesRef.current = nextSites;
      setSites(nextSites);
      void persistSites(nextSites);
      return nextSite;
    },
    [persistSites]
  );

  const updateSite = useCallback(
    (siteId: string, updater: (current: InspectionSite) => InspectionSite) => {
      const updatedAt = new Date().toISOString();
      setSites((current) => {
        const nextSites = current.map((site) => {
          if (site.id !== siteId) return site;

          const updated = normalizeInspectionSite(updater(site));
          return {
            ...updated,
            updatedAt,
          };
        });

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
    (
      site: InspectionSite,
      initial?: {
        meta?: Partial<InspectionReportMeta>;
      }
    ) => {
      const savedAt = new Date().toISOString();
      const nextSession = {
        ...createInspectionSession(
          {
            adminSiteSnapshot: site.adminSiteSnapshot,
            meta: {
              siteName: site.siteName,
              drafter: site.assigneeName,
              ...initial?.meta,
            },
          },
          site.id,
          Math.max(
            0,
            ...sessionsRef.current
              .filter((session) => getSessionSiteKey(session) === site.id)
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

            return {
              ...normalizeInspectionSession(updater(session)),
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

            return {
              ...normalizeInspectionSession(updater(session)),
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
