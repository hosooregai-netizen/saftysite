import { resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { SiteContractProfile } from '@/types/admin';
import { parseDateValue, startOfToday } from './dates';
import type { EnrichedControllerReportRow } from './rowEnrichment';

export const ANALYTICS_REVENUE_COUNT_LABEL = '방문 일정 경과 기준';

export function hasRevenueProfile(profile: SiteContractProfile) {
  return resolveSiteRevenueProfile(profile).isRevenueReady;
}

export function isRevenueRecognizedGuidanceRow(
  row: EnrichedControllerReportRow,
  today: Date,
) {
  if (row.reportType !== 'technical_guidance' || !hasRevenueProfile(row.contractProfile)) {
    return false;
  }
  if (row.isCompleted) return true;

  const visitDate = parseDateValue(row.visitDate || row.reportDate);
  if (!visitDate) return false;
  return visitDate.getTime() <= startOfToday(today).getTime();
}

export function filterRevenueRecognizedGuidanceRows(
  rows: EnrichedControllerReportRow[],
  today: Date,
) {
  return rows.filter((row) => isRevenueRecognizedGuidanceRow(row, today));
}
