import { useMemo } from 'react';
import { buildSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { formatPeriodRangeLabel } from '@/lib/erpReports/shared';
import type { OperationalQuarterlyIndexItem } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession/session';
import {
  compareQuarterlyCreationOrder,
  getQuarterLabel,
  getSortTime,
} from './quarterlyListHelpers';
import type { QuarterlyListRow, QuarterlyListSortMode } from './types';

interface UseQuarterlyListRowsOptions {
  currentSite: InspectionSite | null;
  deferredQuery: string;
  quarterlyReports: OperationalQuarterlyIndexItem[];
  sortMode: QuarterlyListSortMode;
}

export function useQuarterlyListRows({
  currentSite,
  deferredQuery,
  quarterlyReports,
  sortMode,
}: UseQuarterlyListRowsOptions) {
  const rows = useMemo<QuarterlyListRow[]>(() => {
    if (!currentSite) return [];

    return [...quarterlyReports]
      .sort((left, right) =>
        compareQuarterlyCreationOrder(
          {
            createdAt: left.createdAt,
            updatedAt: left.updatedAt || left.lastCalculatedAt || left.createdAt,
            reportId: left.id,
          },
          {
            createdAt: right.createdAt,
            updatedAt: right.updatedAt || right.lastCalculatedAt || right.createdAt,
            reportId: right.id,
          },
        ),
      )
      .map((report, index) => ({
        sequenceNumber: index + 1,
        href: buildSiteQuarterlyHref(currentSite.id, report.id),
        reportId: report.id,
        reportTitle: report.title || '분기 종합보고서',
        quarterLabel: getQuarterLabel(report.year, report.quarter),
        selectedCount: report.selectedReportCount,
        updatedAt: report.updatedAt || report.lastCalculatedAt || report.createdAt,
        periodStartDate: report.periodStartDate,
        periodEndDate: report.periodEndDate,
        periodLabel: formatPeriodRangeLabel(report.periodStartDate, report.periodEndDate),
      }));
  }, [currentSite, quarterlyReports]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const matchingRows = !normalizedQuery
      ? rows
      : rows.filter((row) =>
          [row.reportTitle, row.quarterLabel, row.periodLabel].join(' ').toLowerCase().includes(normalizedQuery),
        );

    return [...matchingRows].sort((left, right) => {
      if (sortMode === 'number') return left.sequenceNumber - right.sequenceNumber;
      if (sortMode === 'name') return left.reportTitle.localeCompare(right.reportTitle, 'ko');
      if (sortMode === 'period') {
        const rightKey = `${right.periodEndDate}|${right.periodStartDate}`;
        const leftKey = `${left.periodEndDate}|${left.periodStartDate}`;
        return rightKey.localeCompare(leftKey, 'ko') || getSortTime(right.updatedAt) - getSortTime(left.updatedAt);
      }
      return getSortTime(right.updatedAt) - getSortTime(left.updatedAt);
    });
  }, [deferredQuery, rows, sortMode]);

  const existingReportTitles = useMemo(() => rows.map((row) => row.reportTitle), [rows]);

  return {
    existingReportTitles,
    filteredRows,
    rows,
  };
}
