import {
  getDispatchStatusLabel,
  normalizeControllerReportType,
  normalizeControllerReview,
  normalizeDispatchMeta,
} from '@/lib/admin/reportMeta';
import {
  applyControllerReportRowStatus,
  applyReportLifecycleStatus,
  isVisibleReport,
} from '@/lib/admin/lifecycleStatus';
import { getQuarterlyReportPeriodLabel } from '@/lib/erpReports/shared';
import { asMapperRecord, normalizeMapperText } from '@/lib/safetyApiMappers/utils';
import type {
  ControllerReportRow,
  ControllerReportType,
} from '@/types/admin';
import type { SafetyReportListItem, SafetySite, SafetyUser } from '@/types/backend';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = normalizeMapperText(value);
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
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

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

function getDaysSince(value: string | null | undefined): number | null {
  const parsed = parseDateValue(value);
  if (!parsed) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - parsed.getTime()) / DAY_IN_MS);
}

function resolveQuarterlyDispatchState(
  visitDate: string | null | undefined,
  updatedAt: string,
  deliveryStatus: string | null | undefined,
): Pick<ControllerReportRow, 'deadlineDate' | 'dispatchStatus'> {
  const baseDate = visitDate || updatedAt.slice(0, 10);
  const deadlineDate = addDays(baseDate, 7);

  if (deliveryStatus === 'sent' || deliveryStatus === 'manual_checked') {
    return {
      deadlineDate,
      dispatchStatus: 'sent',
    };
  }

  const daysSinceVisit = getDaysSince(baseDate);
  if (daysSinceVisit == null) {
    return {
      deadlineDate,
      dispatchStatus: '',
    };
  }

  return {
    deadlineDate,
    dispatchStatus:
      daysSinceVisit >= 7 ? 'overdue' : daysSinceVisit >= 4 ? 'warning' : 'normal',
  };
}

function getSiteName(site: SafetySite | null | undefined, report: SafetyReportListItem) {
  return normalizeMapperText(site?.site_name) || normalizeMapperText(report.report_title) || '현장 미상';
}

function getHeadquarterName(site: SafetySite | null | undefined) {
  return (
    normalizeMapperText(site?.headquarter_detail?.name) ||
    normalizeMapperText(site?.headquarter?.name)
  );
}

function getAssigneeName(
  site: SafetySite | null | undefined,
  usersById: Map<string, SafetyUser>,
  assignedUserId: string | null | undefined,
  meta: Record<string, unknown>,
) {
  return (
    normalizeMapperText((assignedUserId ? usersById.get(assignedUserId)?.name : '') || '') ||
    normalizeMapperText(meta.drafter) ||
    normalizeMapperText(meta.reporterName) ||
    normalizeMapperText(site?.assigned_user?.name) ||
    normalizeMapperText(site?.assigned_users?.[0]?.name)
  );
}

function getPeriodLabel(type: ControllerReportType, meta: Record<string, unknown>) {
  if (type !== 'quarterly_report') {
    return '';
  }

  return getQuarterlyReportPeriodLabel({
    periodStartDate: normalizeMapperText(meta.periodStartDate),
    periodEndDate: normalizeMapperText(meta.periodEndDate),
    quarterKey: normalizeMapperText(meta.quarterKey),
    year:
      typeof meta.year === 'number' && Number.isFinite(meta.year) ? meta.year : 0,
    quarter:
      typeof meta.quarter === 'number' && Number.isFinite(meta.quarter) ? meta.quarter : 0,
  });
}

function getRouteParam(type: ControllerReportType, reportKey: string, meta: Record<string, unknown>) {
  if (type === 'bad_workplace') {
    return normalizeMapperText(meta.reportMonth) || reportKey;
  }

  if (type === 'quarterly_report') {
    return normalizeMapperText(meta.quarterKey) || reportKey;
  }

  return reportKey;
}

export function buildControllerReportRows(
  reports: SafetyReportListItem[],
  sites: SafetySite[],
  users: SafetyUser[],
): ControllerReportRow[] {
  const normalizedReports = reports
    .map((report) => applyReportLifecycleStatus(report))
    .filter((report) => isVisibleReport(report));
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const usersById = new Map(users.map((user) => [user.id, user]));

  return normalizedReports.map((report) => {
    const meta = asMapperRecord(report.meta);
    const type = normalizeControllerReportType(report.report_type || meta.reportKind);
    const site = siteById.get(report.site_id) ?? null;
    const controllerReview = normalizeControllerReview(report.review || meta.controllerReview);
    const dispatch = normalizeDispatchMeta(report.dispatch || meta.dispatch);
    const assigneeUserId =
      normalizeMapperText(report.assigned_user_id) ||
      normalizeMapperText(meta.reporterUserId) ||
      normalizeMapperText(site?.assigned_user?.id) ||
      normalizeMapperText(site?.assigned_users?.[0]?.id);
    const siteName = getSiteName(site, report);
    const headquarterName = getHeadquarterName(site);
    const periodLabel = getPeriodLabel(type, meta);
    const routeParam = getRouteParam(type, report.report_key, meta);
    const effectiveDispatch: Pick<ControllerReportRow, 'deadlineDate' | 'dispatchStatus'> =
      type === 'quarterly_report'
        ? resolveQuarterlyDispatchState(
            report.visit_date,
            report.updated_at,
            dispatch?.dispatchStatus,
          )
        : {
            deadlineDate: addDays(report.visit_date || report.updated_at.slice(0, 10), 7),
            dispatchStatus:
              dispatch?.dispatchStatus === 'sent' || dispatch?.dispatchStatus === 'manual_checked'
                ? 'sent'
                : '',
          };

    return applyControllerReportRowStatus({
      assigneeName: getAssigneeName(site, usersById, assigneeUserId, meta),
      assigneeUserId,
      checkerUserId: controllerReview?.checkerUserId || '',
      deadlineDate: effectiveDispatch.deadlineDate,
      dispatchStatus: effectiveDispatch.dispatchStatus,
      dispatchSignal: effectiveDispatch.dispatchStatus,
      headquarterId: normalizeMapperText(site?.headquarter_id) || normalizeMapperText(report.headquarter_id),
      headquarterName,
      lifecycleStatus: report.lifecycle_status,
      qualityStatus: controllerReview?.qualityStatus || 'unchecked',
      reportKey: report.report_key,
      reportType: type,
      siteId: report.site_id,
      siteName,
      status: report.status,
      updatedAt: report.updated_at,
      visitDate: normalizeMapperText(report.visit_date),
      controllerReview,
      dispatch,
      periodLabel,
      progressRate: typeof report.progress_rate === 'number' ? report.progress_rate : null,
      reportMonth: normalizeMapperText(meta.reportMonth),
      reportTitle: normalizeMapperText(report.report_title),
      routeParam,
      sortLabel:
        type === 'quarterly_report'
          ? `${siteName} ${periodLabel || report.report_key}`.trim()
          : `${siteName} ${report.report_title}`.trim(),
      workflowStatus: report.workflow_status || report.status,
    });
  });
}

export function buildControllerReportHref(row: ControllerReportRow): string {
  switch (row.reportType) {
    case 'quarterly_report':
      return `/sites/${encodeURIComponent(row.siteId)}/quarterly/${encodeURIComponent(row.routeParam)}`;
    case 'bad_workplace':
      return `/sites/${encodeURIComponent(row.siteId)}/bad-workplace/${encodeURIComponent(row.routeParam)}`;
    case 'technical_guidance':
    default:
      return `/sessions/${encodeURIComponent(row.reportKey)}`;
  }
}

export function getControllerReportTypeLabel(type: ControllerReportType): string {
  switch (type) {
    case 'quarterly_report':
      return '분기 보고서';
    case 'bad_workplace':
      return '불량사업장';
    case 'technical_guidance':
    default:
      return '지도보고서';
  }
}

export function getControllerReportDispatchLabel(row: ControllerReportRow): string {
  return row.reportType === 'quarterly_report'
    ? getDispatchStatusLabel(row.dispatchStatus)
    : '-';
}
