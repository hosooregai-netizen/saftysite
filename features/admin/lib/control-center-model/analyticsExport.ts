import { formatCurrencyValue } from '@/lib/admin';
import { formatAnalyticsStatValue, formatDeltaValue } from './analyticsSupport';
import type { AdminAnalyticsModel } from './types';

export function getAnalyticsExportSheets(model: AdminAnalyticsModel) {
  return [
    {
      name: '요약',
      columns: [
        { key: 'label', label: '항목' },
        { key: 'value', label: '값' },
        { key: 'meta', label: '기준' },
        { key: 'deltaLabel', label: '비교 기준' },
        { key: 'deltaValue', label: '증감' },
      ],
      rows: model.summaryCards.map((card) => ({
        deltaLabel: card.deltaLabel,
        deltaValue: card.deltaValue,
        label: card.label,
        meta: card.meta,
        value: card.value,
      })),
    },
    {
      name: '월별 추이',
      columns: [
        { key: 'monthKey', label: '월' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
        { key: 'executedRounds', label: '실행 회차' },
      ],
      rows: model.trendRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        executedRounds: `${row.executedRounds}회`,
        monthKey: row.monthKey,
        visitRevenue: formatCurrencyValue(row.revenue),
      })),
    },
    {
      name: '직원별 매출',
      columns: [
        { key: 'userName', label: '직원명' },
        { key: 'assignedSiteCount', label: '운영 현장 수' },
        { key: 'plannedRounds', label: '예정 회차' },
        { key: 'executedRounds', label: '실행 회차' },
        { key: 'plannedRevenue', label: '예정 매출' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
        { key: 'overdueCount', label: '지연 건수' },
        { key: 'completionRate', label: '완료율' },
        { key: 'revenueChangeRate', label: '전기 대비' },
        { key: 'primaryContractTypeLabel', label: '대표 계약유형' },
      ],
      rows: model.employeeRows.map((row) => ({
        assignedSiteCount: row.assignedSiteCount,
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        completionRate: formatAnalyticsStatValue('percent', row.completionRate),
        executedRounds: row.executedRounds,
        overdueCount: row.overdueCount,
        plannedRevenue: formatCurrencyValue(row.plannedRevenue),
        plannedRounds: `${row.plannedRounds}회`,
        primaryContractTypeLabel: row.primaryContractTypeLabel,
        revenueChangeRate: formatDeltaValue(row.revenueChangeRate),
        userName: row.userName,
        visitRevenue: formatCurrencyValue(row.visitRevenue),
      })),
    },
    {
      name: '현장별 매출',
      columns: [
        { key: 'siteName', label: '현장명' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'contractTypeLabel', label: '계약유형' },
        { key: 'plannedRounds', label: '예정 회차' },
        { key: 'executedRounds', label: '실행 회차' },
        { key: 'plannedRevenue', label: '계약금액' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'executionRate', label: '실행률' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
      ],
      rows: model.siteRevenueRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        contractTypeLabel: row.contractTypeLabel,
        executedRounds: row.executedRounds,
        executionRate: formatAnalyticsStatValue('percent', row.executionRate),
        headquarterName: row.headquarterName,
        plannedRevenue: formatCurrencyValue(row.plannedRevenue),
        plannedRounds: `${row.plannedRounds}회`,
        siteName: row.siteName,
        visitRevenue: formatCurrencyValue(row.visitRevenue),
      })),
    },
    {
      name: '계약유형',
      columns: [
        { key: 'label', label: '계약유형' },
        { key: 'siteCount', label: '현장 수' },
        { key: 'plannedRounds', label: '예정 회차' },
        { key: 'executedRounds', label: '회차 수' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'totalContractAmount', label: '총 계약금액' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
        { key: 'shareRate', label: '매출 비중' },
      ],
      rows: model.contractTypeRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        executedRounds: `${row.executedRounds}회`,
        label: row.label,
        plannedRounds: `${row.plannedRounds}회`,
        shareRate: formatAnalyticsStatValue('percent', row.shareRate),
        siteCount: row.siteCount,
        totalContractAmount: formatCurrencyValue(row.totalContractAmount),
        visitRevenue: formatCurrencyValue(row.visitRevenue),
      })),
    },
  ];
}
