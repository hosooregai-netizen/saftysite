import {
  formatCurrencyValue,
  getAdminSectionHref,
  SITE_CONTRACT_TYPE_LABELS,
} from '@/lib/admin';
import {
  buildControllerReportHref,
  buildControllerReportRows,
  getControllerReportTypeLabel,
} from '@/lib/admin/controllerReports';
import {
  getDispatchStatusLabel,
  getQualityStatusLabel,
} from '@/lib/admin/reportMeta';
import {
  applyReportLifecycleStatus,
  isClosedReport,
  isVisibleReport,
} from '@/lib/admin/lifecycleStatus';
import {
  countFilledQuarterlyMaterials,
  getSiteQuarterlyMaterialRecord,
  hasSiteContractProfile,
  parseSiteContractProfile,
  QUARTERLY_MATERIAL_REQUIRED_COUNT,
} from '@/lib/admin/siteContractProfile';
import type {
  ReportDispatchStatus,
  SiteContractProfile,
} from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export type AdminAnalyticsPeriod = 'month' | 'quarter' | 'year' | 'all';

interface EnrichedControllerReportRow {
  assigneeName: string;
  assigneeUserId: string;
  checkerUserId: string;
  deadlineDate: string;
  dispatchStatus: ReportDispatchStatus;
  headquarterId: string;
  headquarterName: string;
  href: string;
  isBadWorkplaceOverdue: boolean;
  isCompleted: boolean;
  isOverdue: boolean;
  lifecycleStatus: import('@/types/backend').SafetyLifecycleStatus;
  periodLabel: string;
  progressRate: number | null;
  qualityStatus: 'unchecked' | 'ok' | 'issue';
  reportDate: string;
  reportKey: string;
  reportMonth: string;
  reportTitle: string;
  reportType: 'technical_guidance' | 'quarterly_report' | 'bad_workplace';
  siteId: string;
  siteName: string;
  status: string;
  updatedAt: string;
  visitDate: string;
  visitRound: number | null;
  totalRound: number | null;
  contractProfile: SiteContractProfile;
  workflowStatus: import('@/types/backend').SafetyReportWorkflowStatus;
}

export interface AdminOverviewMetricCard {
  href: string;
  label: string;
  meta: string;
  tone: 'default' | 'warning' | 'danger';
  value: string;
}

export interface AdminOverviewSiteAlertRow {
  badWorkplaceOverdueCount: number;
  headquarterName: string;
  href: string;
  overdueCount: number;
  quarterlyOverdueCount: number;
  reportKindsLabel: string;
  siteName: string;
}

export interface AdminOverviewReviewRow {
  assigneeName: string;
  headquarterName: string;
  href: string;
  qualityLabel: string;
  reportTitle: string;
  reportTypeLabel: string;
  siteName: string;
  updatedAt: string;
}

export interface AdminOverviewAgentRow {
  assignedSiteCount: number;
  href: string;
  loadLabel: string;
  overdueCount: number;
  userName: string;
}

export interface AdminOverviewDeadlineRow {
  deadlineDate: string;
  deadlineLabel: string;
  href: string;
  reportTitle: string;
  reportTypeLabel: string;
  siteName: string;
  statusLabel: string;
}

export interface AdminCoverageRow {
  itemCount: number;
  label: string;
  missingSiteCount: number;
}

export interface AdminOverviewChartEntry {
  count: number;
  href: string;
  key: string;
  label: string;
}

export interface AdminOverviewSiteStatusSummary {
  entries: AdminOverviewChartEntry[];
  totalSiteCount: number;
}

export interface AdminOverviewQuarterlyMaterialRequirement {
  filledCount: number;
  missingCount: number;
  requiredCount: number;
}

export interface AdminOverviewQuarterlyMaterialSiteRow {
  education: AdminOverviewQuarterlyMaterialRequirement;
  headquarterName: string;
  href: string;
  measurement: AdminOverviewQuarterlyMaterialRequirement;
  missingLabels: string[];
  quarterKey: string;
  quarterLabel: string;
  siteId: string;
  siteName: string;
}

export interface AdminOverviewQuarterlyMaterialSummary {
  entries: AdminOverviewChartEntry[];
  missingSiteRows: AdminOverviewQuarterlyMaterialSiteRow[];
  quarterKey: string;
  quarterLabel: string;
  totalSiteCount: number;
}

export interface AdminOverviewDeadlineSignalSummary {
  entries: AdminOverviewChartEntry[];
  totalReportCount: number;
}

export interface AdminOverviewUnsentReportRow {
  assigneeName: string;
  deadlineDate: string;
  dispatchStatus: ReportDispatchStatus;
  headquarterName: string;
  href: string;
  referenceDate: string;
  reportKey: string;
  reportTitle: string;
  reportTypeLabel: string;
  siteId: string;
  siteName: string;
  unsentDays: number;
  visitDate: string;
}

export interface AdminOverviewModel {
  coverageRows: AdminCoverageRow[];
  deadlineSignalSummary: AdminOverviewDeadlineSignalSummary;
  deadlineRows: AdminOverviewDeadlineRow[];
  metricCards: AdminOverviewMetricCard[];
  overdueSiteRows: AdminOverviewSiteAlertRow[];
  pendingReviewRows: AdminOverviewReviewRow[];
  quarterlyMaterialSummary: AdminOverviewQuarterlyMaterialSummary;
  siteStatusSummary: AdminOverviewSiteStatusSummary;
  summaryRows: Array<{ label: string; meta: string; value: string }>;
  unsentReportRows: AdminOverviewUnsentReportRow[];
  workerLoadRows: AdminOverviewAgentRow[];
}

export interface AdminAnalyticsSummaryCard {
  deltaLabel: string;
  deltaTone: 'negative' | 'neutral' | 'positive';
  deltaValue: string;
  label: string;
  meta: string;
  value: string;
}

export interface AdminAnalyticsTrendRow {
  avgPerVisitAmount: number;
  executedRounds: number;
  label: string;
  monthKey: string;
  revenue: number;
}

export interface AdminAnalyticsEmployeeRow {
  assignedSiteCount: number;
  avgPerVisitAmount: number;
  completionRate: number;
  overdueCount: number;
  primaryContractTypeLabel: string;
  revenueChangeRate: number | null;
  totalAssignedRounds: number;
  userId: string;
  userName: string;
  visitRevenue: number;
  executedRounds: number;
}

export interface AdminAnalyticsSiteRevenueRow {
  avgPerVisitAmount: number;
  contractTypeLabel: string;
  executedRounds: number;
  headquarterName: string;
  href: string;
  siteId: string;
  siteName: string;
  visitRevenue: number;
}

export interface AdminAnalyticsContractTypeRow {
  avgPerVisitAmount: number;
  executedRounds: number;
  label: string;
  siteCount: number;
  shareRate: number;
  totalContractAmount: number;
  visitRevenue: number;
}

export interface AdminAnalyticsStats {
  averagePerVisitAmount: number;
  completionRate: number;
  countedSiteCount: number;
  delayRate: number;
  excludedSiteCount: number;
  includedEmployeeCount: number;
  overdueCount: number;
  totalExecutedRounds: number;
  totalVisitRevenue: number;
}

export interface AdminAnalyticsModel {
  contractTypeRows: AdminAnalyticsContractTypeRow[];
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  stats: AdminAnalyticsStats;
  summaryCards: AdminAnalyticsSummaryCard[];
  trendRows: AdminAnalyticsTrendRow[];
}

function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) return null;

  const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const parsed = new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
    );
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string | null | undefined, days: number): string {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  parsed.setDate(parsed.getDate() + days);
  return formatDateValue(parsed);
}

function addDaysToDate(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return formatDateValue(next);
}

function startOfToday(today: Date): Date {
  const next = new Date(today);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDaysDiff(from: string | null | undefined, to: Date): number | null {
  const parsed = parseDateValue(from);
  if (!parsed) return null;
  const target = startOfToday(to);
  return Math.floor((target.getTime() - parsed.getTime()) / DAY_IN_MS);
}

function getDaysUntil(from: Date, to: string | null | undefined): number | null {
  const parsed = parseDateValue(to);
  if (!parsed) return null;
  return Math.floor((parsed.getTime() - startOfToday(from).getTime()) / DAY_IN_MS);
}

function formatDateOnly(value: string): string {
  if (!value) return '-';
  return value.slice(0, 10);
}

function formatDateTime(value: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isCompletedStatus(row: {
  lifecycleStatus?: string | null;
  progressRate: number | null;
  status: string;
  workflowStatus?: string | null;
}) {
  return isClosedReport(row);
}

function buildReportDate(row: {
  reportMonth: string;
  updatedAt: string;
  visitDate: string;
}) {
  if (row.visitDate) return row.visitDate;
  if (row.reportMonth) return `${row.reportMonth}-01`;
  return row.updatedAt.slice(0, 10);
}

function resolveBadWorkplaceDeadline(reportMonth: string, updatedAt: string) {
  const normalizedMonth = reportMonth || updatedAt.slice(0, 7);
  const matched = normalizedMonth.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return '';
  const endOfMonth = new Date(Number(matched[1]), Number(matched[2]), 0);
  endOfMonth.setHours(0, 0, 0, 0);
  return addDaysToDate(endOfMonth, 7);
}

function resolveVisitDispatchState(
  visitDate: string,
  deadlineDate: string,
  dispatchStatus: ReportDispatchStatus,
  updatedAt: string,
  today: Date,
): { deadlineDate: string; dispatchStatus: ReportDispatchStatus } {
  const baseDate = visitDate || updatedAt.slice(0, 10);
  const normalizedDeadlineDate = deadlineDate || addDays(baseDate, 7);

  if (dispatchStatus === 'sent') {
    return {
      deadlineDate: normalizedDeadlineDate,
      dispatchStatus,
    };
  }

  const daysSinceVisit = getDaysDiff(baseDate, today);
  if (daysSinceVisit == null) {
    return {
      deadlineDate: normalizedDeadlineDate,
      dispatchStatus,
    };
  }

  return {
    deadlineDate: normalizedDeadlineDate,
    dispatchStatus:
      daysSinceVisit >= 7 ? 'overdue' : daysSinceVisit >= 4 ? 'warning' : 'normal',
  };
}

function buildAssignedSiteIdsByUser(data: ControllerDashboardData) {
  const siteIdsByUser = new Map<string, Set<string>>();

  const assign = (userId: string | null | undefined, siteId: string | null | undefined) => {
    const normalizedUserId = userId?.trim() || '';
    const normalizedSiteId = siteId?.trim() || '';
    if (!normalizedUserId || !normalizedSiteId) return;
    if (!siteIdsByUser.has(normalizedUserId)) {
      siteIdsByUser.set(normalizedUserId, new Set());
    }
    siteIdsByUser.get(normalizedUserId)?.add(normalizedSiteId);
  };

  data.assignments
    .filter((assignment) => assignment.is_active)
    .forEach((assignment) => assign(assignment.user_id, assignment.site_id));

  data.sites.forEach((site) => {
    assign(site.assigned_user?.id, site.id);
    (site.assigned_users || []).forEach((user) => assign(user.id, site.id));
  });

  return siteIdsByUser;
}

function buildEnrichedRows(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  today: Date,
): EnrichedControllerReportRow[] {
  const visibleReports = reports
    .map((report) => applyReportLifecycleStatus(report))
    .filter((report) => isVisibleReport(report));
  const rows = buildControllerReportRows(visibleReports, data.sites, data.users)
    .filter((row) => isVisibleReport(row));
  const reportByKey = new Map(visibleReports.map((report) => [report.report_key, report]));
  const siteById = new Map(data.sites.map((site) => [site.id, site]));

  return rows.map((row) => {
    const sourceReport = reportByKey.get(row.reportKey);
    const contractProfile = parseSiteContractProfile(siteById.get(row.siteId) ?? null);
    const quarterlyDispatch =
      row.reportType === 'quarterly_report'
        ? resolveVisitDispatchState(
            row.visitDate,
            row.deadlineDate,
            row.dispatchStatus,
            row.updatedAt,
            today,
          )
        : null;
    const badWorkplaceDeadline =
      row.reportType === 'bad_workplace'
        ? resolveBadWorkplaceDeadline(row.reportMonth, row.updatedAt)
        : '';
    const isCompleted = isCompletedStatus(row);
    const isBadWorkplaceOverdue =
      row.reportType === 'bad_workplace' &&
      !isCompleted &&
      Boolean(badWorkplaceDeadline) &&
      (getDaysUntil(today, badWorkplaceDeadline) ?? 1) < 0;

    return {
      assigneeName: row.assigneeName,
      assigneeUserId: row.assigneeUserId,
      checkerUserId: row.checkerUserId,
      deadlineDate: quarterlyDispatch?.deadlineDate || row.deadlineDate,
      dispatchStatus: quarterlyDispatch?.dispatchStatus || row.dispatchStatus,
      headquarterId: row.headquarterId,
      headquarterName: row.headquarterName,
      href: buildControllerReportHref(row),
      isBadWorkplaceOverdue,
      isCompleted,
      isOverdue:
        row.reportType === 'quarterly_report'
          ? (quarterlyDispatch?.dispatchStatus || row.dispatchStatus) === 'overdue'
          : isBadWorkplaceOverdue,
      lifecycleStatus: row.lifecycleStatus,
      periodLabel: row.periodLabel,
      progressRate: row.progressRate,
      qualityStatus: row.qualityStatus,
      reportDate: buildReportDate(row),
      reportKey: row.reportKey,
      reportMonth: row.reportMonth,
      reportTitle: row.reportTitle,
      reportType: row.reportType,
      siteId: row.siteId,
      siteName: row.siteName,
      status: row.status,
      updatedAt: row.updatedAt,
      visitDate: row.visitDate,
      visitRound: sourceReport?.visit_round ?? null,
      totalRound: sourceReport?.total_round ?? contractProfile.totalRounds ?? null,
      contractProfile,
      workflowStatus: row.workflowStatus,
    };
  });
}

function startOfMonth(today: Date) {
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function startOfQuarter(today: Date) {
  return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
}

function startOfYear(today: Date) {
  return new Date(today.getFullYear(), 0, 1);
}

function formatQuarterKey(today: Date) {
  return `${today.getFullYear()}-Q${Math.floor(today.getMonth() / 3) + 1}`;
}

function formatQuarterLabel(today: Date) {
  return `${today.getFullYear()}년 ${Math.floor(today.getMonth() / 3) + 1}분기`;
}

function isWithinPeriod(value: string, period: AdminAnalyticsPeriod, today: Date) {
  if (period === 'all') return true;
  const parsed = parseDateValue(value);
  if (!parsed) return false;

  const todayStart = startOfToday(today);
  const periodStart =
    period === 'month'
      ? startOfMonth(todayStart)
      : period === 'quarter'
        ? startOfQuarter(todayStart)
        : startOfYear(todayStart);

  return parsed.getTime() >= periodStart.getTime() && parsed.getTime() <= todayStart.getTime();
}

function hasRevenueProfile(profile: SiteContractProfile) {
  return (
    profile.perVisitAmount != null &&
    profile.perVisitAmount > 0 &&
    profile.totalRounds != null &&
    profile.totalRounds > 0
  );
}

function buildCompletedRoundKeys(rows: EnrichedControllerReportRow[]) {
  return new Set(
    rows
      .filter((row) => row.reportType === 'technical_guidance' && row.isCompleted)
      .map((row) => `${row.siteId}:${row.visitRound || row.reportKey}`),
  );
}

interface AnalyticsDateRange {
  end: Date;
  label: string;
  start: Date;
}

interface AnalyticsComparisonWindow {
  changeLabel: string;
  current: AnalyticsDateRange | null;
  periodLabel: string;
  previous: AnalyticsDateRange | null;
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(date: Date) {
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isWithinDateRange(value: string, range: AnalyticsDateRange | null) {
  if (!range) return false;
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return parsed.getTime() >= range.start.getTime() && parsed.getTime() <= range.end.getTime();
}

function sumVisitRevenue(rows: EnrichedControllerReportRow[]) {
  return rows.reduce((sum, row) => sum + (hasRevenueProfile(row.contractProfile) ? row.contractProfile.perVisitAmount ?? 0 : 0), 0);
}

function countExecutedRounds(rows: EnrichedControllerReportRow[]) {
  return buildCompletedRoundKeys(rows).size;
}

function calculateAveragePerVisitAmount(revenue: number, executedRounds: number) {
  return executedRounds > 0 ? revenue / executedRounds : 0;
}

function calculateChangeRate(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return (current - previous) / previous;
}

function formatDeltaValue(value: number | null) {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function getDeltaTone(value: number | null) {
  if (value == null || Number.isNaN(value) || Math.abs(value) < 0.0005) {
    return 'neutral' as const;
  }

  return value > 0 ? ('positive' as const) : ('negative' as const);
}

function buildComparisonRange(
  label: string,
  changeLabel: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousLimit: Date,
) {
  const normalizedCurrentStart = startOfToday(currentStart);
  const normalizedCurrentEnd = startOfToday(currentEnd);
  const normalizedPreviousStart = startOfToday(previousStart);
  const normalizedPreviousLimit = startOfToday(previousLimit);
  const elapsedDays = Math.max(
    0,
    Math.floor((normalizedCurrentEnd.getTime() - normalizedCurrentStart.getTime()) / DAY_IN_MS),
  );
  const previousEnd = new Date(normalizedPreviousStart);
  previousEnd.setDate(previousEnd.getDate() + elapsedDays);
  if (previousEnd.getTime() > normalizedPreviousLimit.getTime()) {
    previousEnd.setTime(normalizedPreviousLimit.getTime());
  }

  return {
    changeLabel,
    current: {
      end: normalizedCurrentEnd,
      label,
      start: normalizedCurrentStart,
    },
    periodLabel: label,
    previous: {
      end: previousEnd,
      label,
      start: normalizedPreviousStart,
    },
  } satisfies AnalyticsComparisonWindow;
}

function buildAnalyticsComparisonWindow(
  period: AdminAnalyticsPeriod,
  today: Date,
): AnalyticsComparisonWindow {
  const todayStart = startOfToday(today);
  if (period === 'month') {
    const currentStart = startOfMonth(todayStart);
    const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1);
    return buildComparisonRange(
      '이번 달',
      '전월 대비',
      currentStart,
      todayStart,
      previousStart,
      endOfMonth(previousStart),
    );
  }

  if (period === 'quarter') {
    const currentStart = startOfQuarter(todayStart);
    const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1);
    return buildComparisonRange(
      '이번 분기',
      '전분기 대비',
      currentStart,
      todayStart,
      previousStart,
      new Date(currentStart.getFullYear(), currentStart.getMonth(), 0),
    );
  }

  if (period === 'year') {
    const currentStart = startOfYear(todayStart);
    const previousStart = new Date(currentStart.getFullYear() - 1, 0, 1);
    return buildComparisonRange(
      '올해 누적',
      '전년 동기 대비',
      currentStart,
      todayStart,
      previousStart,
      new Date(currentStart.getFullYear(), 0, 0),
    );
  }

  return {
    changeLabel: '비교 구간 없음',
    current: null,
    periodLabel: '전체 기간',
    previous: null,
  };
}

function getCurrentWindowLabel(period: AdminAnalyticsPeriod) {
  switch (period) {
    case 'quarter':
      return '이번 분기';
    case 'year':
      return '올해 누적';
    case 'all':
      return '전체 기간';
    case 'month':
    default:
      return '이번 달';
  }
}

function resolvePrimaryContractTypeLabel(
  siteIds: string[],
  sitesById: Map<string, ControllerDashboardData['sites'][number]>,
) {
  const counts = new Map<string, number>();
  siteIds.forEach((siteId) => {
    const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
    const key = profile.contractType || '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const topEntry = Array.from(counts.entries()).sort((left, right) => {
    if (right[1] !== left[1]) return right[1] - left[1];
    const leftLabel = getContractTypeDisplayLabel(left[0]);
    const rightLabel = getContractTypeDisplayLabel(right[0]);
    return leftLabel.localeCompare(rightLabel, 'ko');
  })[0];

  return getContractTypeDisplayLabel(topEntry?.[0]);
}

function getContractTypeDisplayLabel(value: string | null | undefined) {
  const normalized = value?.trim() || '';
  if (!normalized) return '미입력';
  return SITE_CONTRACT_TYPE_LABELS[normalized as keyof typeof SITE_CONTRACT_TYPE_LABELS] || '미입력';
}

function matchesAnalyticsQuery(
  row: {
    assigneeName?: string;
    contractTypeLabel?: string;
    headquarterName?: string;
    periodLabel?: string;
    reportTitle?: string;
    siteName?: string;
    userName?: string;
  },
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    row.assigneeName,
    row.contractTypeLabel,
    row.headquarterName,
    row.periodLabel,
    row.reportTitle,
    row.siteName,
    row.userName,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

function buildTrendRows(rows: EnrichedControllerReportRow[], today: Date): AdminAnalyticsTrendRow[] {
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (11 - index), 1);
    const monthEnd = endOfMonth(monthStart);
    const monthRows = rows.filter((row) => isWithinDateRange(row.reportDate, {
      end: monthEnd,
      label: formatMonthLabel(monthStart),
      start: monthStart,
    }));
    const executedRounds = countExecutedRounds(monthRows);
    const revenue = sumVisitRevenue(monthRows);

    return {
      avgPerVisitAmount: calculateAveragePerVisitAmount(revenue, executedRounds),
      executedRounds,
      label: formatMonthLabel(monthStart),
      monthKey: formatMonthKey(monthStart),
      revenue,
    };
  });
}

export function buildAdminOverviewModel(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  today = new Date(),
): AdminOverviewModel {
  const overviewRows = buildEnrichedRows(data, reports, today);
  const activeSites = data.sites.filter((site) => site.status === 'active');
  const quarterKey = formatQuarterKey(today);
  const quarterLabel = formatQuarterLabel(today);
  const quarterlyOverdueRows = overviewRows.filter(
    (row) => row.reportType === 'quarterly_report' && row.dispatchStatus === 'overdue',
  );
  const badWorkplaceOverdueRows = overviewRows.filter((row) => row.isBadWorkplaceOverdue);
  const siteStatusSummary: AdminOverviewSiteStatusSummary = {
    entries: [
      {
        count: data.sites.filter((site) => site.status === 'active').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'active',
        label: '진행중',
      },
      {
        count: data.sites.filter((site) => site.status === 'planned').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'planned' }),
        key: 'planned',
        label: '미착수',
      },
      {
        count: data.sites.filter((site) => site.status === 'closed').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'closed' }),
        key: 'closed',
        label: '종료',
      },
    ],
    totalSiteCount: data.sites.length,
  };

  const materialBucketCounts = {
    both_missing: 0,
    complete: 0,
    education_missing: 0,
    measurement_missing: 0,
  };
  const materialMissingSiteRows: AdminOverviewQuarterlyMaterialSiteRow[] = [];
  let educationReadyCount = 0;
  let measurementReadyCount = 0;
  activeSites.forEach((site) => {
    const materialRecord = getSiteQuarterlyMaterialRecord(site, quarterKey);
    const educationFilledCount = countFilledQuarterlyMaterials(materialRecord.educationMaterials);
    const measurementFilledCount = countFilledQuarterlyMaterials(materialRecord.measurementMaterials);
    const educationMissingCount = Math.max(
      0,
      QUARTERLY_MATERIAL_REQUIRED_COUNT - educationFilledCount,
    );
    const measurementMissingCount = Math.max(
      0,
      QUARTERLY_MATERIAL_REQUIRED_COUNT - measurementFilledCount,
    );

    if (educationMissingCount === 0) educationReadyCount += 1;
    if (measurementMissingCount === 0) measurementReadyCount += 1;

    if (educationMissingCount === 0 && measurementMissingCount === 0) {
      materialBucketCounts.complete += 1;
    } else if (educationMissingCount > 0 && measurementMissingCount > 0) {
      materialBucketCounts.both_missing += 1;
    } else if (educationMissingCount > 0) {
      materialBucketCounts.education_missing += 1;
    } else {
      materialBucketCounts.measurement_missing += 1;
    }

    if (educationMissingCount === 0 && measurementMissingCount === 0) return;

    materialMissingSiteRows.push({
      education: {
        filledCount: educationFilledCount,
        missingCount: educationMissingCount,
        requiredCount: QUARTERLY_MATERIAL_REQUIRED_COUNT,
      },
      headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
      href: getAdminSectionHref('headquarters', {
        editSiteId: site.id,
        headquarterId: site.headquarter_id,
      }),
      measurement: {
        filledCount: measurementFilledCount,
        missingCount: measurementMissingCount,
        requiredCount: QUARTERLY_MATERIAL_REQUIRED_COUNT,
      },
      missingLabels: [
        educationMissingCount > 0
          ? `교육자료 ${educationFilledCount}/${QUARTERLY_MATERIAL_REQUIRED_COUNT}`
          : '',
        measurementMissingCount > 0
          ? `계측자료 ${measurementFilledCount}/${QUARTERLY_MATERIAL_REQUIRED_COUNT}`
          : '',
      ].filter(Boolean),
      quarterKey,
      quarterLabel,
      siteId: site.id,
      siteName: site.site_name,
    });
  });
  materialMissingSiteRows.sort(
    (left, right) =>
      right.education.missingCount +
        right.measurement.missingCount -
        (left.education.missingCount + left.measurement.missingCount) ||
      left.siteName.localeCompare(right.siteName, 'ko'),
  );

  const quarterlyMaterialSummary: AdminOverviewQuarterlyMaterialSummary = {
    entries: [
      {
        count: materialBucketCounts.complete,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'complete',
        label: '모두 충족',
      },
      {
        count: materialBucketCounts.education_missing,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'education_missing',
        label: '교육자료 부족',
      },
      {
        count: materialBucketCounts.measurement_missing,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'measurement_missing',
        label: '계측자료 부족',
      },
      {
        count: materialBucketCounts.both_missing,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'both_missing',
        label: '교육/계측 모두 부족',
      },
    ],
    missingSiteRows: materialMissingSiteRows,
    quarterKey,
    quarterLabel,
    totalSiteCount: activeSites.length,
  };

  const missingContractCount = activeSites.filter(
    (site) => !hasSiteContractProfile(parseSiteContractProfile(site)),
  ).length;
  const coverageRows: AdminCoverageRow[] = [
    {
      itemCount: educationReadyCount,
      label: '교육자료',
      missingSiteCount: Math.max(0, activeSites.length - educationReadyCount),
    },
    {
      itemCount: measurementReadyCount,
      label: '계측자료',
      missingSiteCount: Math.max(0, activeSites.length - measurementReadyCount),
    },
    {
      itemCount: activeSites.length - missingContractCount,
      label: '계약정보',
      missingSiteCount: missingContractCount,
    },
  ];

  const overdueSiteMap = new Map<
    string,
    {
      badWorkplaceOverdueCount: number;
      headquarterName: string;
      quarterlyOverdueCount: number;
      siteName: string;
    }
  >();
  [...quarterlyOverdueRows, ...badWorkplaceOverdueRows].forEach((row) => {
    const current = overdueSiteMap.get(row.siteId) ?? {
      badWorkplaceOverdueCount: 0,
      headquarterName: row.headquarterName,
      quarterlyOverdueCount: 0,
      siteName: row.siteName,
    };

    if (row.reportType === 'quarterly_report') {
      current.quarterlyOverdueCount += 1;
    }

    if (row.reportType === 'bad_workplace') {
      current.badWorkplaceOverdueCount += 1;
    }

    overdueSiteMap.set(row.siteId, current);
  });

  const overdueSiteRows = Array.from(overdueSiteMap.entries())
    .map(([siteId, value]) => ({
      badWorkplaceOverdueCount: value.badWorkplaceOverdueCount,
      headquarterName: value.headquarterName || '-',
      href: getAdminSectionHref('reports', {
        dispatchStatus: 'overdue',
        siteId,
      }),
      overdueCount: value.quarterlyOverdueCount + value.badWorkplaceOverdueCount,
      quarterlyOverdueCount: value.quarterlyOverdueCount,
      reportKindsLabel: [
        value.quarterlyOverdueCount > 0 ? `분기 ${value.quarterlyOverdueCount}건` : '',
        value.badWorkplaceOverdueCount > 0 ? `불량사업장 ${value.badWorkplaceOverdueCount}건` : '',
      ]
        .filter(Boolean)
        .join(' / '),
      siteName: value.siteName,
    }))
    .sort((left, right) => right.overdueCount - left.overdueCount || left.siteName.localeCompare(right.siteName, 'ko'))
    .slice(0, 8);

  const pendingReviewRows = overviewRows
    .filter((row) => row.qualityStatus !== 'ok')
    .sort((left, right) => {
      const qualityWeight = (value: EnrichedControllerReportRow['qualityStatus']) =>
        value === 'issue' ? 0 : value === 'unchecked' ? 1 : 2;
      return (
        qualityWeight(left.qualityStatus) - qualityWeight(right.qualityStatus) ||
        right.updatedAt.localeCompare(left.updatedAt)
      );
    })
    .slice(0, 8)
    .map((row) => ({
      assigneeName: row.assigneeName || '-',
      headquarterName: row.headquarterName || '-',
      href: row.href,
      qualityLabel: getQualityStatusLabel(row.qualityStatus),
      reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
      reportTypeLabel: getControllerReportTypeLabel(row.reportType),
      siteName: row.siteName,
      updatedAt: formatDateTime(row.updatedAt),
    }));

  const assignedSiteIdsByUser = buildAssignedSiteIdsByUser(data);
  const workerLoadRows = data.users
    .map((user) => {
      const assignedSiteCount = assignedSiteIdsByUser.get(user.id)?.size ?? 0;
      const overdueCount = overviewRows.filter(
        (row) => row.assigneeUserId === user.id && row.isOverdue,
      ).length;
      const needsAttention = assignedSiteCount === 0 || assignedSiteCount >= 7 || overdueCount >= 2;

      return {
        assignedSiteCount,
        href: getAdminSectionHref('reports', { assigneeUserId: user.id }),
        loadLabel:
          assignedSiteCount === 0
            ? '미배정'
            : overdueCount >= 2
              ? '지연 집중'
              : '과부하',
        overdueCount,
        userName: user.name,
        visible: needsAttention,
      };
    })
    .filter((row) => row.visible)
    .sort((left, right) => {
      const weight = (value: string) => (value === '미배정' ? 0 : value === '지연 집중' ? 1 : 2);
      return (
        weight(left.loadLabel) - weight(right.loadLabel) ||
        right.overdueCount - left.overdueCount ||
        right.assignedSiteCount - left.assignedSiteCount
      );
    })
    .slice(0, 8)
    .map((row) => ({
      assignedSiteCount: row.assignedSiteCount,
      href: row.href,
      loadLabel: row.loadLabel,
      overdueCount: row.overdueCount,
      userName: row.userName,
    }));

  const deadlineRows = overviewRows
    .filter((row) => row.reportType === 'quarterly_report' && row.dispatchStatus !== 'sent')
    .map((row) => ({
      daysUntil: getDaysUntil(today, row.deadlineDate),
      row,
    }))
    .filter((item) => item.daysUntil != null && item.daysUntil >= 0 && item.daysUntil <= 7)
    .sort((left, right) => (left.daysUntil ?? 99) - (right.daysUntil ?? 99))
    .slice(0, 8)
    .map(({ daysUntil, row }) => ({
      deadlineDate: formatDateOnly(row.deadlineDate),
      deadlineLabel: daysUntil === 0 ? '오늘' : `D-${daysUntil}`,
      href: row.href,
      reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
      reportTypeLabel: getControllerReportTypeLabel(row.reportType),
      siteName: row.siteName,
      statusLabel: getDispatchStatusLabel(row.dispatchStatus),
    }));

  const allUnsentReportRows: AdminOverviewUnsentReportRow[] = overviewRows
    .filter(
      (row) =>
        (row.reportType === 'quarterly_report' || row.reportType === 'technical_guidance') &&
        row.dispatchStatus !== 'sent',
    )
    .map((row) => {
      const referenceDate = row.visitDate || row.updatedAt.slice(0, 10);
      const visitDispatch = resolveVisitDispatchState(
        row.visitDate,
        row.deadlineDate,
        row.dispatchStatus,
        row.updatedAt,
        today,
      );
      return {
        assigneeName: row.assigneeName || '-',
        deadlineDate: formatDateOnly(visitDispatch.deadlineDate),
        dispatchStatus: visitDispatch.dispatchStatus,
        headquarterName: row.headquarterName || '-',
        href: row.href,
        referenceDate: formatDateOnly(referenceDate),
        reportKey: row.reportKey,
        reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
        reportTypeLabel: getControllerReportTypeLabel(row.reportType),
        siteId: row.siteId,
        siteName: row.siteName,
        unsentDays: Math.max(0, getDaysDiff(referenceDate, today) ?? 0),
        visitDate: formatDateOnly(row.visitDate || referenceDate),
      };
    })
    .sort(
      (left, right) =>
        right.unsentDays - left.unsentDays ||
        left.siteName.localeCompare(right.siteName, 'ko') ||
        left.reportTitle.localeCompare(right.reportTitle, 'ko'),
    )
  ;

  const deadlineSignalSummary: AdminOverviewDeadlineSignalSummary = {
    entries: [
      {
        count: allUnsentReportRows.filter((row) => row.unsentDays <= 3).length,
        href: getAdminSectionHref('reports', { dispatchStatus: 'normal' }),
        key: 'd_plus_0_3',
        label: 'D+0~3',
      },
      {
        count: allUnsentReportRows.filter((row) => row.unsentDays >= 4 && row.unsentDays <= 6).length,
        href: getAdminSectionHref('reports', { dispatchStatus: 'warning' }),
        key: 'd_plus_4_6',
        label: 'D+4~6',
      },
      {
        count: allUnsentReportRows.filter((row) => row.unsentDays >= 7).length,
        href: getAdminSectionHref('reports', { dispatchStatus: 'overdue' }),
        key: 'd_plus_7_plus',
        label: 'D+7 이상',
      },
    ],
    totalReportCount: allUnsentReportRows.length,
  };

  const actionableUnsentReportRows = allUnsentReportRows.filter(
    (row) => row.dispatchStatus === 'warning' || row.dispatchStatus === 'overdue',
  );
  const unsentReportRows = actionableUnsentReportRows.slice(0, 12);

  const metricCards: AdminOverviewMetricCard[] = [
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'all' }),
      label: '전체 현장 수',
      meta: '관리 대상 전체 현장',
      tone: 'default',
      value: `${data.sites.length}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '진행중',
      meta: '운영중 현장',
      tone: 'default',
      value: `${siteStatusSummary.entries[0]?.count ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'planned' }),
      label: '미착수',
      meta: '준비중 현장',
      tone: 'default',
      value: `${siteStatusSummary.entries[1]?.count ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'closed' }),
      label: '종료',
      meta: '종료된 현장',
      tone: 'default',
      value: `${siteStatusSummary.entries[2]?.count ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '교육/계측 자료 부족 현장',
      meta: `${quarterLabel} 교육/계측 각 4건 기준`,
      tone: materialMissingSiteRows.length > 0 ? 'warning' : 'default',
      value: `${materialMissingSiteRows.length}개 현장`,
    },
    {
      href: getAdminSectionHref('reports'),
      label: '발송 관리 대상',
      meta: '지도 실시일 기준',
      tone: actionableUnsentReportRows.length > 0 ? 'danger' : 'default',
      value: `${actionableUnsentReportRows.length}건`,
    },
  ];

  return {
    coverageRows,
    deadlineSignalSummary,
    deadlineRows,
    metricCards,
    overdueSiteRows,
    pendingReviewRows,
    quarterlyMaterialSummary,
    siteStatusSummary,
    summaryRows: metricCards.map((card) => ({
      label: card.label,
      meta: card.meta,
      value: card.value,
    })),
    unsentReportRows,
    workerLoadRows,
  };
}

export function buildAdminAnalyticsModel(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  filters: {
    contractType: string;
    headquarterId: string;
    period: AdminAnalyticsPeriod;
    query: string;
    userId: string;
  },
  today = new Date(),
): AdminAnalyticsModel {
  const analyticsRows = buildEnrichedRows(data, reports, today);
  const assignedSiteIdsByUser = buildAssignedSiteIdsByUser(data);
  const sitesById = new Map(data.sites.map((site) => [site.id, site]));
  const userScopedSiteIds = new Set(
    filters.userId
      ? [
          ...(assignedSiteIdsByUser.get(filters.userId) ?? new Set<string>()),
          ...analyticsRows
            .filter((row) => row.assigneeUserId === filters.userId)
            .map((row) => row.siteId),
        ]
      : data.sites.map((site) => site.id),
  );

  const visibleSiteIds = new Set(
    data.sites
      .filter((site) => {
        const profile = parseSiteContractProfile(site);
        if (filters.headquarterId && site.headquarter_id !== filters.headquarterId) return false;
        if (filters.contractType && profile.contractType !== filters.contractType) return false;
        if (filters.userId && !userScopedSiteIds.has(site.id)) return false;
        return true;
      })
      .map((site) => site.id),
  );

  const visibleSites = data.sites.filter((site) => visibleSiteIds.has(site.id));
  const scopedRows = analyticsRows.filter(
    (row) =>
      visibleSiteIds.has(row.siteId) &&
      (!filters.userId || row.assigneeUserId === filters.userId),
  );
  const scopedGuidanceRows = scopedRows.filter(
    (row) =>
      row.reportType === 'technical_guidance' &&
      row.isCompleted &&
      hasRevenueProfile(row.contractProfile),
  );
  const detailRows = scopedRows.filter((row) => isWithinPeriod(row.reportDate, filters.period, today));
  const detailGuidanceRows = detailRows.filter(
    (row) =>
      row.reportType === 'technical_guidance' &&
      row.isCompleted &&
      hasRevenueProfile(row.contractProfile),
  );
  const comparisonWindow = buildAnalyticsComparisonWindow(filters.period, today);
  const previousRows = comparisonWindow.previous
    ? scopedRows.filter((row) => isWithinDateRange(row.reportDate, comparisonWindow.previous))
    : [];
  const previousGuidanceRows = previousRows.filter(
    (row) =>
      row.reportType === 'technical_guidance' &&
      row.isCompleted &&
      hasRevenueProfile(row.contractProfile),
  );
  const normalizedQuery = filters.query.trim();
  const queriedDetailRows = normalizedQuery
    ? detailRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            periodLabel: row.periodLabel,
            reportTitle: row.reportTitle,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : detailRows;
  const queriedDetailGuidanceRows = normalizedQuery
    ? detailGuidanceRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            periodLabel: row.periodLabel,
            reportTitle: row.reportTitle,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : detailGuidanceRows;
  const queriedPreviousGuidanceRows = normalizedQuery
    ? previousGuidanceRows.filter((row) =>
        matchesAnalyticsQuery(
          {
            assigneeName: row.assigneeName,
            headquarterName: row.headquarterName,
            periodLabel: row.periodLabel,
            reportTitle: row.reportTitle,
            siteName: row.siteName,
          },
          normalizedQuery,
        ),
      )
    : previousGuidanceRows;

  const userLoadRows = data.users
    .map((user) => {
      const assignedSiteIds = Array.from(assignedSiteIdsByUser.get(user.id) ?? new Set<string>()).filter(
        (siteId) => visibleSiteIds.has(siteId),
      );
      const totalAssignedRounds = assignedSiteIds.reduce((sum, siteId) => {
        const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
        return sum + (profile.totalRounds ?? 0);
      }, 0);

      return {
        assignedSiteIds,
        totalAssignedRounds,
        userId: user.id,
        userName: user.name,
      };
    })
    .filter((row) => {
      if (filters.userId) return row.userId === filters.userId;
      return row.assignedSiteIds.length > 0 || scopedRows.some((item) => item.assigneeUserId === row.userId);
    });

  const totalAssignedRounds = userLoadRows.reduce((sum, row) => sum + row.totalAssignedRounds, 0);
  const totalVisitRevenue = sumVisitRevenue(detailGuidanceRows);
  const totalExecutedRounds = countExecutedRounds(detailGuidanceRows);
  const totalOverdueCount = detailRows.filter((row) => row.isOverdue).length;
  const currentPeriodRevenue = sumVisitRevenue(detailGuidanceRows);
  const previousPeriodRevenue = sumVisitRevenue(previousGuidanceRows);
  const currentPeriodAveragePerVisitAmount = calculateAveragePerVisitAmount(
    currentPeriodRevenue,
    totalExecutedRounds,
  );
  const previousPeriodAveragePerVisitAmount = calculateAveragePerVisitAmount(
    previousPeriodRevenue,
    countExecutedRounds(previousGuidanceRows),
  );
  const currentPeriodRevenuePerEmployee =
    userLoadRows.length > 0 ? currentPeriodRevenue / userLoadRows.length : 0;
  const previousPeriodRevenuePerEmployee =
    userLoadRows.length > 0 ? previousPeriodRevenue / userLoadRows.length : 0;

  const monthWindow = buildAnalyticsComparisonWindow('month', today);
  const quarterWindow = buildAnalyticsComparisonWindow('quarter', today);
  const yearWindow = buildAnalyticsComparisonWindow('year', today);

  const monthRevenue = sumVisitRevenue(
    scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, monthWindow.current)),
  );
  const previousMonthRevenue = sumVisitRevenue(
    scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, monthWindow.previous)),
  );
  const quarterRevenue = sumVisitRevenue(
    scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, quarterWindow.current)),
  );
  const previousQuarterRevenue = sumVisitRevenue(
    scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, quarterWindow.previous)),
  );
  const yearRevenue = sumVisitRevenue(
    scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, yearWindow.current)),
  );
  const previousYearRevenue = sumVisitRevenue(
    scopedGuidanceRows.filter((row) => isWithinDateRange(row.reportDate, yearWindow.previous)),
  );

  const employeeRows: AdminAnalyticsEmployeeRow[] = data.users
    .map((user) => {
      const userCurrentRows = queriedDetailRows.filter((row) => row.assigneeUserId === user.id);
      const userCurrentGuidanceRows = queriedDetailGuidanceRows.filter(
        (row) => row.assigneeUserId === user.id,
      );
      const userPreviousGuidanceRows = queriedPreviousGuidanceRows.filter(
        (row) => row.assigneeUserId === user.id,
      );
      const fallbackAssignedSiteIds = Array.from(
        assignedSiteIdsByUser.get(user.id) ?? new Set<string>(),
      ).filter((siteId) => visibleSiteIds.has(siteId));
      const queriedSiteIds = Array.from(new Set(userCurrentRows.map((row) => row.siteId)));
      const assignedSiteIds =
        normalizedQuery && queriedSiteIds.length > 0 ? queriedSiteIds : fallbackAssignedSiteIds;
      const totalAssignedRoundsForUser = assignedSiteIds.reduce((sum, siteId) => {
        const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
        return sum + (profile.totalRounds ?? 0);
      }, 0);
      const visitRevenue = sumVisitRevenue(userCurrentGuidanceRows);
      const executedRounds = countExecutedRounds(userCurrentGuidanceRows);
      const previousRevenue = sumVisitRevenue(userPreviousGuidanceRows);
      const shouldInclude =
        filters.userId === user.id ||
        assignedSiteIds.length > 0 ||
        userCurrentRows.length > 0 ||
        userCurrentGuidanceRows.length > 0 ||
        userCurrentRows.some((row) => row.isOverdue);

      return shouldInclude
        ? {
            assignedSiteCount: assignedSiteIds.length,
            avgPerVisitAmount: calculateAveragePerVisitAmount(visitRevenue, executedRounds),
            completionRate:
              totalAssignedRoundsForUser > 0 ? executedRounds / totalAssignedRoundsForUser : 0,
            overdueCount: userCurrentRows.filter((row) => row.isOverdue).length,
            primaryContractTypeLabel: resolvePrimaryContractTypeLabel(
              assignedSiteIds.length > 0
                ? assignedSiteIds
                : Array.from(new Set(userCurrentRows.map((row) => row.siteId))),
              sitesById,
            ),
            revenueChangeRate: comparisonWindow.previous
              ? calculateChangeRate(visitRevenue, previousRevenue)
              : null,
            totalAssignedRounds: totalAssignedRoundsForUser,
            userId: user.id,
            userName: user.name,
            visitRevenue,
            executedRounds,
          }
        : null;
    })
    .filter((row): row is AdminAnalyticsEmployeeRow => Boolean(row));

  const siteRevenueRows: AdminAnalyticsSiteRevenueRow[] = visibleSites
    .map((site) => {
      const currentGuidanceRows = queriedDetailGuidanceRows.filter((row) => row.siteId === site.id);
      const profile = parseSiteContractProfile(site);
      const visitRevenue = sumVisitRevenue(currentGuidanceRows);
      const executedRounds = countExecutedRounds(currentGuidanceRows);
      const contractTypeLabel = getContractTypeDisplayLabel(profile.contractType);
      const matchesQuery = normalizedQuery
        ? matchesAnalyticsQuery(
            {
              contractTypeLabel,
              headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
              siteName: site.site_name,
            },
            normalizedQuery,
          )
        : true;

      return {
        avgPerVisitAmount: calculateAveragePerVisitAmount(visitRevenue, executedRounds),
        contractTypeLabel,
        executedRounds,
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
        href: getAdminSectionHref('headquarters', {
          headquarterId: site.headquarter_id,
          siteId: site.id,
        }),
        matchesQuery,
        siteId: site.id,
        siteName: site.site_name,
        visitRevenue,
      };
    })
    .filter((row) => {
      if (normalizedQuery) {
        return row.matchesQuery || queriedDetailRows.some((item) => item.siteId === row.siteId);
      }
      return row.executedRounds > 0 || row.visitRevenue > 0;
    })
    .map((row) => ({
      avgPerVisitAmount: row.avgPerVisitAmount,
      contractTypeLabel: row.contractTypeLabel,
      executedRounds: row.executedRounds,
      headquarterName: row.headquarterName,
      href: row.href,
      siteId: row.siteId,
      siteName: row.siteName,
      visitRevenue: row.visitRevenue,
    }));

  const contractTypeRows = visibleSites
    .reduce((accumulator, site) => {
      const profile = parseSiteContractProfile(site);
      const key = profile.contractType || '';
      if (!accumulator.has(key)) {
        accumulator.set(key, []);
      }
      accumulator.get(key)?.push(site);
      return accumulator;
    }, new Map<string, typeof visibleSites>())
    .entries();

  const totalContractTypeRevenue = sumVisitRevenue(detailGuidanceRows);
  const normalizedContractTypeRows: AdminAnalyticsContractTypeRow[] = Array.from(contractTypeRows)
    .map(([key, sites]) => {
      const guidanceRows = detailGuidanceRows.filter(
        (row) => (row.contractProfile.contractType || '') === key,
      );
      const visitRevenue = sumVisitRevenue(guidanceRows);
      const executedRounds = countExecutedRounds(guidanceRows);
      const perVisitAmounts = sites
        .map((site) => parseSiteContractProfile(site).perVisitAmount)
        .filter((value): value is number => typeof value === 'number' && value > 0);

      return {
        avgPerVisitAmount:
          perVisitAmounts.length > 0
            ? perVisitAmounts.reduce((sum, value) => sum + value, 0) / perVisitAmounts.length
            : 0,
        executedRounds,
        label: getContractTypeDisplayLabel(key),
        siteCount: sites.length,
        shareRate: totalContractTypeRevenue > 0 ? visitRevenue / totalContractTypeRevenue : 0,
        totalContractAmount: sites.reduce((sum, site) => {
          const profile = parseSiteContractProfile(site);
          return sum + (profile.totalContractAmount ?? 0);
        }, 0),
        visitRevenue,
      };
    })
    .filter((row) => row.siteCount > 0)
    .sort(
      (left, right) =>
        right.visitRevenue - left.visitRevenue ||
        right.executedRounds - left.executedRounds ||
        left.label.localeCompare(right.label, 'ko'),
    );

  const includedRevenueSites = visibleSites.filter((site) => hasRevenueProfile(parseSiteContractProfile(site)));
  const stats: AdminAnalyticsStats = {
    averagePerVisitAmount: currentPeriodAveragePerVisitAmount,
    completionRate: totalAssignedRounds > 0 ? totalExecutedRounds / totalAssignedRounds : 0,
    countedSiteCount: includedRevenueSites.length,
    delayRate: detailRows.length > 0 ? totalOverdueCount / detailRows.length : 0,
    excludedSiteCount: visibleSites.length - includedRevenueSites.length,
    includedEmployeeCount: userLoadRows.length,
    overdueCount: totalOverdueCount,
    totalExecutedRounds,
    totalVisitRevenue,
  };

  return {
    contractTypeRows: normalizedContractTypeRows,
    employeeRows,
    siteRevenueRows,
    stats,
    summaryCards: [
      {
        deltaLabel: monthWindow.changeLabel,
        deltaTone: getDeltaTone(calculateChangeRate(monthRevenue, previousMonthRevenue)),
        deltaValue: formatDeltaValue(calculateChangeRate(monthRevenue, previousMonthRevenue)),
        label: '이번 달 매출',
        meta: '완료 회차 기준',
        value: formatCurrencyValue(monthRevenue),
      },
      {
        deltaLabel: quarterWindow.changeLabel,
        deltaTone: getDeltaTone(calculateChangeRate(quarterRevenue, previousQuarterRevenue)),
        deltaValue: formatDeltaValue(calculateChangeRate(quarterRevenue, previousQuarterRevenue)),
        label: '이번 분기 매출',
        meta: '완료 회차 기준',
        value: formatCurrencyValue(quarterRevenue),
      },
      {
        deltaLabel: yearWindow.changeLabel,
        deltaTone: getDeltaTone(calculateChangeRate(yearRevenue, previousYearRevenue)),
        deltaValue: formatDeltaValue(calculateChangeRate(yearRevenue, previousYearRevenue)),
        label: '올해 누적 매출',
        meta: '완료 회차 기준',
        value: formatCurrencyValue(yearRevenue),
      },
      {
        deltaLabel: comparisonWindow.changeLabel,
        deltaTone: getDeltaTone(
          comparisonWindow.previous
            ? calculateChangeRate(
                currentPeriodAveragePerVisitAmount,
                previousPeriodAveragePerVisitAmount,
              )
            : null,
        ),
        deltaValue: formatDeltaValue(
          comparisonWindow.previous
            ? calculateChangeRate(
                currentPeriodAveragePerVisitAmount,
                previousPeriodAveragePerVisitAmount,
              )
            : null,
        ),
        label: '평균 회차 단가',
        meta: `${getCurrentWindowLabel(filters.period)} · 완료 회차 기준`,
        value: formatCurrencyValue(currentPeriodAveragePerVisitAmount),
      },
      {
        deltaLabel: comparisonWindow.changeLabel,
        deltaTone: getDeltaTone(
          comparisonWindow.previous
            ? calculateChangeRate(
                currentPeriodRevenuePerEmployee,
                previousPeriodRevenuePerEmployee,
              )
            : null,
        ),
        deltaValue: formatDeltaValue(
          comparisonWindow.previous
            ? calculateChangeRate(
                currentPeriodRevenuePerEmployee,
                previousPeriodRevenuePerEmployee,
              )
            : null,
        ),
        label: '직원 1인당 매출',
        meta: `${getCurrentWindowLabel(filters.period)} · 완료 회차 기준`,
        value: formatCurrencyValue(currentPeriodRevenuePerEmployee),
      },
    ],
    trendRows: buildTrendRows(scopedGuidanceRows, today),
  };
}

export function getAnalyticsExportSheets(model: AdminAnalyticsModel) {
  return [
    {
      name: '요약',
      columns: [
        { key: 'label', label: '항목' },
        { key: 'value', label: '값' },
        { key: 'meta', label: '기준' },
        { key: 'deltaLabel', label: '비교 기준' },
        { key: 'deltaValue', label: '증감' },
      ],
      rows: model.summaryCards.map((card) => ({
        deltaLabel: card.deltaLabel,
        deltaValue: card.deltaValue,
        label: card.label,
        meta: card.meta,
        value: card.value,
      })),
    },
    {
      name: '월별 추이',
      columns: [
        { key: 'monthKey', label: '월' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
        { key: 'executedRounds', label: '실행 회차' },
      ],
      rows: model.trendRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        executedRounds: `${row.executedRounds}회`,
        monthKey: row.monthKey,
        visitRevenue: formatCurrencyValue(row.revenue),
      })),
    },
    {
      name: '직원별 매출',
      columns: [
        { key: 'userName', label: '직원명' },
        { key: 'assignedSiteCount', label: '운영 현장 수' },
        { key: 'executedRounds', label: '실행 회차' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
        { key: 'overdueCount', label: '지연 건수' },
        { key: 'completionRate', label: '완료율' },
        { key: 'revenueChangeRate', label: '전기 대비' },
        { key: 'primaryContractTypeLabel', label: '대표 계약유형' },
      ],
      rows: model.employeeRows.map((row) => ({
        assignedSiteCount: row.assignedSiteCount,
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        completionRate: formatAnalyticsStatValue('percent', row.completionRate),
        executedRounds: row.executedRounds,
        overdueCount: row.overdueCount,
        primaryContractTypeLabel: row.primaryContractTypeLabel,
        revenueChangeRate: formatDeltaValue(row.revenueChangeRate),
        userName: row.userName,
        visitRevenue: formatCurrencyValue(row.visitRevenue),
      })),
    },
    {
      name: '현장별 매출',
      columns: [
        { key: 'siteName', label: '현장명' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'contractTypeLabel', label: '계약유형' },
        { key: 'executedRounds', label: '실행 회차' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
      ],
      rows: model.siteRevenueRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        contractTypeLabel: row.contractTypeLabel,
        executedRounds: row.executedRounds,
        headquarterName: row.headquarterName,
        siteName: row.siteName,
        visitRevenue: formatCurrencyValue(row.visitRevenue),
      })),
    },
    {
      name: '계약유형',
      columns: [
        { key: 'label', label: '계약유형' },
        { key: 'siteCount', label: '현장 수' },
        { key: 'executedRounds', label: '회차 수' },
        { key: 'visitRevenue', label: '매출' },
        { key: 'totalContractAmount', label: '총 계약금액' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
        { key: 'shareRate', label: '매출 비중' },
      ],
      rows: model.contractTypeRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        executedRounds: `${row.executedRounds}회`,
        label: row.label,
        shareRate: formatAnalyticsStatValue('percent', row.shareRate),
        siteCount: row.siteCount,
        totalContractAmount: formatCurrencyValue(row.totalContractAmount),
        visitRevenue: formatCurrencyValue(row.visitRevenue),
      })),
    },
  ];
}

export function getOverviewExportSheets(model: AdminOverviewModel) {
  return [
    {
      name: 'overview',
      columns: [
        { key: 'label', label: '항목' },
        { key: 'value', label: '값' },
        { key: 'meta', label: '기준' },
      ],
      rows: model.summaryRows,
    },
    {
      name: 'site-status',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'count', label: '현장 수' },
      ],
      rows: model.siteStatusSummary.entries.map((entry) => ({
        count: entry.count,
        label: entry.label,
      })),
    },
    {
      name: 'deadline-signal-status',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'count', label: '보고서 수' },
      ],
      rows: model.deadlineSignalSummary.entries.map((entry) => ({
        count: entry.count,
        label: entry.label,
      })),
    },
    {
      name: 'quarterly-material-status',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'count', label: '현장 수' },
      ],
      rows: model.quarterlyMaterialSummary.entries.map((entry) => ({
        count: entry.count,
        label: entry.label,
      })),
    },
    {
      name: 'quarterly-material-missing-sites',
      columns: [
        { key: 'siteName', label: '현장' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'quarterLabel', label: '분기' },
        { key: 'educationStatus', label: '교육 현황' },
        { key: 'measurementStatus', label: '계측 현황' },
        { key: 'educationMissing', label: '교육 부족' },
        { key: 'measurementMissing', label: '계측 부족' },
        { key: 'missingTotal', label: '총 부족' },
      ],
      rows: model.quarterlyMaterialSummary.missingSiteRows.map((row) => ({
        educationStatus: `${row.education.filledCount}/${row.education.requiredCount}`,
        educationMissing: `${row.education.missingCount}건`,
        headquarterName: row.headquarterName,
        measurementStatus: `${row.measurement.filledCount}/${row.measurement.requiredCount}`,
        measurementMissing: `${row.measurement.missingCount}건`,
        missingTotal: `${row.education.missingCount + row.measurement.missingCount}건`,
        quarterLabel: row.quarterLabel,
        siteName: row.siteName,
      })),
    },
    {
      name: 'unsent-reports',
      columns: [
        { key: 'siteName', label: '현장' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'reportTitle', label: '보고서' },
        { key: 'reportTypeLabel', label: '유형' },
        { key: 'assigneeName', label: '담당자' },
        { key: 'visitDate', label: '지도 실시일' },
        { key: 'unsentDays', label: '미발송 경과일' },
        { key: 'deadlineDate', label: '발송 기준일' },
        { key: 'dispatchStatus', label: '상태' },
      ],
      rows: model.unsentReportRows.map((row) => ({
        assigneeName: row.assigneeName,
        deadlineDate: row.deadlineDate,
        dispatchStatus: getDispatchStatusLabel(row.dispatchStatus),
        headquarterName: row.headquarterName,
        reportTitle: row.reportTitle,
        reportTypeLabel: row.reportTypeLabel,
        siteName: row.siteName,
        unsentDays: `D+${row.unsentDays}`,
        visitDate: row.visitDate,
      })),
    },
  ];
}

export function formatAnalyticsStatValue(
  label: 'currency' | 'percent' | 'count',
  value: number,
) {
  if (label === 'currency') {
    return formatCurrencyValue(value);
  }

  if (label === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }

  return `${value.toLocaleString('ko-KR')}건`;
}
