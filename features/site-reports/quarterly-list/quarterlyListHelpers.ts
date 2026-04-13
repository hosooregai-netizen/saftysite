import {
  buildQuarterlyTitleForPeriod,
  getQuarterFromDate,
  parseDateValue,
} from '@/lib/erpReports/shared';
import { SafetyApiError } from '@/lib/safetyApi';
import type { CreateQuarterlyReportForm } from './types';

export function shouldIgnoreRowClick(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [role="button"], [role="menu"], [role="menuitem"]',
      ),
    )
  );
}

export function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function getSortTime(value: string) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getQuarterLabel(year: number, quarter: number) {
  return year > 0 && quarter >= 1 && quarter <= 4 ? `${quarter}분기` : '-';
}

export function compareQuarterlyCreationOrder(
  left: { createdAt: string; updatedAt: string; reportId: string },
  right: { createdAt: string; updatedAt: string; reportId: string },
) {
  const createdDiff = getSortTime(left.createdAt) - getSortTime(right.createdAt);
  if (createdDiff !== 0) return createdDiff;

  const updatedDiff = getSortTime(left.updatedAt) - getSortTime(right.updatedAt);
  if (updatedDiff !== 0) return updatedDiff;

  return left.reportId.localeCompare(right.reportId, 'ko');
}

function buildUniqueQuarterlyReportTitle(baseTitle: string, existingTitles: string[]) {
  const trimmedBase = baseTitle.trim();
  if (!trimmedBase) return '';

  const normalizedBase = trimmedBase.toLowerCase();
  const normalizedTitles = new Set(
    existingTitles.map((title) => title.trim().toLowerCase()).filter(Boolean),
  );

  if (!normalizedTitles.has(normalizedBase)) {
    return trimmedBase;
  }

  let suffix = 2;
  while (normalizedTitles.has(`${trimmedBase} (${suffix})`.toLowerCase())) {
    suffix += 1;
  }

  return `${trimmedBase} (${suffix})`;
}

export function getCreateTitleSuggestion(
  startDate: string,
  endDate: string,
  existingTitles: string[],
) {
  if (!startDate || !endDate || startDate > endDate) {
    return '';
  }

  return buildUniqueQuarterlyReportTitle(
    buildQuarterlyTitleForPeriod(startDate, endDate),
    existingTitles,
  );
}

export function getCreateQuarterSelectionTarget(
  form: Pick<CreateQuarterlyReportForm, 'periodStartDate' | 'periodEndDate'>,
) {
  const startDate = parseDateValue(form.periodStartDate);
  if (startDate) {
    return {
      year: startDate.getFullYear(),
      quarter: getQuarterFromDate(startDate),
    };
  }

  const endDate = parseDateValue(form.periodEndDate);
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

export function shouldUseLocalQuarterlySeedFallback(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}
