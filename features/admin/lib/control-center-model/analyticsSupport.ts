import {
  formatCurrencyValue,
  SITE_CONTRACT_TYPE_LABELS,
} from '@/lib/admin';
import { parseSiteContractProfile, resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { SiteContractProfile } from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';
import {
  endOfMonth,
  formatMonthKey,
  formatMonthLabel,
  isWithinDateRange,
  parseDateValue,
  startOfMonth,
  startOfQuarter,
  startOfToday,
  startOfYear,
} from './dates';
import type {
  AdminAnalyticsPeriod,
  AdminAnalyticsTrendRow,
} from './types';
import type { EnrichedControllerReportRow } from './rowEnrichment';

interface AnalyticsDateRange {
  end: Date;
  label: string;
  start: Date;
}

export interface AnalyticsComparisonWindow {
  changeLabel: string;
  current: AnalyticsDateRange | null;
  periodLabel: string;
  previous: AnalyticsDateRange | null;
}

export function hasRevenueProfile(profile: SiteContractProfile) {
  return resolveSiteRevenueProfile(profile).isRevenueReady;
}

function buildCompletedRoundKeys(rows: EnrichedControllerReportRow[]) {
  return new Set(
    rows
      .filter((row) => row.reportType === 'technical_guidance' && row.isCompleted)
      .map((row) => `${row.siteId}:${row.visitRound || row.reportKey}`),
  );
}

export function isWithinPeriod(value: string, period: AdminAnalyticsPeriod, today: Date) {
  if (period === 'all') return true;
  const parsed = parseDateValue(value);
  if (!parsed) return false;

  const todayStart = startOfToday(today);
  const periodStart =
    period === 'month'
      ? startOfMonth(todayStart)
      : period === 'quarter'
        ? startOfQuarter(todayStart)
        : startOfYear(todayStart);

  return parsed.getTime() >= periodStart.getTime() && parsed.getTime() <= todayStart.getTime();
}

export function sumVisitRevenue(rows: EnrichedControllerReportRow[]) {
  return rows.reduce(
    (sum, row) => sum + (resolveSiteRevenueProfile(row.contractProfile).resolvedPerVisitAmount ?? 0),
    0,
  );
}

export function countExecutedRounds(rows: EnrichedControllerReportRow[]) {
  return buildCompletedRoundKeys(rows).size;
}

export function calculateAveragePerVisitAmount(revenue: number, executedRounds: number) {
  return executedRounds > 0 ? revenue / executedRounds : 0;
}

export function calculateChangeRate(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export function formatDeltaValue(value: number | null) {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function getDeltaTone(value: number | null) {
  if (value == null || Number.isNaN(value) || Math.abs(value) < 0.0005) {
    return 'neutral' as const;
  }
  return value > 0 ? ('positive' as const) : ('negative' as const);
}

function buildComparisonRange(
  label: string,
  changeLabel: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousLimit: Date,
) {
  const DAY_IN_MS = 1000 * 60 * 60 * 24;
  const normalizedCurrentStart = startOfToday(currentStart);
  const normalizedCurrentEnd = startOfToday(currentEnd);
  const normalizedPreviousStart = startOfToday(previousStart);
  const normalizedPreviousLimit = startOfToday(previousLimit);
  const elapsedDays = Math.max(
    0,
    Math.floor((normalizedCurrentEnd.getTime() - normalizedCurrentStart.getTime()) / DAY_IN_MS),
  );
  const previousEnd = new Date(normalizedPreviousStart);
  previousEnd.setDate(previousEnd.getDate() + elapsedDays);
  if (previousEnd.getTime() > normalizedPreviousLimit.getTime()) {
    previousEnd.setTime(normalizedPreviousLimit.getTime());
  }

  return {
    changeLabel,
    current: { end: normalizedCurrentEnd, label, start: normalizedCurrentStart },
    periodLabel: label,
    previous: { end: previousEnd, label, start: normalizedPreviousStart },
  } satisfies AnalyticsComparisonWindow;
}

export function buildAnalyticsComparisonWindow(
  period: AdminAnalyticsPeriod,
  today: Date,
): AnalyticsComparisonWindow {
  const todayStart = startOfToday(today);
  if (period === 'month') {
    const currentStart = startOfMonth(todayStart);
    const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1);
    return buildComparisonRange(
      '이번 달',
      '전월 대비',
      currentStart,
      todayStart,
      previousStart,
      endOfMonth(previousStart),
    );
  }
  if (period === 'quarter') {
    const currentStart = startOfQuarter(todayStart);
    const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1);
    return buildComparisonRange(
      '이번 분기',
      '전분기 대비',
      currentStart,
      todayStart,
      previousStart,
      new Date(currentStart.getFullYear(), currentStart.getMonth(), 0),
    );
  }
  if (period === 'year') {
    const currentStart = startOfYear(todayStart);
    const previousStart = new Date(currentStart.getFullYear() - 1, 0, 1);
    return buildComparisonRange(
      '올해 누적',
      '전년 동기 대비',
      currentStart,
      todayStart,
      previousStart,
      new Date(currentStart.getFullYear(), 0, 0),
    );
  }

  return {
    changeLabel: '비교 구간 없음',
    current: null,
    periodLabel: '전체 기간',
    previous: null,
  };
}

export function getCurrentWindowLabel(period: AdminAnalyticsPeriod) {
  switch (period) {
    case 'quarter':
      return '이번 분기';
    case 'year':
      return '올해 누적';
    case 'all':
      return '전체 기간';
    case 'month':
    default:
      return '이번 달';
  }
}

export function getContractBucketKey(profile: SiteContractProfile) {
  return profile.technicalGuidanceKind || profile.contractType || '';
}

export function getContractTypeDisplayLabel(value: string | null | undefined) {
  const normalized = value?.trim() || '';
  if (!normalized) return '미입력';
  return SITE_CONTRACT_TYPE_LABELS[normalized as keyof typeof SITE_CONTRACT_TYPE_LABELS] || normalized;
}

export function resolvePrimaryContractTypeLabel(
  siteIds: string[],
  sitesById: Map<string, ControllerDashboardData['sites'][number]>,
) {
  const counts = new Map<string, number>();
  siteIds.forEach((siteId) => {
    const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
    const key = getContractBucketKey(profile);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const topEntry = Array.from(counts.entries()).sort((left, right) => {
    if (right[1] !== left[1]) return right[1] - left[1];
    return getContractTypeDisplayLabel(left[0]).localeCompare(getContractTypeDisplayLabel(right[0]), 'ko');
  })[0];

  return getContractTypeDisplayLabel(topEntry?.[0]);
}

export function matchesAnalyticsQuery(
  row: {
    assigneeName?: string;
    contractTypeLabel?: string;
    headquarterName?: string;
    periodLabel?: string;
    reportTitle?: string;
    siteName?: string;
    userName?: string;
  },
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    row.assigneeName,
    row.contractTypeLabel,
    row.headquarterName,
    row.periodLabel,
    row.reportTitle,
    row.siteName,
    row.userName,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

export function buildTrendRows(rows: EnrichedControllerReportRow[], today: Date): AdminAnalyticsTrendRow[] {
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (11 - index), 1);
    const monthEnd = endOfMonth(monthStart);
    const monthRows = rows.filter((row) =>
      isWithinDateRange(row.reportDate, {
        end: monthEnd,
        start: monthStart,
      }),
    );
    const executedRounds = countExecutedRounds(monthRows);
    const revenue = sumVisitRevenue(monthRows);

    return {
      avgPerVisitAmount: calculateAveragePerVisitAmount(revenue, executedRounds),
      executedRounds,
      label: formatMonthLabel(monthStart),
      monthKey: formatMonthKey(monthStart),
      revenue,
    };
  });
}

export function formatAnalyticsStatValue(label: 'currency' | 'percent' | 'count', value: number) {
  if (label === 'currency') return formatCurrencyValue(value);
  if (label === 'percent') return `${(value * 100).toFixed(1)}%`;
  return `${value.toLocaleString('ko-KR')}건`;
}
