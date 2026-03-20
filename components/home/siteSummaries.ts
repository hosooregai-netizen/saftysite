import { getSessionSiteKey, getSessionSortTime } from '@/constants/inspectionSession';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export interface SiteSummary {
  site: InspectionSite;
  sessionCount: number;
  latestSession: InspectionSession | null;
  sortTime: number;
}

export function buildSiteSummaries(
  sites: InspectionSite[],
  sessions: InspectionSession[]
): SiteSummary[] {
  return sites
    .map((site) => {
      const siteSessions = sessions.filter(
        (session) => getSessionSiteKey(session) === site.id
      );

      return {
        site,
        sessionCount: siteSessions.length,
        latestSession: siteSessions[0] ?? null,
        sortTime: siteSessions[0]
          ? getSessionSortTime(siteSessions[0])
          : new Date(site.updatedAt).getTime(),
      };
    })
    .sort((left, right) => right.sortTime - left.sortTime);
}
