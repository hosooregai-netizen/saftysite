'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { cloneAppState, createInitialState } from './mockData';
import type {
  AppState,
  BadWorkplaceReport,
  DispatchState,
  PhotoAlbumItem,
  QuarterlyReport,
  ReportType,
  ReviewState,
  SessionReport,
  Site,
  User,
} from './types';

const STORAGE_KEY = 'reverse-rebuild-state-v1';

type AppContextValue = {
  state: AppState;
  currentUser: User;
  setCurrentUserId: (userId: string) => void;
  upsertSite: (site: Site) => void;
  deleteSite: (siteId: string) => void;
  assignSiteUsers: (siteId: string, userIds: string[]) => void;
  updateSchedule: (scheduleId: string, patch: Partial<AppState['schedules'][number]>) => void;
  createSession: (session: SessionReport) => void;
  updateSession: (sessionId: string, updater: (session: SessionReport) => SessionReport) => void;
  deleteSession: (sessionId: string) => void;
  upsertQuarterlyReport: (report: QuarterlyReport) => void;
  upsertBadWorkplaceReport: (report: BadWorkplaceReport) => void;
  addPhoto: (photo: PhotoAlbumItem) => void;
  updateReportReview: (reportType: ReportType, reportId: string, patch: Partial<ReviewState>) => void;
  updateReportDispatch: (reportType: ReportType, reportId: string, patch: Partial<DispatchState>) => void;
  resetState: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const updateById = <T extends { id: string }>(rows: T[], id: string, updater: (row: T) => T) =>
  rows.map((row) => (row.id === id ? updater(row) : row));

export function ReverseAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as AppState;
      setState(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) ?? state.users[0],
    [state.currentUserId, state.users],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      currentUser,
      setCurrentUserId: (userId) => {
        setState((current) => ({ ...current, currentUserId: userId }));
      },
      upsertSite: (site) => {
        setState((current) => {
          const exists = current.sites.some((row) => row.id === site.id);
          return {
            ...current,
            sites: exists ? updateById(current.sites, site.id, () => site) : [site, ...current.sites],
          };
        });
      },
      deleteSite: (siteId) => {
        setState((current) => ({
          ...current,
          sites: current.sites.filter((site) => site.id !== siteId),
          schedules: current.schedules.filter((schedule) => schedule.siteId !== siteId),
          sessions: current.sessions.filter((session) => session.siteId !== siteId),
          quarterlyReports: current.quarterlyReports.filter((report) => report.siteId !== siteId),
          badWorkplaceReports: current.badWorkplaceReports.filter((report) => report.siteId !== siteId),
          photos: current.photos.filter((photo) => photo.siteId !== siteId),
        }));
      },
      assignSiteUsers: (siteId, userIds) => {
        setState((current) => ({
          ...current,
          sites: updateById(current.sites, siteId, (site) => ({
            ...site,
            assignedUserIds: userIds,
            guidanceOfficerId: userIds[0],
            guidanceOfficerName:
              current.users.find((user) => user.id === userIds[0])?.name ?? site.guidanceOfficerName,
            inspectorName:
              current.users.find((user) => user.id === userIds[0])?.name ?? site.inspectorName,
            adminSiteSnapshot: {
              ...site.adminSiteSnapshot,
              assigneeName:
                current.users.find((user) => user.id === userIds[0])?.name ?? site.adminSiteSnapshot.assigneeName,
            },
          })),
        }));
      },
      updateSchedule: (scheduleId, patch) => {
        setState((current) => ({
          ...current,
          schedules: updateById(current.schedules, scheduleId, (schedule) => ({
            ...schedule,
            ...patch,
          })),
        }));
      },
      createSession: (session) => {
        setState((current) => ({
          ...current,
          sessions: [session, ...current.sessions],
        }));
      },
      updateSession: (sessionId, updater) => {
        setState((current) => ({
          ...current,
          sessions: updateById(current.sessions, sessionId, updater),
        }));
      },
      deleteSession: (sessionId) => {
        setState((current) => ({
          ...current,
          sessions: current.sessions.filter((session) => session.id !== sessionId),
        }));
      },
      upsertQuarterlyReport: (report) => {
        setState((current) => {
          const exists = current.quarterlyReports.some((row) => row.id === report.id);
          return {
            ...current,
            quarterlyReports: exists
              ? updateById(current.quarterlyReports, report.id, () => report)
              : [report, ...current.quarterlyReports],
          };
        });
      },
      upsertBadWorkplaceReport: (report) => {
        setState((current) => {
          const exists = current.badWorkplaceReports.some((row) => row.id === report.id);
          return {
            ...current,
            badWorkplaceReports: exists
              ? updateById(current.badWorkplaceReports, report.id, () => report)
              : [report, ...current.badWorkplaceReports],
          };
        });
      },
      addPhoto: (photo) => {
        setState((current) => ({
          ...current,
          photos: [photo, ...current.photos],
        }));
      },
      updateReportReview: (reportType, reportId, patch) => {
        setState((current) => {
          if (reportType === 'technical_guidance') {
            return {
              ...current,
              sessions: updateById(current.sessions, reportId, (report) => ({
                ...report,
                review: { ...report.review, ...patch },
              })),
            };
          }

          if (reportType === 'quarterly_report') {
            return {
              ...current,
              quarterlyReports: updateById(current.quarterlyReports, reportId, (report) => ({
                ...report,
                review: { ...report.review, ...patch },
              })),
            };
          }

          return {
            ...current,
            badWorkplaceReports: updateById(current.badWorkplaceReports, reportId, (report) => ({
              ...report,
              review: { ...report.review, ...patch },
            })),
          };
        });
      },
      updateReportDispatch: (reportType, reportId, patch) => {
        setState((current) => {
          if (reportType === 'technical_guidance') {
            return {
              ...current,
              sessions: updateById(current.sessions, reportId, (report) => ({
                ...report,
                dispatch: { ...report.dispatch, ...patch },
                dispatchCompleted: patch.sent ?? report.dispatchCompleted,
                dispatchCompletedAt:
                  patch.sent && !report.dispatchCompletedAt ? new Date().toISOString() : report.dispatchCompletedAt,
              })),
            };
          }

          if (reportType === 'quarterly_report') {
            return {
              ...current,
              quarterlyReports: updateById(current.quarterlyReports, reportId, (report) => ({
                ...report,
                dispatch: { ...report.dispatch, ...patch },
              })),
            };
          }

          return {
            ...current,
            badWorkplaceReports: updateById(current.badWorkplaceReports, reportId, (report) => ({
              ...report,
              dispatch: { ...report.dispatch, ...patch },
              dispatchCompleted: patch.sent ?? report.dispatchCompleted,
            })),
          };
        });
      },
      resetState: () => {
        const fresh = createInitialState();
        setState(fresh);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      },
    }),
    [currentUser, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useReverseApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useReverseApp must be used within ReverseAppProvider');
  }

  return context;
}

export function exportStateSnapshot(state: AppState) {
  return cloneAppState(state);
}

