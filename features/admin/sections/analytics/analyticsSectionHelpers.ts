'use client';

import { SITE_CONTRACT_TYPE_LABELS } from '@/lib/admin';
import {
  ANALYTICS_REVENUE_COUNT_LABEL,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsSiteRevenueRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { parseSiteContractProfile } from '@/lib/admin/siteContractProfile';
import type { ControllerDashboardData } from '@/types/controller';
import type { TableSortState } from '@/types/admin';
import type { SafetyAdminAnalyticsResponse } from '@/types/admin';

export const EMPTY_ANALYTICS: SafetyAdminAnalyticsResponse = {
  availableTrendYears: [],
  chartYearSlices: [],
  contractTypeRows: [],
  employeeRows: [],
  siteRevenueRows: [],
  stats: {
    averagePerVisitAmount: 0,
    completionRate: 0,
    countedSiteCount: 0,
    delayRate: 0,
    excludedSiteCount: 0,
    includedEmployeeCount: 0,
    overdueCount: 0,
    plannedRounds: 0,
    remainingRounds: 0,
    totalExecutedRounds: 0,
    totalScopedRounds: 0,
    totalVisitRevenue: 0,
  },
  summaryCards: [],
  trendRows: [],
};

export const PERIOD_LABELS = {
  all: '전체 기간',
  month: '월 기준',
  quarter: '분기 기준',
  year: '연 기준',
} as const;

export function getDeltaClassName(
  tone: 'negative' | 'neutral' | 'positive',
  styles: Record<string, string>,
) {
  switch (tone) {
    case 'positive':
      return styles.deltaPositive;
    case 'negative':
      return styles.deltaNegative;
    case 'neutral':
    default:
      return styles.deltaNeutral;
  }
}

export function formatRevenueChange(value: number | null) {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function buildContractTypeOptions(data: ControllerDashboardData) {
  const seen = new Set<string>();
  return data.sites
    .map((site) => {
      const profile = parseSiteContractProfile(site);
      return profile.technicalGuidanceKind || profile.contractType || '';
    })
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .sort((left, right) => {
      const leftLabel = SITE_CONTRACT_TYPE_LABELS[left as keyof typeof SITE_CONTRACT_TYPE_LABELS] || left;
      const rightLabel = SITE_CONTRACT_TYPE_LABELS[right as keyof typeof SITE_CONTRACT_TYPE_LABELS] || right;
      return leftLabel.localeCompare(rightLabel, 'ko');
    })
    .map((value) => ({
      label: SITE_CONTRACT_TYPE_LABELS[value as keyof typeof SITE_CONTRACT_TYPE_LABELS] || value,
      value,
    }));
}

export function buildScopeChips(
  data: ControllerDashboardData,
  input: {
    contractType: string;
    headquarterId: string;
    period: keyof typeof PERIOD_LABELS;
    query: string;
    userId: string;
  },
) {
  const chips = [
    { label: '집계 기준', value: ANALYTICS_REVENUE_COUNT_LABEL },
    { label: '기간', value: PERIOD_LABELS[input.period] },
  ];
  const headquarter = data.headquarters.find((item) => item.id === input.headquarterId);
  const user = data.users.find((item) => item.id === input.userId);
  if (headquarter) chips.push({ label: '사업장', value: headquarter.name });
  if (user) chips.push({ label: '직원', value: user.name });
  if (input.contractType) {
    chips.push({
      label: '구분',
      value: SITE_CONTRACT_TYPE_LABELS[input.contractType as keyof typeof SITE_CONTRACT_TYPE_LABELS] || input.contractType,
    });
  }
  if (input.query.trim()) chips.push({ label: '검색', value: input.query.trim() });
  return chips;
}

export function buildScopeChipsFromLookups(
  input: {
    contractType: string;
    contractTypeOptions: Array<{ label: string; value: string }>;
    headquarterId: string;
    headquarterOptions: Array<{ label: string; value: string }>;
    period: keyof typeof PERIOD_LABELS;
    query: string;
    userId: string;
    userOptions: Array<{ label: string; value: string }>;
  },
) {
  const chips = [
    { label: '집계 기준', value: ANALYTICS_REVENUE_COUNT_LABEL },
    { label: '기간', value: PERIOD_LABELS[input.period] },
  ];
  const headquarter = input.headquarterOptions.find((item) => item.value === input.headquarterId);
  const user = input.userOptions.find((item) => item.value === input.userId);
  const contractType = input.contractTypeOptions.find((item) => item.value === input.contractType);
  if (headquarter) chips.push({ label: '사업장', value: headquarter.label });
  if (user) chips.push({ label: '직원', value: user.label });
  if (contractType) {
    chips.push({ label: '구분', value: contractType.label });
  }
  if (input.query.trim()) chips.push({ label: '검색', value: input.query.trim() });
  return chips;
}

export function sortEmployeeRows(rows: AdminAnalyticsEmployeeRow[], employeeSort: TableSortState) {
  const direction = employeeSort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    switch (employeeSort.key) {
      case 'userName':
        return left.userName.localeCompare(right.userName, 'ko') * direction;
      case 'primaryContractTypeLabel':
        return left.primaryContractTypeLabel.localeCompare(right.primaryContractTypeLabel, 'ko') * direction;
      case 'assignedSiteCount':
        return (left.assignedSiteCount - right.assignedSiteCount) * direction;
      case 'executedRounds':
        return (left.executedRounds - right.executedRounds) * direction;
      case 'avgPerVisitAmount':
        return (left.avgPerVisitAmount - right.avgPerVisitAmount) * direction;
      case 'overdueCount':
        return (left.overdueCount - right.overdueCount) * direction;
      case 'plannedRounds':
        return (left.plannedRounds - right.plannedRounds) * direction;
      case 'plannedRevenue':
        return (left.plannedRevenue - right.plannedRevenue) * direction;
      case 'completionRate':
        return (left.completionRate - right.completionRate) * direction;
      case 'revenueChangeRate':
        return ((left.revenueChangeRate ?? Number.NEGATIVE_INFINITY) - (right.revenueChangeRate ?? Number.NEGATIVE_INFINITY)) * direction;
      case 'visitRevenue':
      default:
        return (left.visitRevenue - right.visitRevenue) * direction;
    }
  });
}

export function sortSiteRevenueRows(
  rows: AdminAnalyticsSiteRevenueRow[],
  siteRevenueSort: TableSortState,
) {
  const direction = siteRevenueSort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    switch (siteRevenueSort.key) {
      case 'siteName':
        return left.siteName.localeCompare(right.siteName, 'ko') * direction;
      case 'headquarterName':
        return left.headquarterName.localeCompare(right.headquarterName, 'ko') * direction;
      case 'contractTypeLabel':
        return left.contractTypeLabel.localeCompare(right.contractTypeLabel, 'ko') * direction;
      case 'executedRounds':
        return (left.executedRounds - right.executedRounds) * direction;
      case 'plannedRounds':
        return (left.plannedRounds - right.plannedRounds) * direction;
      case 'plannedRevenue':
        return (left.plannedRevenue - right.plannedRevenue) * direction;
      case 'executionRate':
        return (left.executionRate - right.executionRate) * direction;
      case 'avgPerVisitAmount':
        return (left.avgPerVisitAmount - right.avgPerVisitAmount) * direction;
      case 'visitRevenue':
      default:
        return (left.visitRevenue - right.visitRevenue) * direction;
    }
  });
}
