import { compareReportIndexItemsByRound } from '@/hooks/inspectionSessions/helpers';
import type { InspectionReportListItem, InspectionSite } from '@/types/inspectionSession';
import type { SiteReportSortMode } from './types';

export function getDrafterFromReportItem(item: InspectionReportListItem) {
  return typeof item.meta.drafter === 'string' ? item.meta.drafter : '';
}

export function getReportDrafterDisplay(
  item: InspectionReportListItem,
  assignedUserDisplay: string | undefined,
  currentSite: InspectionSite,
) {
  return (
    getDrafterFromReportItem(item) || assignedUserDisplay || currentSite.assigneeName || '미입력'
  );
}

export function getReportSearchText(item: InspectionReportListItem, fallbackDrafter: string) {
  return [
    item.reportTitle,
    item.visitRound?.toString() || '',
    item.visitDate || '',
    getDrafterFromReportItem(item) || fallbackDrafter,
    item.lastAutosavedAt || '',
    item.updatedAt || '',
  ]
    .join(' ')
    .toLowerCase();
}

export function buildDefaultReportTitle(reportDate: string, reportNumber: number) {
  return reportDate ? `${reportDate} 보고서 ${reportNumber}` : `보고서 ${reportNumber}`;
}

export function getFilteredReportItems(params: {
  assignedUserDisplay: string;
  currentSiteAssigneeName: string | undefined;
  reportItems: InspectionReportListItem[];
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
}) {
  const {
    assignedUserDisplay,
    currentSiteAssigneeName,
    reportItems,
    reportQuery,
    reportSortMode,
  } = params;
  const normalizedQuery = reportQuery.trim().toLowerCase();
  const drafterFallback = assignedUserDisplay || currentSiteAssigneeName || '';
  const matchingItems = !normalizedQuery
    ? reportItems
    : reportItems.filter((item) => getReportSearchText(item, drafterFallback).includes(normalizedQuery));

  return [...matchingItems].sort((left, right) => {
    if (reportSortMode === 'name') {
      return left.reportTitle.localeCompare(right.reportTitle, 'ko');
    }
    if (reportSortMode === 'progress') {
      return (
        (right.progressRate ?? 0) - (left.progressRate ?? 0) ||
        right.reportTitle.localeCompare(left.reportTitle, 'ko') * -1
      );
    }
    return compareReportIndexItemsByRound(left, right);
  });
}

export function getSiteReportSummary(currentSite: InspectionSite) {
  const snapshot = currentSite.adminSiteSnapshot;
  return {
    addressDisplay: snapshot.siteAddress?.trim() || '-',
    amountDisplay: snapshot.constructionAmount?.trim() || '-',
    periodDisplay: snapshot.constructionPeriod?.trim() || '-',
    siteNameDisplay: currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-',
  };
}
