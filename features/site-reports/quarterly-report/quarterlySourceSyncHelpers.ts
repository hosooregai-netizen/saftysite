import { fetchQuarterlySummarySeed } from '@/lib/safetyApi';
import { buildQuarterlyTitleForPeriod, createQuarterKey, getQuarterRange } from '@/lib/erpReports/shared';
import type { SafetyQuarterlySummarySeed } from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { buildLocalQuarterlySummarySeed, shouldUseLocalQuarterlySeedFallback } from './quarterlyReportHelpers';
import { getQuarterSelectionTarget } from './quarterlyReportStateHelpers';

export interface QuarterlySourceSyncOptions {
  explicitSelection?: boolean;
  optimistic?: boolean;
  selectedReportKeys?: string[];
  successNotice?: string | null;
}

export function hasInvalidQuarterlyPeriod(report: QuarterlySummaryReport) {
  return (
    !report.periodStartDate ||
    !report.periodEndDate ||
    report.periodStartDate > report.periodEndDate
  );
}

export function buildQuarterlySelectionNotice(selectedReportKeys: string[]) {
  return selectedReportKeys.length > 0
    ? `선택한 지도 보고서 ${selectedReportKeys.length}건을 반영했습니다.`
    : '선택한 지도 보고서가 없습니다.';
}

export function buildQuarterlyDraftForQuarterChange(
  draft: QuarterlySummaryReport,
  nextQuarter: number,
) {
  const currentQuarterTarget = getQuarterSelectionTarget(draft);
  const nextRange = getQuarterRange(currentQuarterTarget.year, nextQuarter);
  const currentAutoTitle = buildQuarterlyTitleForPeriod(
    draft.periodStartDate,
    draft.periodEndDate,
  );
  const shouldSyncTitle =
    !draft.title.trim() || draft.title.trim() === currentAutoTitle;

  return {
    ...draft,
    title: shouldSyncTitle
      ? buildQuarterlyTitleForPeriod(nextRange.startDate, nextRange.endDate)
      : draft.title,
    periodStartDate: nextRange.startDate,
    periodEndDate: nextRange.endDate,
    quarterKey: createQuarterKey(currentQuarterTarget.year, nextQuarter),
    year: currentQuarterTarget.year,
    quarter: nextQuarter,
  };
}

export async function loadQuarterlySourceSeed(args: {
  currentSite: Parameters<typeof buildLocalQuarterlySummarySeed>[1];
  currentSiteId: string;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void>;
  getSessionsBySiteId: (siteId: string) => Parameters<typeof buildLocalQuarterlySummarySeed>[2];
  nextDraft: QuarterlySummaryReport;
  options?: QuarterlySourceSyncOptions;
  token: string;
}): Promise<SafetyQuarterlySummarySeed> {
  const {
    currentSite,
    currentSiteId,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    nextDraft,
    options,
    token,
  } = args;

  try {
    return await fetchQuarterlySummarySeed(token, currentSiteId, {
      periodStartDate: nextDraft.periodStartDate,
      periodEndDate: nextDraft.periodEndDate,
      selectedReportKeys: options?.selectedReportKeys,
      explicitSelection: options?.explicitSelection,
    });
  } catch (seedError) {
    if (!shouldUseLocalQuarterlySeedFallback(seedError)) {
      throw seedError;
    }

    await ensureSiteReportsLoaded(currentSiteId);
    return buildLocalQuarterlySummarySeed(
      nextDraft,
      currentSite,
      getSessionsBySiteId(currentSiteId),
      {
        selectedReportKeys: options?.selectedReportKeys,
        explicitSelection: options?.explicitSelection,
      },
    );
  }
}
