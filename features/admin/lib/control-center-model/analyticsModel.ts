import { getAdminSectionHref } from '@/lib/admin';
import { parseSiteContractProfile } from '@/lib/admin/siteContractProfile';
import type { ControllerDashboardData } from '@/types/controller';
import type { SafetyReportListItem } from '@/types/backend';
import {
  buildAnalyticsComparisonWindow,
  buildTrendRows,
  calculateAveragePerVisitAmount,
  calculateChangeRate,
  countExecutedRounds,
  formatAnalyticsStatValue,
  getContractBucketKey,
  getContractTypeDisplayLabel,
  hasRevenueProfile,
  isWithinPeriod,
  matchesAnalyticsQuery,
  resolvePrimaryContractTypeLabel,
  sumVisitRevenue,
} from './analyticsSupport';
import { buildContractTypeRows } from './analyticsContractRows';
import { buildSummaryCardsAndStats } from './analyticsSummary';
import { isWithinDateRange } from './dates';
import { buildAssignedSiteIdsByUser, buildEnrichedRows } from './rowEnrichment';
import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsModel,
  AdminAnalyticsPeriod,
  AdminAnalyticsSiteRevenueRow,
} from './types';

function buildEmployeeRows(
  data: ControllerDashboardData,
  visibleSiteIds: Set<string>,
  assignedSiteIdsByUser: Map<string, Set<string>>,
  sitesById: Map<string, ControllerDashboardData['sites'][number]>,
  detailRows: ReturnType<typeof buildEnrichedRows>,
  detailGuidanceRows: ReturnType<typeof buildEnrichedRows>,
  previousGuidanceRows: ReturnType<typeof buildEnrichedRows>,
  normalizedQuery: string,
  filters: { userId: string },
  comparisonWindow: { previous: object | null },
): AdminAnalyticsEmployeeRow[] {
  return data.users
    .map((user) => {
      const userCurrentRows = detailRows.filter((row) => row.assigneeUserId === user.id);
      const userCurrentGuidanceRows = detailGuidanceRows.filter((row) => row.assigneeUserId === user.id);
      const userPreviousGuidanceRows = previousGuidanceRows.filter((row) => row.assigneeUserId === user.id);
      const fallbackAssignedSiteIds = Array.from(assignedSiteIdsByUser.get(user.id) ?? new Set<string>()).filter(
        (siteId) => visibleSiteIds.has(siteId),
      );
      const queriedSiteIds = Array.from(new Set(userCurrentRows.map((row) => row.siteId)));
      const assignedSiteIds =
        normalizedQuery && queriedSiteIds.length > 0 ? queriedSiteIds : fallbackAssignedSiteIds;
      const totalAssignedRounds = assignedSiteIds.reduce((sum, siteId) => {
        const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
        return sum + (profile.totalRounds ?? 0);
      }, 0);
      const plannedRevenue = assignedSiteIds.reduce((sum, siteId) => {
        const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
        return sum + (profile.totalContractAmount ?? 0);
      }, 0);
      const visitRevenue = sumVisitRevenue(userCurrentGuidanceRows);
      const executedRounds = countExecutedRounds(userCurrentGuidanceRows);
      const previousRevenue = sumVisitRevenue(userPreviousGuidanceRows);
      const shouldInclude =
        filters.userId === user.id ||
        assignedSiteIds.length > 0 ||
        userCurrentRows.length > 0 ||
        userCurrentGuidanceRows.length > 0 ||
        userCurrentRows.some((row) => row.isOverdue);

      if (!shouldInclude) return null;

      return {
        assignedSiteCount: assignedSiteIds.length,
        avgPerVisitAmount: calculateAveragePerVisitAmount(visitRevenue, executedRounds),
        completionRate: totalAssignedRounds > 0 ? executedRounds / totalAssignedRounds : 0,
        overdueCount: userCurrentRows.filter((row) => row.isOverdue).length,
        plannedRevenue,
        plannedRounds: totalAssignedRounds,
        primaryContractTypeLabel: resolvePrimaryContractTypeLabel(
          assignedSiteIds.length > 0 ? assignedSiteIds : Array.from(new Set(userCurrentRows.map((row) => row.siteId))),
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
  detailRows: ReturnType<typeof buildEnrichedRows>,
  detailGuidanceRows: ReturnType<typeof buildEnrichedRows>,
  normalizedQuery: string,
): AdminAnalyticsSiteRevenueRow[] {
  return visibleSites
    .map((site) => {
      const currentGuidanceRows = detailGuidanceRows.filter((row) => row.siteId === site.id);
      const profile = parseSiteContractProfile(site);
      const visitRevenue = sumVisitRevenue(currentGuidanceRows);
      const executedRounds = countExecutedRounds(currentGuidanceRows);
      const plannedRevenue = profile.totalContractAmount ?? 0;
      const plannedRounds = profile.totalRounds ?? 0;
      const contractTypeLabel = getContractTypeDisplayLabel(getContractBucketKey(profile));
      const matchesQuery = normalizedQuery
        ? matchesAnalyticsQuery(
            {
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
      if (normalizedQuery) return row.matchesQuery || detailRows.some((item) => item.siteId === row.siteId);
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
  const analyticsRows = buildEnrichedRows(data, reports, today);
  const assignedSiteIdsByUser = buildAssignedSiteIdsByUser(data);
  const sitesById = new Map(data.sites.map((site) => [site.id, site]));
  const userScopedSiteIds = new Set(
    filters.userId
      ? [
          ...(assignedSiteIdsByUser.get(filters.userId) ?? new Set<string>()),
          ...analyticsRows.filter((row) => row.assigneeUserId === filters.userId).map((row) => row.siteId),
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
  const scopedRows = analyticsRows.filter(
    (row) => visibleSiteIds.has(row.siteId) && (!filters.userId || row.assigneeUserId === filters.userId),
  );
  const scopedGuidanceRows = scopedRows.filter(
    (row) => row.reportType === 'technical_guidance' && row.isCompleted && hasRevenueProfile(row.contractProfile),
  );
  const detailRows = scopedRows.filter((row) => isWithinPeriod(row.reportDate, filters.period, today));
  const detailGuidanceRows = detailRows.filter(
    (row) => row.reportType === 'technical_guidance' && row.isCompleted && hasRevenueProfile(row.contractProfile),
  );
  const comparisonWindow = buildAnalyticsComparisonWindow(filters.period, today);
  const previousRows = comparisonWindow.previous
    ? scopedRows.filter((row) => isWithinDateRange(row.reportDate, comparisonWindow.previous))
    : [];
  const previousGuidanceRows = previousRows.filter(
    (row) => row.reportType === 'technical_guidance' && row.isCompleted && hasRevenueProfile(row.contractProfile),
  );
  const normalizedQuery = filters.query.trim();
  const queriedDetailRows = normalizedQuery
    ? detailRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            periodLabel: row.periodLabel,
            reportTitle: row.reportTitle,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : detailRows;
  const queriedDetailGuidanceRows = normalizedQuery
    ? detailGuidanceRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            periodLabel: row.periodLabel,
            reportTitle: row.reportTitle,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : detailGuidanceRows;
  const queriedPreviousGuidanceRows = normalizedQuery
    ? previousGuidanceRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            periodLabel: row.periodLabel,
            reportTitle: row.reportTitle,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : previousGuidanceRows;

  const userLoadCount = data.users.filter(
    (user) =>
      (filters.userId ? user.id === filters.userId : true) &&
      ((assignedSiteIdsByUser.get(user.id)?.size ?? 0) > 0 ||
        scopedRows.some((item) => item.assigneeUserId === user.id)),
  ).length;

  return {
    contractTypeRows: buildContractTypeRows(visibleSites, detailGuidanceRows),
    employeeRows: buildEmployeeRows(
      data,
      visibleSiteIds,
      assignedSiteIdsByUser,
      sitesById,
      queriedDetailRows,
      queriedDetailGuidanceRows,
      queriedPreviousGuidanceRows,
      normalizedQuery,
      { userId: filters.userId },
      comparisonWindow,
    ),
    siteRevenueRows: buildSiteRevenueRows(visibleSites, queriedDetailRows, queriedDetailGuidanceRows, normalizedQuery),
    ...buildSummaryCardsAndStats(
      visibleSites,
      userLoadCount,
      detailRows,
      detailGuidanceRows,
      previousGuidanceRows,
      scopedGuidanceRows,
      { period: filters.period },
    ),
    trendRows: buildTrendRows(scopedGuidanceRows, today),
  };
}

export { formatAnalyticsStatValue };
