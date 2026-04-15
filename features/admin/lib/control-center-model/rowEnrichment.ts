import {
  buildControllerReportOpenHref,
  buildControllerReportRows,
} from '@/lib/admin/controllerReports';
import {
  applyReportLifecycleStatus,
  isClosedReport,
  isVisibleReport,
  normalizeHeadquarterLifecycleStatus,
  normalizeSiteLifecycleStatus,
} from '@/lib/admin/lifecycleStatus';
import { parseSiteContractProfile } from '@/lib/admin/siteContractProfile';
import type { ReportDispatchStatus, SiteContractProfile } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { addDays, addDaysToDate, getDaysDiff, getDaysUntil } from './dates';

export interface EnrichedControllerReportRow {
  assigneeName: string;
  assigneeUserId: string;
  checkerUserId: string;
  contractProfile: SiteContractProfile;
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
  routeParam: string;
  siteId: string;
  siteName: string;
  status: string;
  updatedAt: string;
  visitDate: string;
  visitRound: number | null;
  workflowStatus: import('@/types/backend').SafetyReportWorkflowStatus;
}

function buildReportDate(row: { reportMonth: string; updatedAt: string; visitDate: string }) {
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

export function resolveVisitDispatchState(
  visitDate: string,
  deadlineDate: string,
  dispatchStatus: ReportDispatchStatus,
  updatedAt: string,
  today: Date,
): { deadlineDate: string; dispatchStatus: ReportDispatchStatus } {
  const baseDate = visitDate || updatedAt.slice(0, 10);
  const normalizedDeadlineDate = deadlineDate || addDays(baseDate, 7);

  if (dispatchStatus === 'sent') {
    return { deadlineDate: normalizedDeadlineDate, dispatchStatus };
  }

  const daysSinceVisit = getDaysDiff(baseDate, today);
  if (daysSinceVisit == null) {
    return { deadlineDate: normalizedDeadlineDate, dispatchStatus };
  }

  return {
    deadlineDate: normalizedDeadlineDate,
    dispatchStatus: daysSinceVisit >= 7 ? 'overdue' : daysSinceVisit >= 4 ? 'warning' : 'normal',
  };
}

export function buildAssignedSiteIdsByUser(data: ControllerDashboardData) {
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

  data.assignments.filter((assignment) => assignment.is_active).forEach((assignment) => {
    assign(assignment.user_id, assignment.site_id);
  });
  data.sites.forEach((site) => {
    assign(site.assigned_user?.id, site.id);
    (site.assigned_users || []).forEach((user) => assign(user.id, site.id));
  });

  return siteIdsByUser;
}

export function buildDispatchActionableSiteIds(data: ControllerDashboardData) {
  const actionableHeadquarterIds = new Set(
    data.headquarters
      .filter((headquarter) => normalizeHeadquarterLifecycleStatus(headquarter) === 'active')
      .map((headquarter) => headquarter.id),
  );

  return new Set(
    data.sites
      .filter((site) => {
        const lifecycleStatus = normalizeSiteLifecycleStatus(site);
        if (lifecycleStatus === 'closed' || lifecycleStatus === 'deleted') return false;
        const headquarterId = site.headquarter_id?.trim() || '';
        return !headquarterId || actionableHeadquarterIds.has(headquarterId);
      })
      .map((site) => site.id),
  );
}

export function buildEnrichedRows(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  today: Date,
): EnrichedControllerReportRow[] {
  const visibleReports = reports
    .map((report) => applyReportLifecycleStatus(report))
    .filter((report) => isVisibleReport(report));
  const rows = buildControllerReportRows(visibleReports, data.sites, data.users).filter((row) =>
    isVisibleReport(row),
  );
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
    const isCompleted = isClosedReport(row);
    const isBadWorkplaceOverdue =
      row.reportType === 'bad_workplace' &&
      !isCompleted &&
      Boolean(badWorkplaceDeadline) &&
      (getDaysUntil(today, badWorkplaceDeadline) ?? 1) < 0;

    return {
      assigneeName: row.assigneeName,
      assigneeUserId: row.assigneeUserId,
      checkerUserId: row.checkerUserId,
      contractProfile,
      deadlineDate: quarterlyDispatch?.deadlineDate || row.deadlineDate,
      dispatchStatus: quarterlyDispatch?.dispatchStatus || row.dispatchStatus,
      headquarterId: row.headquarterId,
      headquarterName: row.headquarterName,
      href: buildControllerReportOpenHref(row),
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
      routeParam: row.routeParam,
      siteId: row.siteId,
      siteName: row.siteName,
      status: row.status,
      updatedAt: row.updatedAt,
      visitDate: row.visitDate,
      visitRound: sourceReport?.visit_round ?? null,
      workflowStatus: row.workflowStatus,
    };
  });
}
