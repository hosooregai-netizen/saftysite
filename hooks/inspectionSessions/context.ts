'use client';

import { createContext, useContext } from 'react';
import type {
  AdminSiteSnapshot,
  InspectionReportMeta,
  InspectionSite,
  InspectionSession,
} from '@/types/inspectionSession';
import type {
  SafetyLoginInput,
  SafetyMasterData,
  SafetyUser,
} from '@/types/backend';

export interface InspectionSessionsContextValue {
  sites: InspectionSite[];
  sessions: InspectionSession[];
  isReady: boolean;
  isHydrating: boolean;
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
