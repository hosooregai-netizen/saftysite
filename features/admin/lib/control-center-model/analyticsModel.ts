import { getAdminSectionHref } from '@/lib/admin';
import { parseSiteContractProfile, resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { ControllerDashboardData } from '@/types/controller';
import type { SafetyReportListItem } from '@/types/backend';
import { ANALYTICS_REVENUE_COUNT_LABEL } from './analyticsRevenueRules';
import {
  buildAnalyticsComparisonWindow,
  buildTrendRows,
  calculateAveragePerVisitAmount,
  calculateChangeRate,
  formatAnalyticsStatValue,
  getContractBucketKey,
  getContractTypeDisplayLabel,
  matchesAnalyticsQuery,
  resolvePrimaryContractTypeLabel,
} from './analyticsSupport';
import { buildContractTypeRows } from './analyticsContractRows';
import { buildSummaryCardsAndStats } from './analyticsSummary';
import { isWithinDateRange } from './dates';
import { buildAssignedSiteIdsByUser } from './rowEnrichment';
import {
  buildAnalyticsRevenueEvents,
  buildAnalyticsScheduleRows,
  countRevenueEvents,
  sumRevenueEvents,
  type AnalyticsRevenueEvent,
  type AnalyticsScheduleRow,
} from './analyticsRevenueEvents';
import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsModel,
  AdminAnalyticsPeriod,
  AdminAnalyticsSiteRevenueRow,
} from './types';

function isWithinPeriod(value: string, period: AdminAnalyticsPeriod, today: Date) {
  const comparisonWindow = buildAnalyticsComparisonWindow(period, today);
  if (period === 'all') return true;
  return isWithinDateRange(value, comparisonWindow.current);
}

function buildEmployeeRows(
  data: ControllerDashboardData,
  visibleSiteIds: Set<string>,
  assignedSiteIdsByUser: Map<string, Set<string>>,
  sitesById: Map<string, ControllerDashboardData['sites'][number]>,
  detailScheduleRows: AnalyticsScheduleRow[],
  detailRevenueEvents: AnalyticsRevenueEvent[],
  previousRevenueEvents: AnalyticsRevenueEvent[],
  normalizedQuery: string,
  filters: { userId: string },
  comparisonWindow: { previous: object | null },
): AdminAnalyticsEmployeeRow[] {
  return data.users
    .map((user) => {
      const userCurrentScheduleRows = detailScheduleRows.filter((row) => row.assigneeUserId === user.id);
      const userCurrentRevenueEvents = detailRevenueEvents.filter((row) => row.assigneeUserId === user.id);
      const userPreviousRevenueEvents = previousRevenueEvents.filter((row) => row.assigneeUserId === user.id);
      const fallbackAssignedSiteIds = Array.from(assignedSiteIdsByUser.get(user.id) ?? new Set<string>()).filter(
        (siteId) => visibleSiteIds.has(siteId),
      );
      const queriedSiteIds = Array.from(
        new Set(
          [...userCurrentScheduleRows.map((row) => row.siteId), ...userCurrentRevenueEvents.map((row) => row.siteId)],
        ),
      );
      const assignedSiteIds =
        normalizedQuery && queriedSiteIds.length > 0 ? queriedSiteIds : fallbackAssignedSiteIds;
      const totalAssignedRounds = assignedSiteIds.reduce((sum, siteId) => {
        return sum + resolveSiteRevenueProfile(sitesById.get(siteId) ?? null).plannedRounds;
      }, 0);
      const plannedRevenue = assignedSiteIds.reduce((sum, siteId) => {
        return sum + resolveSiteRevenueProfile(sitesById.get(siteId) ?? null).plannedRevenue;
      }, 0);
      const visitRevenue = sumRevenueEvents(userCurrentRevenueEvents);
      const executedRounds = countRevenueEvents(userCurrentRevenueEvents);
      const previousRevenue = sumRevenueEvents(userPreviousRevenueEvents);
      const shouldInclude =
        filters.userId === user.id ||
        assignedSiteIds.length > 0 ||
        userCurrentScheduleRows.length > 0 ||
        userCurrentRevenueEvents.length > 0 ||
        userCurrentScheduleRows.some((row) => row.isOverdue);

      if (!shouldInclude) return null;

      return {
        assignedSiteCount: assignedSiteIds.length,
        avgPerVisitAmount: calculateAveragePerVisitAmount(visitRevenue, executedRounds),
        completionRate: totalAssignedRounds > 0 ? executedRounds / totalAssignedRounds : 0,
        overdueCount: userCurrentScheduleRows.filter((row) => row.isOverdue).length,
        plannedRevenue,
        plannedRounds: totalAssignedRounds,
        primaryContractTypeLabel: resolvePrimaryContractTypeLabel(
          assignedSiteIds.length > 0
            ? assignedSiteIds
            : Array.from(new Set(userCurrentScheduleRows.map((row) => row.siteId))),
          sitesById,
        ),
        revenueChangeRate: comparisonWindow.previous ? calculateChangeRate(visitRevenue, previousRevenue) : null,
        totalAssignedRounds,
        userId: user.id,
        userName: user.name,
        visitRevenue,
        executedRounds,
      };
    })
    .filter((row): row is AdminAnalyticsEmployeeRow => Boolean(row));
}

function buildSiteRevenueRows(
  visibleSites: ControllerDashboardData['sites'],
  detailScheduleRows: AnalyticsScheduleRow[],
  detailRevenueEvents: AnalyticsRevenueEvent[],
  normalizedQuery: string,
): AdminAnalyticsSiteRevenueRow[] {
  return visibleSites
    .map((site) => {
      const currentScheduleRows = detailScheduleRows.filter((row) => row.siteId === site.id);
      const currentRevenueEvents = detailRevenueEvents.filter((row) => row.siteId === site.id);
      const profile = parseSiteContractProfile(site);
      const revenueProfile = resolveSiteRevenueProfile(site);
      const visitRevenue = sumRevenueEvents(currentRevenueEvents);
      const executedRounds = countRevenueEvents(currentRevenueEvents);
      const plannedRevenue = revenueProfile.plannedRevenue;
      const plannedRounds = revenueProfile.plannedRounds;
      const contractTypeLabel = getContractTypeDisplayLabel(getContractBucketKey(profile));
      const matchesQuery = normalizedQuery
        ? matchesAnalyticsQuery(
            {
              assigneeName: currentScheduleRows[0]?.assigneeName || currentRevenueEvents[0]?.assigneeName || '',
              contractTypeLabel,
              headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
              siteName: site.site_name,
            },
            normalizedQuery,
          )
        : true;

      return {
        avgPerVisitAmount: calculateAveragePerVisitAmount(visitRevenue, executedRounds),
        contractTypeLabel,
        executedRounds,
        executionRate: plannedRounds > 0 ? executedRounds / plannedRounds : 0,
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
        href: getAdminSectionHref('headquarters', { headquarterId: site.headquarter_id, siteId: site.id }),
        matchesQuery,
        plannedRevenue,
        plannedRounds,
        siteId: site.id,
        siteName: site.site_name,
        visitRevenue,
      };
    })
    .filter((row) => {
      if (normalizedQuery) return row.matchesQuery;
      return row.executedRounds > 0 || row.visitRevenue > 0 || row.plannedRounds > 0 || row.plannedRevenue > 0;
    })
    .map(({ matchesQuery, ...row }) => {
      void matchesQuery;
      return row;
    });
}

export function buildAdminAnalyticsModel(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  filters: {
    contractType: string;
    headquarterId: string;
    period: AdminAnalyticsPeriod;
    query: string;
    userId: string;
  },
  today = new Date(),
): AdminAnalyticsModel {
  const assignedSiteIdsByUser = buildAssignedSiteIdsByUser(data);
  const sitesById = new Map(data.sites.map((site) => [site.id, site]));
  const analyticsScheduleRows = buildAnalyticsScheduleRows(data, today);
  const analyticsRevenueEvents = buildAnalyticsRevenueEvents(data, reports, today);
  const userScopedSiteIds = new Set(
    filters.userId
      ? [
          ...(assignedSiteIdsByUser.get(filters.userId) ?? new Set<string>()),
          ...analyticsScheduleRows.filter((row) => row.assigneeUserId === filters.userId).map((row) => row.siteId),
          ...analyticsRevenueEvents.filter((row) => row.assigneeUserId === filters.userId).map((row) => row.siteId),
        ]
      : data.sites.map((site) => site.id),
  );
  const visibleSiteIds = new Set(
    data.sites
      .filter((site) => {
        const profile = parseSiteContractProfile(site);
        if (filters.headquarterId && site.headquarter_id !== filters.headquarterId) return false;
        if (filters.contractType && getContractBucketKey(profile) !== filters.contractType) return false;
        if (filters.userId && !userScopedSiteIds.has(site.id)) return false;
        return true;
      })
      .map((site) => site.id),
  );
  const visibleSites = data.sites.filter((site) => visibleSiteIds.has(site.id));
  const scopedScheduleRows = analyticsScheduleRows.filter(
    (row) => visibleSiteIds.has(row.siteId) && (!filters.userId || row.assigneeUserId === filters.userId),
  );
  const scopedRevenueEvents = analyticsRevenueEvents.filter(
    (row) => visibleSiteIds.has(row.siteId) && (!filters.userId || row.assigneeUserId === filters.userId),
  );
  const detailScheduleRows = scopedScheduleRows.filter((row) =>
    isWithinPeriod(row.plannedDate, filters.period, today),
  );
  const detailRevenueEvents = scopedRevenueEvents.filter((row) =>
    isWithinPeriod(row.date, filters.period, today),
  );
  const comparisonWindow = buildAnalyticsComparisonWindow(filters.period, today);
  const previousRevenueEvents = comparisonWindow.previous
    ? scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, comparisonWindow.previous))
    : [];
  const normalizedQuery = filters.query.trim();
  const queriedDetailScheduleRows = normalizedQuery
    ? detailScheduleRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : detailScheduleRows;
  const queriedDetailRevenueEvents = normalizedQuery
    ? detailRevenueEvents.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : detailRevenueEvents;
  const queriedPreviousRevenueEvents = normalizedQuery
    ? previousRevenueEvents.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : previousRevenueEvents;

  const userLoadCount = data.users.filter(
    (user) =>
      (filters.userId ? user.id === filters.userId : true) &&
      ((assignedSiteIdsByUser.get(user.id)?.size ?? 0) > 0 ||
        scopedScheduleRows.some((item) => item.assigneeUserId === user.id) ||
        scopedRevenueEvents.some((item) => item.assigneeUserId === user.id)),
  ).length;

  return {
    contractTypeRows: buildContractTypeRows(visibleSites, queriedDetailRevenueEvents),
    employeeRows: buildEmployeeRows(
      data,
      visibleSiteIds,
      assignedSiteIdsByUser,
      sitesById,
      queriedDetailScheduleRows,
      queriedDetailRevenueEvents,
      queriedPreviousRevenueEvents,
      normalizedQuery,
      { userId: filters.userId },
      comparisonWindow,
    ),
    siteRevenueRows: buildSiteRevenueRows(
      visibleSites,
      queriedDetailScheduleRows,
      queriedDetailRevenueEvents,
      normalizedQuery,
    ),
    ...buildSummaryCardsAndStats(
      visibleSites,
      userLoadCount,
      scopedScheduleRows,
      detailScheduleRows,
      detailRevenueEvents,
      previousRevenueEvents,
      scopedRevenueEvents,
      { period: filters.period },
      today,
    ),
    trendRows: buildTrendRows(scopedRevenueEvents, today),
  };
}

export { formatAnalyticsStatValue };
export { ANALYTICS_REVENUE_COUNT_LABEL };
