import { formatCurrencyValue } from '@/lib/admin';
import { resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { ControllerDashboardData } from '@/types/controller';
import type { AdminAnalyticsPeriod, AdminAnalyticsStats } from './types';
import { buildAnalyticsComparisonWindow, calculateAveragePerVisitAmount, calculateChangeRate, countExecutedRounds, formatDeltaValue, getCurrentWindowLabel, getDeltaTone, sumVisitRevenue } from './analyticsSupport';
import { isWithinDateRange } from './dates';
import { buildEnrichedRows } from './rowEnrichment';

export function buildSummaryCardsAndStats(
  visibleSites: ControllerDashboardData['sites'],
  userLoadCount: number,
  detailRows: ReturnType<typeof buildEnrichedRows>,
  detailGuidanceRows: ReturnType<typeof buildEnrichedRows>,
  previousGuidanceRows: ReturnType<typeof buildEnrichedRows>,
  scopedGuidanceRows: ReturnType<typeof buildEnrichedRows>,
  filters: { period: AdminAnalyticsPeriod },
  today: Date,
) {
  const comparisonWindow = buildAnalyticsComparisonWindow(filters.period, today);
  const totalExecutedRounds = countExecutedRounds(detailGuidanceRows);
  const currentPeriodRevenue = sumVisitRevenue(detailGuidanceRows);
  const previousPeriodRevenue = sumVisitRevenue(previousGuidanceRows);
  const currentPeriodAveragePerVisitAmount = calculateAveragePerVisitAmount(currentPeriodRevenue, totalExecutedRounds);
  const previousPeriodAveragePerVisitAmount = calculateAveragePerVisitAmount(previousPeriodRevenue, countExecutedRounds(previousGuidanceRows));
  const currentPeriodRevenuePerEmployee = userLoadCount > 0 ? currentPeriodRevenue / userLoadCount : 0;
  const previousPeriodRevenuePerEmployee = userLoadCount > 0 ? previousPeriodRevenue / userLoadCount : 0;
  const monthWindow = buildAnalyticsComparisonWindow('month', today);
  const quarterWindow = buildAnalyticsComparisonWindow('quarter', today);
  const yearWindow = buildAnalyticsComparisonWindow('year', today);
  const monthRevenue = sumVisitRevenue(scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, monthWindow.current)));
  const previousMonthRevenue = sumVisitRevenue(scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, monthWindow.previous)));
  const quarterRevenue = sumVisitRevenue(scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, quarterWindow.current)));
  const previousQuarterRevenue = sumVisitRevenue(scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, quarterWindow.previous)));
  const yearRevenue = sumVisitRevenue(scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, yearWindow.current)));
  const previousYearRevenue = sumVisitRevenue(scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, yearWindow.previous)));
  const totalPlannedRevenue = visibleSites.reduce((sum, site) => sum + resolveSiteRevenueProfile(site).plannedRevenue, 0);
  const totalPlannedRounds = visibleSites.reduce((sum, site) => sum + resolveSiteRevenueProfile(site).plannedRounds, 0);

  const stats: AdminAnalyticsStats = {
    averagePerVisitAmount: currentPeriodAveragePerVisitAmount,
    completionRate: totalPlannedRounds > 0 ? totalExecutedRounds / totalPlannedRounds : 0,
    countedSiteCount: visibleSites.filter((site) => resolveSiteRevenueProfile(site).isRevenueReady).length,
    delayRate: detailRows.length > 0 ? detailRows.filter((row) => row.isOverdue).length / detailRows.length : 0,
    excludedSiteCount: visibleSites.filter((site) => !resolveSiteRevenueProfile(site).isRevenueReady).length,
    includedEmployeeCount: userLoadCount,
    overdueCount: detailRows.filter((row) => row.isOverdue).length,
    plannedContractRevenue: totalPlannedRevenue,
    plannedRounds: totalPlannedRounds,
    totalExecutedRounds,
    totalVisitRevenue: currentPeriodRevenue,
  };

  const summaryCards = [
    { deltaLabel: monthWindow.changeLabel, deltaTone: getDeltaTone(calculateChangeRate(monthRevenue, previousMonthRevenue)), deltaValue: formatDeltaValue(calculateChangeRate(monthRevenue, previousMonthRevenue)), label: '이번 달 매출', meta: '완료 회차 기준', value: formatCurrencyValue(monthRevenue) },
    { deltaLabel: quarterWindow.changeLabel, deltaTone: getDeltaTone(calculateChangeRate(quarterRevenue, previousQuarterRevenue)), deltaValue: formatDeltaValue(calculateChangeRate(quarterRevenue, previousQuarterRevenue)), label: '이번 분기 매출', meta: '완료 회차 기준', value: formatCurrencyValue(quarterRevenue) },
    { deltaLabel: yearWindow.changeLabel, deltaTone: getDeltaTone(calculateChangeRate(yearRevenue, previousYearRevenue)), deltaValue: formatDeltaValue(calculateChangeRate(yearRevenue, previousYearRevenue)), label: '올해 누적 매출', meta: '완료 회차 기준', value: formatCurrencyValue(yearRevenue) },
    { deltaLabel: comparisonWindow.changeLabel, deltaTone: getDeltaTone(comparisonWindow.previous ? calculateChangeRate(currentPeriodAveragePerVisitAmount, previousPeriodAveragePerVisitAmount) : null), deltaValue: formatDeltaValue(comparisonWindow.previous ? calculateChangeRate(currentPeriodAveragePerVisitAmount, previousPeriodAveragePerVisitAmount) : null), label: '평균 회차 단가', meta: `${getCurrentWindowLabel(filters.period)} · 완료 회차 기준`, value: formatCurrencyValue(currentPeriodAveragePerVisitAmount) },
    { deltaLabel: comparisonWindow.changeLabel, deltaTone: getDeltaTone(comparisonWindow.previous ? calculateChangeRate(currentPeriodRevenuePerEmployee, previousPeriodRevenuePerEmployee) : null), deltaValue: formatDeltaValue(comparisonWindow.previous ? calculateChangeRate(currentPeriodRevenuePerEmployee, previousPeriodRevenuePerEmployee) : null), label: '직원 1인당 매출', meta: `${getCurrentWindowLabel(filters.period)} · 완료 회차 기준`, value: formatCurrencyValue(currentPeriodRevenuePerEmployee) },
    { deltaLabel: '계약 기준', deltaTone: 'neutral' as const, deltaValue: '비교 없음', label: '계약 예정 매출', meta: '현장 계약 기준', value: formatCurrencyValue(totalPlannedRevenue) },
    { deltaLabel: '계약 기준', deltaTone: 'neutral' as const, deltaValue: '비교 없음', label: '예정 회차', meta: '현장 계약 기준', value: `${totalPlannedRounds}회` },
  ];

  return { stats, summaryCards };
}
