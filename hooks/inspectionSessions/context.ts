'use client';

import { createContext, useContext } from 'react';
import type {
  AdminSiteSnapshot,
  InspectionReportListItem,
  InspectionReportMeta,
  InspectionSite,
  InspectionSession,
  SiteReportIndexState,
} from '@/types/inspectionSession';
import type {
  SafetyLoginInput,
  SafetyMasterData,
  SafetyUser,
} from '@/types/backend';

export interface InspectionSessionsContextValue {
  sites: InspectionSite[];
  sessions: InspectionSession[];
  hasAuthToken: boolean;
  isReady: boolean;
  isHydrating: boolean;
  isAuthenticated: boolean;
  isHydratingReports: boolean;
  isSaving: boolean;
  currentUser: SafetyUser | null;
  masterData: SafetyMasterData;
  authError: string | null;
  dataError: string | null;
  syncError: string | null;
  canArchiveReports: boolean;
  ensureMasterDataLoaded: () => Promise<void>;
  ensureSessionLoaded: (reportKey: string) => Promise<void>;
  ensureSiteReportIndexLoaded: (siteId: string) => Promise<void>;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void>;
  getReportIndexBySiteId: (siteId: string) => SiteReportIndexState | null;
  login: (input: SafetyLoginInput) => Promise<void>;
  logout: () => void;
  reload: () => Promise<void>;
  refreshMasterData: () => Promise<void>;
  createSite: (snapshot: Partial<AdminSiteSnapshot>) => InspectionSite;
  updateSite: (siteId: string, updater: (current: InspectionSite) => InspectionSite) => void;
  deleteSite: (siteId: string) => void;
  createSession: (
    site: InspectionSite,
    initial?: { meta?: Partial<InspectionReportMeta> }
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
  upsertReportIndexItems: (siteId: string, items: InspectionReportListItem[]) => void;
}

export const InspectionSessionsContext =
  createContext<InspectionSessionsContextValue | null>(null);

export function useInspectionSessions(): InspectionSessionsContextValue {
  const context = useContext(InspectionSessionsContext);
  if (!context) {
    throw new Error('useInspectionSessions must be used within InspectionSessionsProvider.');
  }
  return context;
}

