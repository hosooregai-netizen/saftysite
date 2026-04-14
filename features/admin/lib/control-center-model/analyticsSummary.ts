import { formatCurrencyValue } from '@/lib/admin';
import { resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { ControllerDashboardData } from '@/types/controller';
import { ANALYTICS_REVENUE_COUNT_LABEL } from './analyticsRevenueRules';
import type { AdminAnalyticsPeriod, AdminAnalyticsStats } from './types';
import { buildAnalyticsComparisonWindow, calculateAveragePerVisitAmount, calculateChangeRate, formatDeltaValue, getCurrentWindowLabel, getDeltaTone } from './analyticsSupport';
import { isWithinDateRange } from './dates';
import type { AnalyticsRevenueEvent, AnalyticsScheduleRow } from './analyticsRevenueEvents';
import { countRevenueEvents, sumRevenueEvents } from './analyticsRevenueEvents';

export function buildSummaryCardsAndStats(
  visibleSites: ControllerDashboardData['sites'],
  userLoadCount: number,
  detailScheduleRows: AnalyticsScheduleRow[],
  detailRevenueEvents: AnalyticsRevenueEvent[],
  previousRevenueEvents: AnalyticsRevenueEvent[],
  scopedRevenueEvents: AnalyticsRevenueEvent[],
  filters: { period: AdminAnalyticsPeriod },
  today: Date,
) {
  const comparisonWindow = buildAnalyticsComparisonWindow(filters.period, today);
  const totalExecutedRounds = countRevenueEvents(detailRevenueEvents);
  const currentPeriodRevenue = sumRevenueEvents(detailRevenueEvents);
  const previousPeriodRevenue = sumRevenueEvents(previousRevenueEvents);
  const currentPeriodAveragePerVisitAmount = calculateAveragePerVisitAmount(currentPeriodRevenue, totalExecutedRounds);
  const previousPeriodAveragePerVisitAmount = calculateAveragePerVisitAmount(
    previousPeriodRevenue,
    countRevenueEvents(previousRevenueEvents),
  );
  const currentPeriodRevenuePerEmployee = userLoadCount > 0 ? currentPeriodRevenue / userLoadCount : 0;
  const previousPeriodRevenuePerEmployee = userLoadCount > 0 ? previousPeriodRevenue / userLoadCount : 0;
  const monthWindow = buildAnalyticsComparisonWindow('month', today);
  const quarterWindow = buildAnalyticsComparisonWindow('quarter', today);
  const yearWindow = buildAnalyticsComparisonWindow('year', today);
  const monthRevenue = sumRevenueEvents(scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, monthWindow.current)));
  const previousMonthRevenue = sumRevenueEvents(
    scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, monthWindow.previous)),
  );
  const quarterRevenue = sumRevenueEvents(
    scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, quarterWindow.current)),
  );
  const previousQuarterRevenue = sumRevenueEvents(
    scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, quarterWindow.previous)),
  );
  const yearRevenue = sumRevenueEvents(scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, yearWindow.current)));
  const previousYearRevenue = sumRevenueEvents(
    scopedRevenueEvents.filter((row) => isWithinDateRange(row.date, yearWindow.previous)),
  );
  const totalPlannedRevenue = visibleSites.reduce((sum, site) => sum + resolveSiteRevenueProfile(site).plannedRevenue, 0);
  const totalPlannedRounds = visibleSites.reduce((sum, site) => sum + resolveSiteRevenueProfile(site).plannedRounds, 0);
  const overdueCount = detailScheduleRows.filter((row) => row.isOverdue).length;

  const stats: AdminAnalyticsStats = {
    averagePerVisitAmount: currentPeriodAveragePerVisitAmount,
    completionRate: totalPlannedRounds > 0 ? totalExecutedRounds / totalPlannedRounds : 0,
    countedSiteCount: visibleSites.filter((site) => resolveSiteRevenueProfile(site).isRevenueReady).length,
    delayRate: detailScheduleRows.length > 0 ? overdueCount / detailScheduleRows.length : 0,
    excludedSiteCount: visibleSites.filter((site) => !resolveSiteRevenueProfile(site).isRevenueReady).length,
    includedEmployeeCount: userLoadCount,
    overdueCount,
    plannedContractRevenue: totalPlannedRevenue,
    plannedRounds: totalPlannedRounds,
    totalExecutedRounds,
    totalVisitRevenue: currentPeriodRevenue,
  };

  const summaryCards = [
    { deltaLabel: monthWindow.changeLabel, deltaTone: getDeltaTone(calculateChangeRate(monthRevenue, previousMonthRevenue)), deltaValue: formatDeltaValue(calculateChangeRate(monthRevenue, previousMonthRevenue)), label: '이번 달 매출', meta: ANALYTICS_REVENUE_COUNT_LABEL, value: formatCurrencyValue(monthRevenue) },
    { deltaLabel: quarterWindow.changeLabel, deltaTone: getDeltaTone(calculateChangeRate(quarterRevenue, previousQuarterRevenue)), deltaValue: formatDeltaValue(calculateChangeRate(quarterRevenue, previousQuarterRevenue)), label: '이번 분기 매출', meta: ANALYTICS_REVENUE_COUNT_LABEL, value: formatCurrencyValue(quarterRevenue) },
    { deltaLabel: yearWindow.changeLabel, deltaTone: getDeltaTone(calculateChangeRate(yearRevenue, previousYearRevenue)), deltaValue: formatDeltaValue(calculateChangeRate(yearRevenue, previousYearRevenue)), label: '올해 누적 매출', meta: ANALYTICS_REVENUE_COUNT_LABEL, value: formatCurrencyValue(yearRevenue) },
    { deltaLabel: comparisonWindow.changeLabel, deltaTone: getDeltaTone(comparisonWindow.previous ? calculateChangeRate(currentPeriodAveragePerVisitAmount, previousPeriodAveragePerVisitAmount) : null), deltaValue: formatDeltaValue(comparisonWindow.previous ? calculateChangeRate(currentPeriodAveragePerVisitAmount, previousPeriodAveragePerVisitAmount) : null), label: '평균 회차 단가', meta: `${getCurrentWindowLabel(filters.period)} · ${ANALYTICS_REVENUE_COUNT_LABEL}`, value: formatCurrencyValue(currentPeriodAveragePerVisitAmount) },
    { deltaLabel: comparisonWindow.changeLabel, deltaTone: getDeltaTone(comparisonWindow.previous ? calculateChangeRate(currentPeriodRevenuePerEmployee, previousPeriodRevenuePerEmployee) : null), deltaValue: formatDeltaValue(comparisonWindow.previous ? calculateChangeRate(currentPeriodRevenuePerEmployee, previousPeriodRevenuePerEmployee) : null), label: '직원 1인당 매출', meta: `${getCurrentWindowLabel(filters.period)} · ${ANALYTICS_REVENUE_COUNT_LABEL}`, value: formatCurrencyValue(currentPeriodRevenuePerEmployee) },
    { deltaLabel: '계약 기준', deltaTone: 'neutral' as const, deltaValue: '비교 없음', label: '계약 예정 매출', meta: '현장 계약 기준', value: formatCurrencyValue(totalPlannedRevenue) },
    { deltaLabel: '계약 기준', deltaTone: 'neutral' as const, deltaValue: '비교 없음', label: '예정 회차', meta: '현장 계약 기준', value: `${totalPlannedRounds}회` },
  ];

  return { stats, summaryCards };
}
