import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';
import {
  buildQuarterlyTitleForPeriod,
  createQuarterKey,
  getQuarterFromDate,
  getQuarterRange,
  normalizeQuarterlyReportPeriod,
  parseDateValue,
} from '@/lib/erpReports/shared';
import { SafetyApiError } from '@/lib/safetyApi';
import {
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
} from '@/lib/safetyApiMappers/utils';
import type { QuarterlySummaryReport } from '@/types/erpReports';

export function createEmptyImplementationRow(): QuarterlySummaryReport['implementationRows'][number] {
  return {
    sessionId: `manual-${Date.now()}`,
    reportTitle: '',
    reportDate: '',
    reportNumber: 0,
    drafter: '',
    progressRate: '',
    findingCount: 0,
    improvedCount: 0,
    note: '',
  };
}

export function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getMobileQuarterLabel(
  report: Pick<QuarterlySummaryReport, 'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'>,
) {
  const normalized = normalizeQuarterlyReportPeriod(report);
  if (normalized.year > 0 && normalized.quarter >= 1 && normalized.quarter <= 4) {
    return `${String(normalized.year).slice(-2)}년 ${normalized.quarter}분기`;
  }
  return '기간 미설정';
}

export function getQuarterSelectionTarget(
  report: Pick<QuarterlySummaryReport, 'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'>,
) {
  if (report.year > 0 && report.quarter >= 1 && report.quarter <= 4) {
    return { year: report.year, quarter: report.quarter };
  }

  const startDate = parseDateValue(report.periodStartDate);
  if (startDate) {
    return {
      year: startDate.getFullYear(),
      quarter: getQuarterFromDate(startDate),
    };
  }

  const endDate = parseDateValue(report.periodEndDate);
  if (endDate) {
    return {
      year: endDate.getFullYear(),
      quarter: getQuarterFromDate(endDate),
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    quarter: getQuarterFromDate(today),
  };
}

export function shouldUseLocalSeed(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}

export function applyOpsAsset(
  report: QuarterlySummaryReport,
  asset: { id: string; title: string; body: unknown } | null,
): QuarterlySummaryReport {
  if (!asset) {
    return {
      ...report,
      opsAssetDescription: '',
      opsAssetFileName: '',
      opsAssetFileUrl: '',
      opsAssetId: '',
      opsAssetPreviewUrl: '',
      opsAssetTitle: '',
      opsAssetType: '',
      opsAssignedAt: '',
      opsAssignedBy: '',
    };
  }

  return {
    ...report,
    opsAssetDescription: contentBodyToText(asset.body),
    opsAssetFileName: asset.title,
    opsAssetFileUrl: contentBodyToAssetUrl(asset.body),
    opsAssetId: asset.id,
    opsAssetPreviewUrl: contentBodyToImageUrl(asset.body),
    opsAssetTitle: asset.title,
    opsAssetType: 'campaign_template' as const,
    opsAssignedAt: new Date().toISOString(),
  };
}

export function finalizeDraft(report: QuarterlySummaryReport) {
  const normalized = normalizeQuarterlyReportPeriod(report);
  return {
    ...report,
    ...normalized,
    title:
      report.title.trim() ||
      (normalized.periodStartDate && normalized.periodEndDate
        ? buildQuarterlyTitleForPeriod(normalized.periodStartDate, normalized.periodEndDate)
        : '분기 종합보고서'),
    updatedAt: new Date().toISOString(),
  };
}

export function buildQuarterDraftForQuarterSelection(
  draft: QuarterlySummaryReport,
  nextQuarter: number,
) {
  const currentQuarterTarget = getQuarterSelectionTarget(draft);
  const nextQuarterKey = createQuarterKey(currentQuarterTarget.year, nextQuarter);
  const nextRange = getQuarterRange(currentQuarterTarget.year, nextQuarter);
  const currentAutoTitle = buildQuarterlyTitleForPeriod(draft.periodStartDate, draft.periodEndDate);
  const shouldSyncTitle = !draft.title.trim() || draft.title.trim() === currentAutoTitle;

  return {
    ...draft,
    title: shouldSyncTitle
      ? buildQuarterlyTitleForPeriod(nextRange.startDate, nextRange.endDate)
      : draft.title,
    periodStartDate: nextRange.startDate,
    periodEndDate: nextRange.endDate,
    quarter: nextQuarter,
    quarterKey: nextQuarterKey,
    year: currentQuarterTarget.year,
  };
}

export function createEmptyFuturePlan() {
  return createFutureProcessRiskPlan();
}
