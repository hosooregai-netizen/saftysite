import type {
  InspectionReportListItem,
  InspectionSite,
  ReportIndexStatus,
  SiteReportIndexState,
} from '@/types/inspectionSession';

export interface HomeSiteSummary {
  latestReportLastSavedAt: string | null;
  latestReportProgressRate: number | null;
  latestReportVisitDate: string | null;
  reportCount: number;
  reportSyncStatus: ReportIndexStatus;
  site: InspectionSite;
  sortTime: number;
}

function getReportSortTime(item: InspectionReportListItem) {
  return Math.max(
    item.lastAutosavedAt ? new Date(item.lastAutosavedAt).getTime() : 0,
    item.updatedAt ? new Date(item.updatedAt).getTime() : 0,
    item.createdAt ? new Date(item.createdAt).getTime() : 0,
    item.visitDate ? new Date(item.visitDate).getTime() : 0,
  );
}

function getLatestReport(items: InspectionReportListItem[]) {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort((left, right) => getReportSortTime(right) - getReportSortTime(left))[0];
}

export function buildHomeSiteSummaries(
  sites: InspectionSite[],
  reportIndexBySiteId: Record<string, SiteReportIndexState | null | undefined>,
): HomeSiteSummary[] {
  return sites
    .map((site) => {
      const reportIndexState = reportIndexBySiteId[site.id] ?? null;
      const reportItems = reportIndexState?.status === 'loaded' ? reportIndexState.items : [];
      const latestReport = getLatestReport(reportItems);

      return {
        latestReportLastSavedAt: latestReport?.lastAutosavedAt ?? null,
        latestReportProgressRate: latestReport?.progressRate ?? null,
        latestReportVisitDate: latestReport?.visitDate ?? null,
        reportCount: reportItems.length,
        reportSyncStatus: reportIndexState?.status ?? 'idle',
        site,
        sortTime: latestReport ? getReportSortTime(latestReport) : new Date(site.updatedAt).getTime(),
      };
    })
    .sort((left, right) => right.sortTime - left.sortTime);
}
