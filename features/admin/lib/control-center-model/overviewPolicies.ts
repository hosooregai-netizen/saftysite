import { getAdminSectionHref } from '@/lib/admin';
import {
  normalizeHeadquarterLifecycleStatus,
  normalizeReportLifecycleStatus,
  normalizeSiteLifecycleStatus,
} from '@/lib/admin/lifecycleStatus';
import type {
  SafetyAdminDeadlineSignalSummary,
  SafetyAdminPriorityQuarterlyManagementRow,
  SafetyAdminUnsentReportRow,
} from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import {
  formatQuarterKey,
  getDaysDiff,
  parseDateValue,
  startOfQuarter,
  startOfToday,
} from './dates';

export const DISPATCH_MANAGEMENT_MAX_UNSENT_DAYS = 30;
export const PRIORITY_PROJECT_AMOUNT = 2_000_000_000;

type SiteLike = Pick<
  SafetySite,
  | 'contract_date'
  | 'contract_end_date'
  | 'contract_signed_date'
  | 'contract_start_date'
  | 'headquarter_detail'
  | 'is_active'
  | 'last_visit_date'
  | 'lifecycle_status'
  | 'project_amount'
  | 'project_end_date'
  | 'project_start_date'
  | 'status'
>;

type DispatchManagementReportLike = {
  dispatchCompleted?: boolean | null;
  dispatchStatus?: string | null;
  lifecycleStatus?: string | null;
  progressRate: number | null;
  reportType?: string | null;
  siteId?: string | null;
  status: string;
  workflowStatus?: string | null;
};

type PriorityQuarterlyScopeInput = {
  site: SiteLike;
  today: Date;
};

const DEADLINE_BUCKETS = [
  {
    dispatchStatus: 'normal',
    key: 'd_plus_0_3',
    label: 'D+0~3',
    matches: (days: number) => days <= 3,
  },
  {
    dispatchStatus: 'warning',
    key: 'd_plus_4_6',
    label: 'D+4~6',
    matches: (days: number) => days >= 4 && days <= 6,
  },
  {
    dispatchStatus: 'overdue',
    key: 'd_plus_7_plus',
    label: 'D+7+',
    matches: (days: number) => days >= 7,
  },
] as const;

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function pickDate(...values: Array<string | null | undefined>) {
  return values.map((value) => normalizeText(value)).find(Boolean) || '';
}

function getQuarterDateRange(today: Date) {
  const start = startOfQuarter(today);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);
  end.setHours(0, 0, 0, 0);
  return { end, start };
}

function isBeforeToday(value: string, today: Date) {
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return startOfToday(parsed).getTime() < startOfToday(today).getTime();
}

function isAfterToday(value: string, today: Date) {
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return startOfToday(parsed).getTime() > startOfToday(today).getTime();
}

function isDateInCurrentYear(value: string | null | undefined, today: Date) {
  const parsed = parseDateValue(value);
  return Boolean(parsed && parsed.getFullYear() === today.getFullYear());
}

function getProjectScopeRange(site: SiteLike) {
  const start = parseDateValue(site.project_start_date);
  const end = parseDateValue(site.project_end_date);
  if (!start || !end || start.getTime() > end.getTime()) return null;
  return { end, start };
}

function getContractScopeRange(site: SiteLike) {
  const start = parseDateValue(
    pickDate(site.contract_start_date, site.contract_date, site.contract_signed_date),
  );
  const end = parseDateValue(site.contract_end_date);
  if (!start || !end || start.getTime() > end.getTime()) return null;
  return { end, start };
}

export function isSiteInCurrentQuarterWindow(site: SiteLike | null | undefined, today: Date) {
  if (!site) return false;
  const scopeRange = getProjectScopeRange(site) ?? getContractScopeRange(site);
  if (!scopeRange) return false;
  const quarterRange = getQuarterDateRange(today);
  return (
    scopeRange.start.getTime() <= quarterRange.end.getTime() &&
    scopeRange.end.getTime() >= quarterRange.start.getTime()
  );
}

function overlapsCurrentYear(site: SiteLike, today: Date) {
  const startDate = getSiteStartDate(site);
  const endDate = getSiteEndDate(site);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  if (endDate && isBeforeToday(endDate, yearStart)) return false;
  if (startDate && isAfterToday(startDate, today)) return false;

  return Boolean(startDate || endDate);
}

function getSiteStartDate(site: SiteLike) {
  return pickDate(
    site.contract_start_date,
    site.project_start_date,
    site.contract_date,
    site.contract_signed_date,
  );
}

function getSiteEndDate(site: SiteLike) {
  return pickDate(site.contract_end_date, site.project_end_date);
}

export function isDispatchProcessedStatus(value: unknown) {
  const normalized = normalizeText(value);
  return normalized === 'sent' || normalized === 'manual_checked';
}

export function isManageableSiteScope(site: SiteLike | null | undefined, today: Date) {
  if (!site) return false;
  void today;

  const lifecycleStatus = normalizeSiteLifecycleStatus(site);
  if (lifecycleStatus === 'closed' || lifecycleStatus === 'deleted') return false;

  const headquarterStatus = normalizeHeadquarterLifecycleStatus(site.headquarter_detail);
  if (headquarterStatus === 'closed' || headquarterStatus === 'deleted') return false;

  return true;
}

export function isCurrentSiteManagementWindow(site: SiteLike | null | undefined, today: Date) {
  if (!site || !isManageableSiteScope(site, today)) return false;

  return overlapsCurrentYear(site, today) || isDateInCurrentYear(site.last_visit_date, today);
}

export function isDispatchManagementSiteScope(site: SiteLike | null | undefined, today: Date) {
  if (!site || !isManageableSiteScope(site, today)) return false;
  return (
    normalizeSiteLifecycleStatus(site) === 'active' &&
    isSiteInCurrentQuarterWindow(site, today)
  );
}

export function isDispatchManagementReportScope(row: DispatchManagementReportLike) {
  if (row.reportType !== 'technical_guidance' && row.reportType !== 'quarterly_report') {
    return false;
  }
  if (normalizeReportLifecycleStatus(row) === 'deleted') return false;
  if (isDispatchProcessedStatus(row.dispatchStatus)) return false;
  if (row.dispatchCompleted === true) return false;
  return true;
}

export function isDispatchManagementUnsentRow(row: SafetyAdminUnsentReportRow) {
  if (isDispatchProcessedStatus(row.dispatchStatus)) return false;
  return row.unsentDays >= 0 && row.unsentDays <= DISPATCH_MANAGEMENT_MAX_UNSENT_DAYS;
}

export function buildDispatchManagementRows<Row extends DispatchManagementReportLike>(
  rows: Row[],
  siteById: Map<string, SiteLike>,
  today: Date,
) {
  return rows.filter((row) => {
    const siteId = normalizeText(row.siteId);
    return (
      isDispatchManagementSiteScope(siteById.get(siteId), today) &&
      isDispatchManagementReportScope(row)
    );
  });
}

export function isPriorityQuarterlySiteScope({
  site,
  today,
}: PriorityQuarterlyScopeInput) {
  if (!isManageableSiteScope(site, today)) return false;
  if ((site.project_amount ?? 0) < PRIORITY_PROJECT_AMOUNT) return false;
  return normalizeSiteLifecycleStatus(site) === 'active' && isSiteInCurrentQuarterWindow(site, today);
}

export function isPriorityQuarterlyManagementRowScope(
  row: SafetyAdminPriorityQuarterlyManagementRow,
  today: Date,
) {
  if ((row.projectAmount ?? 0) < PRIORITY_PROJECT_AMOUNT) return false;
  return normalizeText(row.currentQuarterKey) === formatQuarterKey(today);
}

function compareDateAscending(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const leftTime = parseDateValue(left)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightTime = parseDateValue(right)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return normalizeText(left).localeCompare(normalizeText(right), 'ko');
}

export function compareDispatchManagementUnsentRows(
  left: SafetyAdminUnsentReportRow,
  right: SafetyAdminUnsentReportRow,
) {
  return (
    Number(Boolean(right.mailReady)) -
      Number(Boolean(left.mailReady)) ||
    right.unsentDays - left.unsentDays ||
    compareDateAscending(left.visitDate, right.visitDate) ||
    normalizeText(left.siteName).localeCompare(normalizeText(right.siteName), 'ko') ||
    normalizeText(left.reportTitle).localeCompare(normalizeText(right.reportTitle), 'ko') ||
    normalizeText(left.reportKey).localeCompare(normalizeText(right.reportKey), 'ko')
  );
}

export function buildDeadlineSignalSummaryFromRows(
  rows: SafetyAdminUnsentReportRow[],
  fallback?: SafetyAdminDeadlineSignalSummary,
): SafetyAdminDeadlineSignalSummary {
  const fallbackEntriesByKey = new Map(
    (fallback?.entries ?? []).map((entry) => [entry.key, entry]),
  );

  return {
    entries: DEADLINE_BUCKETS.map((bucket) => {
      const fallbackEntry = fallbackEntriesByKey.get(bucket.key);
      return {
        count: rows.filter((row) => bucket.matches(row.unsentDays)).length,
        href:
          fallbackEntry?.href ||
          getAdminSectionHref('reports', { dispatchStatus: bucket.dispatchStatus }),
        key: bucket.key,
        label: fallbackEntry?.label || bucket.label,
      };
    }),
    totalReportCount: rows.length,
  };
}

export function getUnsentDays(referenceDate: string, today: Date) {
  return Math.max(0, getDaysDiff(referenceDate, today) ?? 0);
}
