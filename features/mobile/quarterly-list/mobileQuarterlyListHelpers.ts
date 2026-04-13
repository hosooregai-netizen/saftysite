import { buildMobileSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import {
  compareQuarterlyCreationOrder,
  getCreateQuarterSelectionTarget,
  getCreateTitleSuggestion,
  getSortTime,
  shouldUseLocalQuarterlySeedFallback,
} from '@/features/site-reports/quarterly-list/quarterlyListHelpers';
import { formatPeriodRangeLabel } from '@/lib/erpReports/shared';
import type { OperationalQuarterlyIndexItem } from '@/types/erpReports';
import type { MobileQuarterlyListRow, MobileQuarterlyListSortMode } from './types';

export {
  getCreateQuarterSelectionTarget,
  getCreateTitleSuggestion,
  shouldUseLocalQuarterlySeedFallback,
};

export function getMobileQuarterLabel(year: number, quarter: number) {
  return year > 0 && quarter >= 1 && quarter <= 4
    ? `${year}년 ${quarter}분기`
    : '기간 미정';
}

export function buildMobileQuarterlyRows(
  siteId: string,
  quarterlyReports: OperationalQuarterlyIndexItem[],
) {
  return [...quarterlyReports]
    .sort((left, right) =>
      compareQuarterlyCreationOrder(
        {
          createdAt: left.createdAt,
          reportId: left.id,
          updatedAt: left.updatedAt,
        },
        {
          createdAt: right.createdAt,
          reportId: right.id,
          updatedAt: right.updatedAt,
        },
      ),
    )
    .map<MobileQuarterlyListRow>((report) => ({
      href: buildMobileSiteQuarterlyHref(siteId, report.id),
      quarterLabel: getMobileQuarterLabel(report.year, report.quarter),
      periodEndDate: report.periodEndDate,
      periodLabel: formatPeriodRangeLabel(report.periodStartDate, report.periodEndDate),
      periodStartDate: report.periodStartDate,
      reportId: report.id,
      reportTitle: report.title || '분기 종합보고서',
      updatedAt: report.updatedAt || report.lastCalculatedAt || report.createdAt,
    }));
}

export function filterMobileQuarterlyRows(
  rows: MobileQuarterlyListRow[],
  query: string,
  sortMode: MobileQuarterlyListSortMode,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchingRows = !normalizedQuery
    ? rows
    : rows.filter((row) =>
        [row.reportTitle, row.quarterLabel, row.periodLabel]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      );

  return [...matchingRows].sort((left, right) => {
    if (sortMode === 'name') {
      return left.reportTitle.localeCompare(right.reportTitle, 'ko');
    }

    if (sortMode === 'period') {
      const rightKey = `${right.periodEndDate}|${right.periodStartDate}`;
      const leftKey = `${left.periodEndDate}|${left.periodStartDate}`;
      return rightKey.localeCompare(leftKey, 'ko');
    }

    return getSortTime(right.updatedAt) - getSortTime(left.updatedAt);
  });
}
