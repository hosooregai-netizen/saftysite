import { asMapperRecord, normalizeMapperText } from '@/lib/safetyApiMappers/utils';
import type { SafetyReport } from '@/types/backend';
import type {
  QuarterTarget,
  QuarterlySummaryReport,
  StoredReportKind,
} from '@/types/erpReports';

export const TECHNICAL_GUIDANCE_REPORT_KIND = 'technical_guidance' as const;
export const QUARTERLY_SUMMARY_REPORT_KIND = 'quarterly_summary' as const;
export const BAD_WORKPLACE_REPORT_KIND = 'bad_workplace' as const;

function buildDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeStoredReportKind(value: string): StoredReportKind {
  switch (value) {
    case QUARTERLY_SUMMARY_REPORT_KIND:
      return QUARTERLY_SUMMARY_REPORT_KIND;
    case BAD_WORKPLACE_REPORT_KIND:
      return BAD_WORKPLACE_REPORT_KIND;
    default:
      return TECHNICAL_GUIDANCE_REPORT_KIND;
  }
}

export function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = normalizeMapperText(value);
  if (!normalized) return null;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function formatDateValue(date: Date): string {
  return buildDateValue(date);
}

export function getQuarterFromDate(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function createQuarterKey(year: number, quarter: number): string {
  return `${year}-Q${quarter}`;
}

export function formatQuarterLabel(target: Pick<QuarterTarget, 'year' | 'quarter'>): string {
  return `${target.year}년 ${target.quarter}분기`;
}

export function getQuarterRange(year: number, quarter: number) {
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return {
    start,
    end,
    startDate: formatDateValue(start),
    endDate: formatDateValue(end),
  };
}

export function parseQuarterKey(quarterKey: string): QuarterTarget | null {
  const matched = quarterKey.match(/^(\d{4})-Q([1-4])$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const quarter = Number(matched[2]);
  const range = getQuarterRange(year, quarter);

  return {
    quarterKey,
    year,
    quarter,
    label: formatQuarterLabel({ year, quarter }),
    startDate: range.startDate,
    endDate: range.endDate,
  };
}

export function getQuarterKeyForDate(value: string | Date): string | null {
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date) return null;
  return createQuarterKey(date.getFullYear(), getQuarterFromDate(date));
}

export function formatReportMonthLabel(reportMonth: string): string {
  const matched = reportMonth.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return reportMonth;
  return `${matched[1]}년 ${matched[2]}월`;
}

export function getCurrentReportMonth() {
  return formatDateValue(new Date()).slice(0, 7);
}

export function buildQuarterlyReportKey(siteId: string, quarterKey: string) {
  return `quarterly:${siteId}:${quarterKey}`;
}

export function buildBadWorkplaceReportKey(
  siteId: string,
  reportMonth: string,
  reporterUserId: string,
) {
  return `bad-workplace:${siteId}:${reportMonth}:${reporterUserId}`;
}

function getNextQuarter(year: number, quarter: number) {
  if (quarter === 4) return { year: year + 1, quarter: 1 };
  return { year, quarter: quarter + 1 };
}

export function getQuarterTargetsForConstructionPeriod(
  constructionPeriod: string,
): QuarterTarget[] {
  const [rawStart, rawEnd] = constructionPeriod.split('~').map((value) => value.trim());
  const start = parseDateValue(rawStart);
  const end = parseDateValue(rawEnd);

  if (!start || !end || end.getTime() < start.getTime()) {
    return [];
  }

  const minimumDurationDays = 90;
  const durationDays =
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (durationDays < minimumDurationDays) {
    return [];
  }

  let year = start.getFullYear();
  let quarter = getQuarterFromDate(start);
  const targets: QuarterTarget[] = [];

  while (true) {
    const range = getQuarterRange(year, quarter);
    if (range.start.getTime() > end.getTime()) break;

    if (range.end.getTime() >= start.getTime()) {
      const quarterKey = createQuarterKey(year, quarter);
      targets.push({
        quarterKey,
        year,
        quarter,
        label: formatQuarterLabel({ year, quarter }),
        startDate: range.startDate,
        endDate: range.endDate,
      });
    }

    const next = getNextQuarter(year, quarter);
    year = next.year;
    quarter = next.quarter;
  }

  return targets;
}

export function isDateWithinRange(
  value: string | null | undefined,
  startDate: string,
  endDate: string,
) {
  const date = parseDateValue(value);
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate);
  if (!date || !start || !end) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

export function formatPeriodRangeLabel(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) {
  const normalizedStart = normalizeMapperText(startDate);
  const normalizedEnd = normalizeMapperText(endDate);

  if (normalizedStart && normalizedEnd) return `${normalizedStart} ~ ${normalizedEnd}`;
  if (normalizedStart) return `${normalizedStart} ~ -`;
  if (normalizedEnd) return `- ~ ${normalizedEnd}`;
  return '-';
}

export function getQuarterTargetForExactPeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) {
  const normalizedStart = normalizeMapperText(startDate);
  const normalizedEnd = normalizeMapperText(endDate);
  if (!normalizedStart || !normalizedEnd) return null;

  const quarterKey = getQuarterKeyForDate(normalizedStart);
  if (!quarterKey || quarterKey !== getQuarterKeyForDate(normalizedEnd)) {
    return null;
  }

  const target = parseQuarterKey(quarterKey);
  if (!target) return null;

  return target.startDate === normalizedStart && target.endDate === normalizedEnd
    ? target
    : null;
}

/** 기간이 한 분기와 정확히 일치하지 않을 때(예: 2월~4월) 시작일이 속한 분기로 식별 */
function getQuarterTargetFromPeriodAnchor(
  periodStartDate: string,
  periodEndDate: string,
): ReturnType<typeof parseQuarterKey> {
  const anchor = normalizeMapperText(periodStartDate) || normalizeMapperText(periodEndDate);
  if (!anchor) return null;
  const key = getQuarterKeyForDate(anchor);
  return key ? parseQuarterKey(key) : null;
}

function getStoredQuarterTarget(
  report: Pick<QuarterlySummaryReport, 'quarterKey' | 'year' | 'quarter'>,
) {
  if (report.year > 0 && report.quarter >= 1 && report.quarter <= 4) {
    const range = getQuarterRange(report.year, report.quarter);
    return {
      quarterKey: createQuarterKey(report.year, report.quarter),
      year: report.year,
      quarter: report.quarter,
      startDate: range.startDate,
      endDate: range.endDate,
    };
  }

  return parseQuarterKey(normalizeMapperText(report.quarterKey));
}

export function normalizeQuarterlyReportPeriod(
  report: Pick<
    QuarterlySummaryReport,
    'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'
  >,
) {
  const periodStartDate = normalizeMapperText(report.periodStartDate);
  const periodEndDate = normalizeMapperText(report.periodEndDate);
  const storedTarget = getStoredQuarterTarget(report);

  if (periodStartDate || periodEndDate) {
    const exactTarget = getQuarterTargetForExactPeriod(periodStartDate, periodEndDate);
    if (exactTarget) {
      return {
        periodStartDate,
        periodEndDate,
        quarterKey: exactTarget.quarterKey,
        year: exactTarget.year,
        quarter: exactTarget.quarter,
      };
    }

    const anchorTarget = getQuarterTargetFromPeriodAnchor(periodStartDate, periodEndDate);
    const merged = storedTarget ?? anchorTarget;

    return {
      periodStartDate,
      periodEndDate,
      quarterKey: merged?.quarterKey || '',
      year: merged?.year || 0,
      quarter: merged?.quarter || 0,
    };
  }

  const fallbackTarget = storedTarget;
  if (fallbackTarget) {
    return {
      periodStartDate: fallbackTarget.startDate,
      periodEndDate: fallbackTarget.endDate,
      quarterKey: fallbackTarget.quarterKey,
      year: fallbackTarget.year,
      quarter: fallbackTarget.quarter,
    };
  }

  return {
    periodStartDate: '',
    periodEndDate: '',
    quarterKey: '',
    year: 0,
    quarter: 0,
  };
}

export function getQuarterlyReportPeriodLabel(
  report: Pick<
    QuarterlySummaryReport,
    'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'
  >,
) {
  const normalized = normalizeQuarterlyReportPeriod(report);
  const exactTarget = getQuarterTargetForExactPeriod(
    normalized.periodStartDate,
    normalized.periodEndDate,
  );

  if (exactTarget) {
    return formatQuarterLabel(exactTarget);
  }

  if (normalized.periodStartDate || normalized.periodEndDate) {
    return formatPeriodRangeLabel(normalized.periodStartDate, normalized.periodEndDate);
  }

  if (normalized.quarterKey) {
    return formatQuarterLabel(normalized);
  }

  return '기간 미설정';
}

export function buildQuarterlyTitleForPeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) {
  const exactTarget = getQuarterTargetForExactPeriod(startDate, endDate);
  if (exactTarget) {
    return `${formatQuarterLabel(exactTarget)} 종합보고서`;
  }

  const periodLabel = formatPeriodRangeLabel(startDate, endDate);
  return periodLabel === '-' ? '분기 종합보고서' : `${periodLabel} 종합보고서`;
}

export function buildQuarterlyDefaultTitle(referenceDate: string | Date = new Date()) {
  const quarterKey = getQuarterKeyForDate(referenceDate);
  const target = quarterKey ? parseQuarterKey(quarterKey) : null;
  return target
    ? buildQuarterlyTitleForPeriod(target.startDate, target.endDate)
    : '분기 종합보고서';
}

export function getStoredReportKind(
  report: Pick<SafetyReport, 'meta' | 'payload'>,
): StoredReportKind {
  const payload = asMapperRecord(report.payload);
  const meta = asMapperRecord(report.meta);
  const reportKind =
    normalizeMapperText(payload.reportKind) || normalizeMapperText(meta.reportKind);
  return normalizeStoredReportKind(reportKind);
}
