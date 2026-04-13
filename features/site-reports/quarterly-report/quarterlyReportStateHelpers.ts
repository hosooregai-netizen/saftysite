import { generateId } from '@/constants/inspectionSession/shared';
import { getQuarterFromDate, parseDateValue } from '@/lib/erpReports/shared';
import type { QuarterlySummaryReport } from '@/types/erpReports';

export function normalizeIds(value: string[]) {
  return [...value].sort().join('|');
}

export function formatDateTimeLabel(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getQuarterSelectionTarget(
  report: Pick<
    QuarterlySummaryReport,
    'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'
  >,
) {
  if (report.year > 0 && report.quarter >= 1 && report.quarter <= 4) {
    return {
      year: report.year,
      quarter: report.quarter,
    };
  }

  const startDate = parseDateValue(report.periodStartDate);
  if (startDate) {
    return {
      year: startDate.getFullYear(),
      quarter: getQuarterFromDate(startDate),
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    quarter: getQuarterFromDate(today),
  };
}

export function getQuarterlyDraftFingerprint(report: QuarterlySummaryReport) {
  return JSON.stringify({
    ...report,
    updatedAt: '',
  });
}

export function createEmptyImplementationRow() {
  return {
    sessionId: generateId('quarterly-row'),
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
