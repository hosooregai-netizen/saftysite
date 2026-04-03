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
  hasSiteContractProfile,
  parseSiteContractProfile,
} from '@/lib/admin/siteContractProfile';
import type {
  ReportDispatchStatus,
  SiteContractProfile,
} from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const TRAINING_CONTENT_TYPES = new Set(['safety_news', 'disaster_case', 'campaign_template']);

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
  visitRound: number | null;
  totalRound: number | null;
  contractProfile: SiteContractProfile;
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

export interface AdminOverviewModel {
  coverageRows: AdminCoverageRow[];
  deadlineRows: AdminOverviewDeadlineRow[];
  metricCards: AdminOverviewMetricCard[];
  overdueSiteRows: AdminOverviewSiteAlertRow[];
  pendingReviewRows: AdminOverviewReviewRow[];
  summaryRows: Array<{ label: string; meta: string; value: string }>;
  workerLoadRows: AdminOverviewAgentRow[];
}

export interface AdminAnalyticsSummaryCard {
  label: string;
  meta: string;
  value: string;
}

export interface AdminAnalyticsEmployeeRow {
  assignedSiteCount: number;
  badWorkplaceSubmittedCount: number;
  completedReportCount: number;
  contractContributionRevenue: number;
  overdueCount: number;
  quarterlyCompletedCount: number;
  totalAssignedRounds: number;
  userId: string;
  userName: string;
  visitRevenue: number;
  executedRounds: number;
}

export interface AdminAnalyticsSiteRevenueRow {
  contractContributionRevenue: number;
  contractTypeLabel: string;
  executedRounds: number;
  headquarterName: string;
  href: string;
  siteName: string;
  visitRevenue: number;
}

export interface AdminAnalyticsContractTypeRow {
  avgPerVisitAmount: number;
  label: string;
  siteCount: number;
  totalContractAmount: number;
}

export interface AdminAnalyticsStats {
  averagePerVisitAmount: number;
  completionRate: number;
  countedSiteCount: number;
  delayRate: number;
  excludedSiteCount: number;
}

export interface AdminAnalyticsModel {
  contractTypeRows: AdminAnalyticsContractTypeRow[];
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  stats: AdminAnalyticsStats;
  summaryCards: AdminAnalyticsSummaryCard[];
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

function isCompletedStatus(status: string, progressRate: number | null) {
  return (
    status === 'submitted' ||
    status === 'published' ||
    status === 'archived' ||
    (typeof progressRate === 'number' && progressRate >= 100)
  );
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

function resolveQuarterlyDispatchState(
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
  const rows = buildControllerReportRows(reports, data.sites, data.users);
  const reportByKey = new Map(reports.map((report) => [report.report_key, report]));
  const siteById = new Map(data.sites.map((site) => [site.id, site]));

  return rows.map((row) => {
    const sourceReport = reportByKey.get(row.reportKey);
    const contractProfile = parseSiteContractProfile(siteById.get(row.siteId) ?? null);
    const quarterlyDispatch =
      row.reportType === 'quarterly_report'
        ? resolveQuarterlyDispatchState(
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
    const isCompleted = isCompletedStatus(row.status, row.progressRate);
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
      visitRound: sourceReport?.visit_round ?? null,
      totalRound: sourceReport?.total_round ?? contractProfile.totalRounds ?? null,
      contractProfile,
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

export function buildAdminOverviewModel(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  today = new Date(),
): AdminOverviewModel {
  const overviewRows = buildEnrichedRows(data, reports, today);
  const activeSites = data.sites.filter((site) => site.status === 'active');
  const quarterlyOverdueRows = overviewRows.filter(
    (row) => row.reportType === 'quarterly_report' && row.dispatchStatus === 'overdue',
  );
  const badWorkplaceOverdueRows = overviewRows.filter((row) => row.isBadWorkplaceOverdue);
  const issueRows = overviewRows.filter(
    (row) => row.qualityStatus === 'issue' || row.isOverdue,
  );
  const activeTrainingCount = data.contentItems.filter((item) =>
    TRAINING_CONTENT_TYPES.has(item.content_type),
  ).length;
  const activeMeasurementCount = data.contentItems.filter(
    (item) => item.content_type === 'measurement_template',
  ).length;
  const missingContractCount = activeSites.filter(
    (site) => !hasSiteContractProfile(parseSiteContractProfile(site)),
  ).length;
  const coverageRows: AdminCoverageRow[] = [
    {
      itemCount: activeTrainingCount,
      label: '교육자료',
      missingSiteCount: activeTrainingCount > 0 ? 0 : activeSites.length,
    },
    {
      itemCount: activeMeasurementCount,
      label: '계측자료',
      missingSiteCount: activeMeasurementCount > 0 ? 0 : activeSites.length,
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

  const metricCards: AdminOverviewMetricCard[] = [
    {
      href: getAdminSectionHref('headquarters'),
      label: '전체 현장 수',
      meta: '관리 대상 전체 현장',
      tone: 'default',
      value: `${data.sites.length}건`,
    },
    {
      href: getAdminSectionHref('headquarters'),
      label: '진행중',
      meta: '운영중 현장',
      tone: 'default',
      value: `${data.sites.filter((site) => site.status === 'active').length}건`,
    },
    {
      href: getAdminSectionHref('headquarters'),
      label: '미착수',
      meta: '준비중 현장',
      tone: 'default',
      value: `${data.sites.filter((site) => site.status === 'planned').length}건`,
    },
    {
      href: getAdminSectionHref('headquarters'),
      label: '종료',
      meta: '종료된 현장',
      tone: 'default',
      value: `${data.sites.filter((site) => site.status === 'closed').length}건`,
    },
    {
      href: getAdminSectionHref('reports', {
        dispatchStatus: 'overdue',
        reportType: 'quarterly_report',
      }),
      label: '분기 보고 발송 지연',
      meta: 'D+7 이상 미발송',
      tone: quarterlyOverdueRows.length > 0 ? 'danger' : 'default',
      value: `${quarterlyOverdueRows.length}건`,
    },
    {
      href: getAdminSectionHref('reports', { reportType: 'bad_workplace' }),
      label: '불량사업장 지연',
      meta: '월말 기준 지연 건',
      tone: badWorkplaceOverdueRows.length > 0 ? 'warning' : 'default',
      value: `${badWorkplaceOverdueRows.length}건`,
    },
    {
      href: getAdminSectionHref('reports', { qualityStatus: 'issue' }),
      label: '이슈 보고서 수',
      meta: '품질 이슈 또는 지연 포함',
      tone: issueRows.length > 0 ? 'warning' : 'default',
      value: `${issueRows.length}건`,
    },
    {
      href: getAdminSectionHref('content'),
      label: '교육자료 확보 부족',
      meta: `등록 ${activeTrainingCount}건`,
      tone: coverageRows[0]?.missingSiteCount ? 'warning' : 'default',
      value: `${coverageRows[0]?.missingSiteCount ?? 0}개 현장`,
    },
    {
      href: getAdminSectionHref('content'),
      label: '계측자료 확보 부족',
      meta: `등록 ${activeMeasurementCount}건`,
      tone: coverageRows[1]?.missingSiteCount ? 'warning' : 'default',
      value: `${coverageRows[1]?.missingSiteCount ?? 0}개 현장`,
    },
  ];

  return {
    coverageRows,
    deadlineRows,
    metricCards,
    overdueSiteRows,
    pendingReviewRows,
    summaryRows: metricCards.map((card) => ({
      label: card.label,
      meta: card.meta,
      value: card.value,
    })),
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
  const normalizedQuery = filters.query.trim().toLowerCase();
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

  const filteredRows = analyticsRows.filter((row) => {
    if (!visibleSiteIds.has(row.siteId)) return false;
    if (filters.userId && row.assigneeUserId !== filters.userId) return false;
    if (!isWithinPeriod(row.reportDate, filters.period, today)) return false;

    if (!normalizedQuery) return true;
    return [
      row.assigneeName,
      row.siteName,
      row.headquarterName,
      row.reportTitle,
      row.periodLabel,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const fixedWindowGuidanceRows = analyticsRows.filter(
    (row) =>
      row.reportType === 'technical_guidance' &&
      row.isCompleted &&
      visibleSiteIds.has(row.siteId) &&
      (!filters.userId || row.assigneeUserId === filters.userId),
  );
  const monthRevenue = fixedWindowGuidanceRows
    .filter((row) => isWithinPeriod(row.reportDate, 'month', today) && hasRevenueProfile(row.contractProfile))
    .reduce((sum, row) => sum + (row.contractProfile.perVisitAmount ?? 0), 0);
  const quarterRevenue = fixedWindowGuidanceRows
    .filter((row) => isWithinPeriod(row.reportDate, 'quarter', today) && hasRevenueProfile(row.contractProfile))
    .reduce((sum, row) => sum + (row.contractProfile.perVisitAmount ?? 0), 0);
  const yearRevenue = fixedWindowGuidanceRows
    .filter((row) => isWithinPeriod(row.reportDate, 'year', today) && hasRevenueProfile(row.contractProfile))
    .reduce((sum, row) => sum + (row.contractProfile.perVisitAmount ?? 0), 0);

  const employeeRows: AdminAnalyticsEmployeeRow[] = data.users
    .map((user) => {
      const userRows = filteredRows.filter((row) => row.assigneeUserId === user.id);
      const assignedSiteIds = Array.from(
        assignedSiteIdsByUser.get(user.id) ?? new Set<string>(),
      ).filter(
        (siteId) => visibleSiteIds.has(siteId),
      );
      const completedGuidanceRows = userRows.filter(
        (row) => row.reportType === 'technical_guidance' && row.isCompleted,
      );
      const completedRoundKeys = buildCompletedRoundKeys(completedGuidanceRows);
      const visitRevenue = completedGuidanceRows.reduce(
        (sum, row) =>
          sum + (hasRevenueProfile(row.contractProfile) ? row.contractProfile.perVisitAmount ?? 0 : 0),
        0,
      );

      const contributionBySite = completedGuidanceRows.reduce((accumulator, row) => {
        const key = row.siteId;
        const current = accumulator.get(key) ?? 0;
        accumulator.set(key, current + 1);
        return accumulator;
      }, new Map<string, number>());

      const contractContributionRevenue = Array.from(contributionBySite.entries()).reduce(
        (sum, [siteId, completedRounds]) => {
          const site = sitesById.get(siteId);
          const profile = parseSiteContractProfile(site ?? null);
          if (!site || !profile.totalContractAmount || !profile.totalRounds) return sum;
          return sum + profile.totalContractAmount * (completedRounds / profile.totalRounds);
        },
        0,
      );

      const totalAssignedRounds = assignedSiteIds.reduce((sum, siteId) => {
        const profile = parseSiteContractProfile(sitesById.get(siteId) ?? null);
        return sum + (profile.totalRounds ?? 0);
      }, 0);

      return {
        assignedSiteCount: assignedSiteIds.length,
        badWorkplaceSubmittedCount: userRows.filter(
          (row) => row.reportType === 'bad_workplace' && row.isCompleted,
        ).length,
        completedReportCount: userRows.filter((row) => row.isCompleted).length,
        contractContributionRevenue,
        overdueCount: userRows.filter((row) => row.isOverdue).length,
        quarterlyCompletedCount: userRows.filter(
          (row) => row.reportType === 'quarterly_report' && row.isCompleted,
        ).length,
        totalAssignedRounds,
        userId: user.id,
        userName: user.name,
        visitRevenue,
        executedRounds: completedRoundKeys.size,
      };
    })
    .filter((row) => {
      if (!filters.userId) return true;
      return row.userId === filters.userId;
    });

  const visibleSites = data.sites.filter((site) => visibleSiteIds.has(site.id));
  const siteRevenueRows: AdminAnalyticsSiteRevenueRow[] = visibleSites
    .map((site) => {
      const siteRows = filteredRows.filter(
        (row) => row.siteId === site.id && row.reportType === 'technical_guidance' && row.isCompleted,
      );
      const completedRoundKeys = buildCompletedRoundKeys(siteRows);
      const profile = parseSiteContractProfile(site);
      const visitRevenue =
        hasRevenueProfile(profile) && profile.perVisitAmount
          ? profile.perVisitAmount * completedRoundKeys.size
          : 0;
      const contractContributionRevenue =
        profile.totalContractAmount && profile.totalRounds
          ? profile.totalContractAmount * (completedRoundKeys.size / profile.totalRounds)
          : 0;

      return {
        contractContributionRevenue,
        contractTypeLabel: SITE_CONTRACT_TYPE_LABELS[profile.contractType] || '미입력',
        executedRounds: completedRoundKeys.size,
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
        href: getAdminSectionHref('headquarters', {
          headquarterId: site.headquarter_id,
          siteId: site.id,
        }),
        siteName: site.site_name,
        visitRevenue,
      };
    })
    .filter(
      (row) =>
        !normalizedQuery ||
        [row.siteName, row.headquarterName, row.contractTypeLabel]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
    );

  const contractTypeMap = new Map<
    string,
    { perVisitAmounts: number[]; siteCount: number; totalContractAmount: number }
  >();
  visibleSites.forEach((site) => {
    const profile = parseSiteContractProfile(site);
    const key = profile.contractType || '';
    const current = contractTypeMap.get(key) ?? {
      perVisitAmounts: [],
      siteCount: 0,
      totalContractAmount: 0,
    };

    current.siteCount += 1;
    current.totalContractAmount += profile.totalContractAmount ?? 0;
    if (profile.perVisitAmount != null) {
      current.perVisitAmounts.push(profile.perVisitAmount);
    }
    contractTypeMap.set(key, current);
  });

  const contractTypeRows: AdminAnalyticsContractTypeRow[] = Array.from(contractTypeMap.entries())
    .map(([key, value]) => ({
      avgPerVisitAmount:
        value.perVisitAmounts.length > 0
          ? value.perVisitAmounts.reduce((sum, amount) => sum + amount, 0) /
            value.perVisitAmounts.length
          : 0,
      label: SITE_CONTRACT_TYPE_LABELS[key as keyof typeof SITE_CONTRACT_TYPE_LABELS] || '미입력',
      siteCount: value.siteCount,
      totalContractAmount: value.totalContractAmount,
    }))
    .sort((left, right) => right.totalContractAmount - left.totalContractAmount);

  const includedRevenueSites = visibleSites.filter((site) =>
    hasRevenueProfile(parseSiteContractProfile(site)),
  );
  const summaryRows = employeeRows.filter(
    (row) => !filters.userId || row.userId === filters.userId,
  );
  const totalVisitRevenue = summaryRows.reduce((sum, row) => sum + row.visitRevenue, 0);
  const totalAssignedRounds = summaryRows.reduce((sum, row) => sum + row.totalAssignedRounds, 0);
  const totalExecutedRounds = summaryRows.reduce((sum, row) => sum + row.executedRounds, 0);
  const totalOverdueCount = summaryRows.reduce((sum, row) => sum + row.overdueCount, 0);
  const totalCompletedReportCount = summaryRows.reduce(
    (sum, row) => sum + row.completedReportCount,
    0,
  );

  const stats: AdminAnalyticsStats = {
    averagePerVisitAmount:
      includedRevenueSites.length > 0
        ? includedRevenueSites.reduce((sum, site) => {
            const profile = parseSiteContractProfile(site);
            return sum + (profile.perVisitAmount ?? 0);
          }, 0) / includedRevenueSites.length
        : 0,
    completionRate: totalAssignedRounds > 0 ? totalExecutedRounds / totalAssignedRounds : 0,
    countedSiteCount: includedRevenueSites.length,
    delayRate: filteredRows.length > 0 ? totalOverdueCount / filteredRows.length : 0,
    excludedSiteCount: visibleSites.length - includedRevenueSites.length,
  };

  return {
    contractTypeRows,
    employeeRows,
    siteRevenueRows,
    stats,
    summaryCards: [
      {
        label: '이번 달 매출',
        meta: '완료 회차 기준',
        value: formatCurrencyValue(monthRevenue),
      },
      {
        label: '이번 분기 매출',
        meta: '완료 회차 기준',
        value: formatCurrencyValue(quarterRevenue),
      },
      {
        label: '올해 누적 매출',
        meta: '완료 회차 기준',
        value: formatCurrencyValue(yearRevenue),
      },
      {
        label: '직원 1인당 평균 매출',
        meta: filters.userId ? '선택 요원 기준' : '현재 필터 기준',
        value: formatCurrencyValue(
          summaryRows.length > 0 ? totalVisitRevenue / summaryRows.length : 0,
        ),
      },
      {
        label: '완료 보고서 수',
        meta: '현재 필터 기준',
        value: `${totalCompletedReportCount}건`,
      },
      {
        label: '지연 보고서 수',
        meta: '현재 필터 기준',
        value: `${totalOverdueCount}건`,
      },
    ],
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
      ],
      rows: model.summaryCards.map((card) => ({
        label: card.label,
        meta: card.meta,
        value: card.value,
      })),
    },
    {
      name: '직원별 실적',
      columns: [
        { key: 'userName', label: '직원명' },
        { key: 'assignedSiteCount', label: '배정 현장 수' },
        { key: 'completedReportCount', label: '완료 보고서 수' },
        { key: 'quarterlyCompletedCount', label: '분기 보고 완료 수' },
        { key: 'badWorkplaceSubmittedCount', label: '불량사업장 제출 수' },
        { key: 'totalAssignedRounds', label: '총 회차 배정' },
        { key: 'executedRounds', label: '실행 회차' },
        { key: 'visitRevenue', label: '회차 매출' },
        { key: 'contractContributionRevenue', label: '총 계약 기여 매출' },
        { key: 'overdueCount', label: '지연 건수' },
      ],
      rows: model.employeeRows.map((row) => ({
        assignedSiteCount: row.assignedSiteCount,
        badWorkplaceSubmittedCount: row.badWorkplaceSubmittedCount,
        completedReportCount: row.completedReportCount,
        contractContributionRevenue: formatCurrencyValue(row.contractContributionRevenue),
        executedRounds: row.executedRounds,
        overdueCount: row.overdueCount,
        quarterlyCompletedCount: row.quarterlyCompletedCount,
        totalAssignedRounds: row.totalAssignedRounds,
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
        { key: 'visitRevenue', label: '회차 매출' },
        { key: 'contractContributionRevenue', label: '총 계약 기여 매출' },
      ],
      rows: model.siteRevenueRows.map((row) => ({
        contractContributionRevenue: formatCurrencyValue(row.contractContributionRevenue),
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
        { key: 'totalContractAmount', label: '총 계약금액' },
        { key: 'avgPerVisitAmount', label: '평균 회차 단가' },
      ],
      rows: model.contractTypeRows.map((row) => ({
        avgPerVisitAmount: formatCurrencyValue(row.avgPerVisitAmount),
        label: row.label,
        siteCount: row.siteCount,
        totalContractAmount: formatCurrencyValue(row.totalContractAmount),
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
      name: 'alerts',
      columns: [
        { key: 'siteName', label: '현장' },
        { key: 'headquarterName', label: '사업장' },
        { key: 'overdueCount', label: '지연 건수' },
        { key: 'reportKindsLabel', label: '지연 유형' },
      ],
      rows: model.overdueSiteRows.map((row) => ({
        headquarterName: row.headquarterName,
        overdueCount: row.overdueCount,
        reportKindsLabel: row.reportKindsLabel,
        siteName: row.siteName,
      })),
    },
    {
      name: 'coverage',
      columns: [
        { key: 'label', label: '구분' },
        { key: 'itemCount', label: '등록 수' },
        { key: 'missingSiteCount', label: '부족 현장 수' },
      ],
      rows: model.coverageRows.map((row) => ({
        itemCount: row.itemCount,
        label: row.label,
        missingSiteCount: row.missingSiteCount,
      })),
    },
    {
      name: 'deadlines',
      columns: [
        { key: 'siteName', label: '현장' },
        { key: 'reportTitle', label: '보고서' },
        { key: 'reportTypeLabel', label: '유형' },
        { key: 'deadlineDate', label: '마감일' },
        { key: 'deadlineLabel', label: '남은 기간' },
        { key: 'statusLabel', label: '상태' },
      ],
      rows: model.deadlineRows.map((row) => ({
        deadlineDate: row.deadlineDate,
        deadlineLabel: row.deadlineLabel,
        reportTitle: row.reportTitle,
        reportTypeLabel: row.reportTypeLabel,
        siteName: row.siteName,
        statusLabel: row.statusLabel,
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
