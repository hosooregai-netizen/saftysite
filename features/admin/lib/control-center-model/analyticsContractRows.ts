import { parseSiteContractProfile, resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { ControllerDashboardData } from '@/types/controller';
import { getContractBucketKey, getContractTypeDisplayLabel } from './analyticsSupport';
import { countRevenueEvents, sumRevenueEvents, type AnalyticsRevenueEvent } from './analyticsRevenueEvents';

export function buildContractTypeRows(
  visibleSites: ControllerDashboardData['sites'],
  detailRevenueEvents: AnalyticsRevenueEvent[],
) {
  const buckets = visibleSites.reduce((map, site) => {
    const key = getContractBucketKey(parseSiteContractProfile(site));
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(site);
    return map;
  }, new Map<string, ControllerDashboardData['sites'][number][]>());
  const totalRevenue = sumRevenueEvents(detailRevenueEvents);

  return Array.from(buckets.entries())
    .map(([key, sites]) => {
      const siteIds = new Set(sites.map((site) => site.id));
      const revenueEvents = detailRevenueEvents.filter((row) => siteIds.has(row.siteId));
      const visitRevenue = sumRevenueEvents(revenueEvents);
      const executedRounds = countRevenueEvents(revenueEvents);
      const perVisitAmounts = sites
        .map((site) => resolveSiteRevenueProfile(site).resolvedPerVisitAmount)
        .filter((value): value is number => typeof value === 'number' && value > 0);
      return {
        avgPerVisitAmount:
          perVisitAmounts.length > 0
            ? perVisitAmounts.reduce((sum, value) => sum + value, 0) / perVisitAmounts.length
            : 0,
        executedRounds,
        label: getContractTypeDisplayLabel(key),
        plannedRounds: sites.reduce((sum, site) => sum + resolveSiteRevenueProfile(site).plannedRounds, 0),
        siteCount: sites.length,
        shareRate: totalRevenue > 0 ? visitRevenue / totalRevenue : 0,
        totalContractAmount: sites.reduce((sum, site) => sum + resolveSiteRevenueProfile(site).plannedRevenue, 0),
        visitRevenue,
      };
    })
    .filter((row) => row.siteCount > 0)
    .sort(
      (left, right) =>
        right.visitRevenue - left.visitRevenue ||
        right.executedRounds - left.executedRounds ||
        left.label.localeCompare(right.label, 'ko'),
    );
}
