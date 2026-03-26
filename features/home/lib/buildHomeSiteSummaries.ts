import {
  getSessionProgress,
  getSessionSiteKey,
  getSessionSortTime,
} from '@/constants/inspectionSession';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export interface HomeSiteSummary {
  latestProgress: number;
  site: InspectionSite;
  sessionCount: number;
  latestSession: InspectionSession | null;
  sortTime: number;
}

export function buildHomeSiteSummaries(
  sites: InspectionSite[],
  sessions: InspectionSession[],
): HomeSiteSummary[] {
  const sessionsBySite = sessions.reduce<Map<string, InspectionSession[]>>(
    (accumulator, session) => {
      const siteKey = getSessionSiteKey(session);
      const existingSessions = accumulator.get(siteKey);

      if (existingSessions) {
        existingSessions.push(session);
      } else {
        accumulator.set(siteKey, [session]);
      }

      return accumulator;
    },
    new Map(),
  );

  return sites
    .map((site) => {
      const siteSessions = sessionsBySite.get(site.id) ?? [];
      const latestSession =
        siteSessions.length > 0
          ? [...siteSessions].sort(
              (left, right) => getSessionSortTime(right) - getSessionSortTime(left),
            )[0]
          : null;

      return {
        latestProgress: latestSession ? getSessionProgress(latestSession).percentage : 0,
        site,
        sessionCount: siteSessions.length,
        latestSession,
        sortTime: latestSession
          ? getSessionSortTime(latestSession)
          : new Date(site.updatedAt).getTime(),
      };
    })
    .sort((left, right) => right.sortTime - left.sortTime);
}

