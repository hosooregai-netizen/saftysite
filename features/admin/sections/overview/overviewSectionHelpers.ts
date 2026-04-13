'use client';

import type { SafetyAdminOverviewResponse, TableSortState } from '@/types/admin';
import type { AdminOverviewChartEntry } from '@/features/admin/lib/buildAdminControlCenterModel';

export const OVERVIEW_TABLE_PAGE_SIZE = 10;

export function clampPage(page: number, totalPages: number) {
  return Math.max(1, Math.min(page, totalPages));
}

export function compareText(left: string, right: string, direction: TableSortState['direction']) {
  return left.localeCompare(right, 'ko') * (direction === 'asc' ? 1 : -1);
}

export function compareNumber(left: number, right: number, direction: TableSortState['direction']) {
  return (left - right) * (direction === 'asc' ? 1 : -1);
}

export function hasVisibleChartEntries(entries: AdminOverviewChartEntry[]) {
  return entries.some((entry) => entry.count > 0);
}

export function hasSiteStatusSummary(summary: SafetyAdminOverviewResponse['siteStatusSummary']) {
  return summary.totalSiteCount > 0 || hasVisibleChartEntries(summary.entries);
}

export function hasQuarterlyMaterialSummary(
  summary: SafetyAdminOverviewResponse['quarterlyMaterialSummary'],
) {
  return (
    summary.totalSiteCount > 0 ||
    hasVisibleChartEntries(summary.entries) ||
    summary.missingSiteRows.length > 0 ||
    Boolean(summary.quarterLabel)
  );
}

export function hasDeadlineSignalSummary(
  summary: SafetyAdminOverviewResponse['deadlineSignalSummary'],
) {
  return summary.totalReportCount > 0 || hasVisibleChartEntries(summary.entries);
}

export function formatSyncTimestamp(value: Date | null) {
  if (!value) return '서버 동기화 전';
  return value.toLocaleString('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
  });
}

export function formatOverviewCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '-';
  }
  return `${new Intl.NumberFormat('ko-KR').format(Math.round(value))}원`;
}

export function getDispatchStatusTone(
  status: SafetyAdminOverviewResponse['unsentReportRows'][number]['dispatchStatus'],
  styles: Record<string, string>,
) {
  switch (status) {
    case 'overdue':
      return styles.overviewTableStatusDanger;
    case 'warning':
      return styles.overviewTableStatusWarning;
    case 'sent':
      return styles.overviewTableStatusSuccess;
    default:
      return styles.overviewTableStatusNeutral;
  }
}
