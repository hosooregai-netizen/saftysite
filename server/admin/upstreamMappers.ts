import { normalizeControllerReview, normalizeDispatchMeta } from '@/lib/admin/reportMeta';
import {
  applyControllerReportRowStatus,
  applyHeadquarterLifecycleStatus,
  applyReportLifecycleStatus,
  applySiteLifecycleStatus,
  isVisibleReport,
  normalizeHeadquarterLifecycleStatus,
  normalizeReportLifecycleStatus,
  normalizeReportWorkflowStatus,
  normalizeSiteLifecycleStatus,
} from '@/lib/admin/lifecycleStatus';
import {
  buildDeadlineSignalSummaryFromRows,
  compareDispatchManagementUnsentRows,
  getUnsentDays,
  isDispatchManagementUnsentRow,
  isPriorityQuarterlyManagementRowScope,
} from '@/features/admin/lib/control-center-model/overviewPolicies';
import type {
  ControllerReportRow,
  SafetyAdminAlert,
  SafetyAdminAnalyticsMonthDetailResponse,
  SafetyAdminAnalyticsSummaryResponse,
  SafetyAdminDirectoryLookupsResponse,
  SafetyAdminHeadquarterListResponse,
  SafetyAdminOverviewResponse,
  SafetyAdminPriorityQuarterlyManagementRow,
  SafetyAdminReportsResponse,
  SafetyAdminScheduleCalendarResponse,
  SafetyAdminScheduleListResponse,
  SafetyAdminScheduleLookupsResponse,
  SafetyAdminScheduleQueueResponse,
  SafetyAdminSiteListResponse,
  SafetyAdminUserListResponse,
  SafetyInspectionSchedule,
} from '@/types/admin';
import type {
  SafetyBackendAdminAlert,
  SafetyBackendAdminAnalyticsMonthDetailResponse,
  SafetyBackendAdminAnalyticsSummaryResponse,
  SafetyBackendAdminDirectoryLookupsResponse,
  SafetyBackendAdminHeadquarterListResponse,
  SafetyBackendAdminOverviewResponse,
  SafetyBackendAdminReportRow,
  SafetyBackendAdminReportsResponse,
  SafetyBackendAdminScheduleCalendarResponse,
  SafetyBackendAdminScheduleLookupsResponse,
  SafetyBackendAdminScheduleQueueResponse,
  SafetyBackendAdminSiteListResponse,
  SafetyBackendAdminUserListResponse,
  SafetyBackendInspectionSchedule,
  SafetyBackendExcelApplyResult,
  SafetyBackendExcelImportPreview,
  SafetyBackendMailAccount,
  SafetyBackendMailProviderStatus,
  SafetyBackendMailMessage,
  SafetyBackendMailThread,
  SafetyBackendMailThreadDetail,
  SafetyBackendPhotoAsset,
  SafetyBackendScheduleListResponse,
  SafetyBackendSmsMessage,
  SafetyBackendSmsProviderStatus,
  SafetyBackendSmsSendResponse,
  SafetySite,
} from '@/types/backend';
import type { MailAccount, MailMessage, MailProviderStatus, MailThread, MailThreadDetail } from '@/types/mail';
import type { SmsMessage, SmsProviderStatus, SmsSendResult } from '@/types/messages';
import type { PhotoAlbumItem, SafetyPhotoAsset } from '@/types/photos';
import type {
  ExcelApplyResult,
  ExcelImportPreview,
  ExcelImportPreviewRow,
  ExcelRowExclusionReasonCode,
  ExcelImportScopeSummary,
  ExcelMatchCandidate,
} from '@/types/excelImport';
import { normalizeSafetyAssetUrl } from '@/lib/safetyApi/assetUrls';
import { buildSafetyAdminUpstreamUrl } from './safetyApiServer';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCount(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBackendRecord<T extends Record<string, unknown>>(value: unknown): T | null {
  return value && typeof value === 'object' ? (value as T) : null;
}

function normalizeExcelRowExclusionReasonCode(
  value: unknown,
): ExcelRowExclusionReasonCode | null {
  const normalized = normalizeText(value);
  return normalized === 'different_headquarter' ||
    normalized === 'different_site' ||
    normalized === 'scope_unresolved' ||
    normalized === 'scope_ambiguous'
    ? normalized
    : null;
}

function mapBackendReview(row: SafetyBackendAdminReportRow) {
  return normalizeControllerReview(row.controller_review);
}

function mapBackendDispatch(row: SafetyBackendAdminReportRow) {
  return normalizeDispatchMeta(row.dispatch);
}

export function mapBackendAdminReportRow(
  row: SafetyBackendAdminReportRow,
): ControllerReportRow {
  const record = asBackendRecord<Partial<SafetyBackendAdminReportRow> & Record<string, unknown>>(row) ?? {};
  const reportKey = normalizeText(record.report_key);
  const originalPdfArchivePath = normalizeText(record.original_pdf_archive_path);
  const originalPdfDownloadPath = normalizeText(record.original_pdf_download_path);
  const originalPdfAvailable =
    Boolean(originalPdfArchivePath) || record.original_pdf_available === true;
  const dispatchSignal =
    (normalizeText(record.dispatch_signal) || normalizeText(record.dispatch_status) || '') as ControllerReportRow['dispatchStatus'];

  return applyControllerReportRowStatus({
    assigneeName: normalizeText(record.assignee_name),
    assigneeUserId: normalizeText(record.assignee_user_id),
    checkerUserId: normalizeText(record.checker_user_id),
    controllerReview: mapBackendReview(record as SafetyBackendAdminReportRow),
    deadlineDate: normalizeText(record.deadline_date),
    dispatch: mapBackendDispatch(record as SafetyBackendAdminReportRow),
    dispatchSignal,
    dispatchStatus: dispatchSignal,
    headquarterId: normalizeText(record.headquarter_id),
    headquarterName: normalizeText(record.headquarter_name),
    periodLabel: normalizeText(record.period_label),
    progressRate:
      typeof record.progress_rate === 'number' && Number.isFinite(record.progress_rate)
        ? record.progress_rate
        : null,
    qualityStatus: (normalizeText(record.quality_status) || 'unchecked') as ControllerReportRow['qualityStatus'],
    originalPdfAvailable,
    originalPdfDownloadPath: originalPdfAvailable
      ? originalPdfDownloadPath || `/api/admin/reports/${encodeURIComponent(reportKey)}/original-pdf`
      : '',
    reportKey,
    reportMonth: normalizeText(record.report_month),
    reportTitle: normalizeText(record.report_title),
    reportType: (normalizeText(record.report_type) || 'technical_guidance') as ControllerReportRow['reportType'],
    routeParam: normalizeText(record.route_param),
    siteId: normalizeText(record.site_id),
    siteName: normalizeText(record.site_name),
    sortLabel: normalizeText(record.sort_label),
    status: normalizeText(record.workflow_status) || normalizeText(record.status),
    updatedAt: normalizeText(record.updated_at),
    visitDate: normalizeText(record.visit_date),
    workflowStatus: normalizeText(record.workflow_status),
    lifecycleStatus: normalizeText(record.lifecycle_status),
  });
}

export function mapBackendAdminReportsResponse(
  response: SafetyBackendAdminReportsResponse,
): SafetyAdminReportsResponse {
  const rows = Array.isArray(response?.rows) ? response.rows : [];
  const mappedRows = rows
    .map((row) => {
      const mapped = mapBackendAdminReportRow(row);
      return mapped.reportKey ? mapped : null;
    })
    .filter((row): row is ControllerReportRow => Boolean(row))
    .filter((row) => isVisibleReport(row));

  return {
    limit: normalizeCount(response?.limit, mappedRows.length),
    offset: normalizeCount(response?.offset),
    rows: mappedRows,
    total: normalizeCount(response?.total, mappedRows.length),
  };
}

export {
  applyHeadquarterLifecycleStatus,
  applyReportLifecycleStatus,
  applySiteLifecycleStatus,
  normalizeHeadquarterLifecycleStatus,
  normalizeReportLifecycleStatus,
  normalizeReportWorkflowStatus,
  normalizeSiteLifecycleStatus,
};

export function mapBackendSchedule(
  row: SafetyBackendInspectionSchedule,
): SafetyInspectionSchedule {
  return {
    actualVisitDate: normalizeText(row.actual_visit_date),
    assigneeName: normalizeText(row.assignee_name),
    assigneeUserId: normalizeText(row.assignee_user_id),
    exceptionMemo: normalizeText(row.exception_memo),
    exceptionReasonCode: normalizeText(row.exception_reason_code),
    headquarterId: normalizeText(row.headquarter_id),
    headquarterName: normalizeText(row.headquarter_name),
    id: normalizeText(row.id),
    isConflicted: Boolean(row.is_conflicted),
    isOutOfWindow: Boolean(row.is_out_of_window),
    isOverdue: Boolean(row.is_overdue),
    linkedReportKey: normalizeText(row.linked_report_key),
    plannedDate: normalizeText(row.planned_date),
    roundNo: typeof row.round_no === 'number' ? row.round_no : 0,
    totalRounds:
      typeof row.total_rounds === 'number' && Number.isFinite(row.total_rounds)
        ? row.total_rounds
        : undefined,
    selectionConfirmedAt: normalizeText(row.selection_confirmed_at),
    selectionConfirmedByName: normalizeText(row.selection_confirmed_by_name),
    selectionConfirmedByUserId: normalizeText(row.selection_confirmed_by_user_id),
    selectionReasonLabel: normalizeText(row.selection_reason_label),
    selectionReasonMemo: normalizeText(row.selection_reason_memo),
    siteId: normalizeText(row.site_id),
    siteName: normalizeText(row.site_name),
    status: (normalizeText(row.status) || 'planned') as SafetyInspectionSchedule['status'],
    windowEnd: normalizeText(row.window_end),
    windowStart: normalizeText(row.window_start),
  };
}

export function mapBackendScheduleListResponse(
  response: SafetyBackendScheduleListResponse,
): SafetyAdminScheduleListResponse {
  return {
    limit: response.limit,
    month: normalizeText(response.month),
    offset: response.offset,
    rows: response.rows.map((row) => mapBackendSchedule(row)),
    total: response.total,
  };
}

export function mapBackendAdminUsersListResponse(
  response: SafetyBackendAdminUserListResponse,
): SafetyAdminUserListResponse {
  return {
    limit: response.limit,
    offset: response.offset,
    refreshedAt: normalizeText(response.refreshed_at),
    rows: response.rows.map((row) => ({
      auto_provisioned_from_excel: Boolean(row.auto_provisioned_from_excel),
      created_at: normalizeText(row.created_at),
      email: normalizeText(row.email),
      id: normalizeText(row.id),
      is_active: Boolean(row.is_active),
      last_login_at: normalizeText(row.last_login_at),
      name: normalizeText(row.name),
      organization_name: row.organization_name ?? null,
      phone: row.phone ?? null,
      position: row.position ?? null,
      role: row.role,
      updated_at: normalizeText(row.updated_at),
      assignedSites: Array.isArray(row.assigned_sites)
        ? row.assigned_sites.map((site) => ({
            id: normalizeText(site.id),
            siteName: normalizeText(site.site_name),
          }))
        : [],
    })),
    total: response.total,
  };
}

export function mapBackendAdminHeadquartersListResponse(
  response: SafetyBackendAdminHeadquarterListResponse,
): SafetyAdminHeadquarterListResponse {
  return {
    limit: response.limit,
    offset: response.offset,
    refreshedAt: normalizeText(response.refreshed_at),
    rows: response.rows.map((row) => applyHeadquarterLifecycleStatus(row)),
    summary: {
      completedCount: response.summary?.completed_count ?? 0,
      contactGapCount: response.summary?.contact_gap_count ?? 0,
      memoGapCount: response.summary?.memo_gap_count ?? 0,
      registrationGapCount: response.summary?.registration_gap_count ?? 0,
    },
    total: response.total,
  };
}

export function mapBackendAdminSitesListResponse(
  response: SafetyBackendAdminSiteListResponse,
): SafetyAdminSiteListResponse {
  return {
    limit: response.limit,
    offset: response.offset,
    refreshedAt: normalizeText(response.refreshed_at),
    rows: response.rows.map((row) => applySiteLifecycleStatus(row)),
    total: response.total,
  };
}

export function mapBackendAdminDirectoryLookupsResponse(
  response: SafetyBackendAdminDirectoryLookupsResponse,
): SafetyAdminDirectoryLookupsResponse {
  return {
    contractTypes: Array.isArray(response.contract_types)
      ? response.contract_types
          .map((row) => ({
            label: normalizeText(row.label),
            value: normalizeText(row.value),
          }))
          .filter((row) => row.value.length > 0)
      : [],
    headquarters: response.headquarters.map((row) => ({
      id: normalizeText(row.id),
      name: normalizeText(row.name),
    })),
    sites: response.sites.map((row) => ({
      headquarterId: normalizeText(row.headquarter_id),
      id: normalizeText(row.id),
      name: normalizeText(row.name),
    })),
    users: response.users.map((row) => ({
      email: normalizeText(row.email),
      id: normalizeText(row.id),
      isActive: Boolean(row.is_active),
      name: normalizeText(row.name),
      organizationName: row.organization_name ?? null,
      phone: row.phone ?? null,
      position: row.position ?? null,
      role: row.role,
    })),
  };
}

export function mapBackendAdminScheduleCalendarResponse(
  response: SafetyBackendAdminScheduleCalendarResponse,
): SafetyAdminScheduleCalendarResponse {
  return {
    allSelectedTotal: response.all_selected_total,
    availableMonths: Array.isArray(response.available_months)
      ? response.available_months.map((value) => normalizeText(value)).filter(Boolean)
      : [],
    month: normalizeText(response.month),
    monthTotal: response.month_total,
    refreshedAt: normalizeText(response.refreshed_at),
    rows: response.rows.map((row) => mapBackendSchedule(row)),
    unselectedTotal: response.unselected_total,
  };
}

export function mapBackendAdminScheduleQueueResponse(
  response: SafetyBackendAdminScheduleQueueResponse,
): SafetyAdminScheduleQueueResponse {
  return {
    limit: response.limit,
    month: normalizeText(response.month),
    offset: response.offset,
    refreshedAt: normalizeText(response.refreshed_at),
    rows: response.rows.map((row) => mapBackendSchedule(row)),
    total: response.total,
  };
}

export function mapBackendAdminScheduleLookupsResponse(
  response: SafetyBackendAdminScheduleLookupsResponse,
): SafetyAdminScheduleLookupsResponse {
  return {
    sites: response.sites.map((row) => ({
      id: normalizeText(row.id),
      name: normalizeText(row.name),
    })),
    users: response.users.map((row) => ({
      id: normalizeText(row.id),
      name: normalizeText(row.name),
    })),
  };
}

export function mapBackendAlert(alert: SafetyBackendAdminAlert): SafetyAdminAlert {
  return {
    createdAt: normalizeText(alert.created_at),
    description: normalizeText(alert.description),
    href: normalizeText(alert.href),
    id: normalizeText(alert.id),
    reportKey: normalizeText(alert.report_key),
    scheduleId: normalizeText(alert.schedule_id),
    severity: (normalizeText(alert.severity) || 'info') as SafetyAdminAlert['severity'],
    siteId: normalizeText(alert.site_id),
    title: normalizeText(alert.title),
    type: normalizeText(alert.type) as SafetyAdminAlert['type'],
  };
}

function mapBackendOverviewUnsentRows(
  rows: SafetyBackendAdminOverviewResponse['unsent_report_rows'],
  today: Date,
): SafetyAdminOverviewResponse['unsentReportRows'] {
  return rows
    .map((row) => {
      const referenceDate = normalizeText(row.reference_date) || normalizeText(row.visit_date);
      return {
        assigneeName: normalizeText(row.assignee_name),
        deadlineDate: normalizeText(row.deadline_date),
        dispatchStatus: (normalizeText(row.dispatch_status) ||
          '') as SafetyAdminOverviewResponse['unsentReportRows'][number]['dispatchStatus'],
        headquarterName: normalizeText(row.headquarter_name),
        href: normalizeText(row.href),
        referenceDate,
        reportKey: normalizeText(row.report_key),
        reportTitle: normalizeText(row.report_title),
        reportTypeLabel: normalizeText(row.report_type_label),
        siteId: normalizeText(row.site_id),
        siteName: normalizeText(row.site_name),
        unsentDays:
          typeof row.unsent_days === 'number' && Number.isFinite(row.unsent_days)
            ? row.unsent_days
            : getUnsentDays(referenceDate, today),
        visitDate: normalizeText(row.visit_date),
        mailMissingReason: normalizeText(row.mail_missing_reason),
        mailReady: Boolean(row.mail_ready),
        recipientEmail: normalizeText(row.recipient_email),
        recipientName: normalizeText(row.recipient_name),
      };
    })
    .filter(isDispatchManagementUnsentRow)
    .sort(compareDispatchManagementUnsentRows);
}

function formatCountLike(previousValue: string, count: number) {
  const normalized = normalizeText(previousValue);
  const suffix = normalized.replace(/^[\d,.\s]+/, '');
  return `${count.toLocaleString('ko-KR')}${suffix || '건'}`;
}

function isDispatchManagementLabel(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized.includes('발송') || normalized.includes('dispatch');
}

function syncDispatchMetricCards(
  cards: SafetyAdminOverviewResponse['metricCards'],
  dispatchManagementCount: number,
): SafetyAdminOverviewResponse['metricCards'] {
  if (cards.length === 0) return cards;
  const dispatchCardIndex = cards.findIndex((card) => isDispatchManagementLabel(card.label));
  const targetIndex = dispatchCardIndex >= 0 ? dispatchCardIndex : cards.length - 1;
  return cards.map((card, index) =>
    index === targetIndex
      ? {
          ...card,
          tone: dispatchManagementCount > 0 ? 'danger' : 'default',
          value: formatCountLike(card.value, dispatchManagementCount),
        }
      : card,
  );
}

function syncDispatchSummaryRows(
  rows: SafetyAdminOverviewResponse['summaryRows'],
  dispatchManagementCount: number,
): SafetyAdminOverviewResponse['summaryRows'] {
  if (rows.length === 0) return rows;
  const dispatchRowIndex = rows.findIndex((row) => isDispatchManagementLabel(row.label));
  const targetIndex = dispatchRowIndex >= 0 ? dispatchRowIndex : rows.length - 1;
  return rows.map((row, index) =>
    index === targetIndex
      ? { ...row, value: formatCountLike(row.value, dispatchManagementCount) }
      : row,
  );
}

export function mapBackendOverviewResponse(
  response: SafetyBackendAdminOverviewResponse,
): SafetyAdminOverviewResponse {
  const quarterlyMaterialSummary =
    (response.quarterly_material_summary as
      | SafetyBackendAdminOverviewResponse['quarterly_material_summary']
      | null
      | undefined) ?? {
      entries: [],
      missing_site_rows: [],
      quarter_key: '',
      quarter_label: '',
      total_site_count: 0,
    };
  const quarterlyMaterialEntries = Array.isArray(quarterlyMaterialSummary.entries)
    ? quarterlyMaterialSummary.entries
    : [];
  const quarterlyMaterialMissingSiteRows = Array.isArray(quarterlyMaterialSummary.missing_site_rows)
    ? quarterlyMaterialSummary.missing_site_rows
    : [];
  const siteStatusSummary =
    (response.site_status_summary as
      | SafetyBackendAdminOverviewResponse['site_status_summary']
      | null
      | undefined) ?? {
      entries: [],
      total_site_count: 0,
    };
  const siteStatusEntries = Array.isArray(siteStatusSummary.entries) ? siteStatusSummary.entries : [];
  const deadlineSignalSummary =
    (response.deadline_signal_summary as
      | SafetyBackendAdminOverviewResponse['deadline_signal_summary']
      | null
      | undefined) ?? {
      entries: [],
      total_report_count: 0,
    };
  const deadlineSignalEntries = Array.isArray(deadlineSignalSummary.entries)
    ? deadlineSignalSummary.entries
    : [];
  const endingSoonSummary =
    (response.ending_soon_summary as
      | SafetyBackendAdminOverviewResponse['ending_soon_summary']
      | null
      | undefined) ?? {
      entries: [],
      total_site_count: 0,
    };
  const endingSoonEntries = Array.isArray(endingSoonSummary.entries)
    ? endingSoonSummary.entries
    : [];
  const endingSoonRows = Array.isArray(response.ending_soon_rows)
    ? response.ending_soon_rows
    : [];
  const dispatchQueueRows = Array.isArray(response.dispatch_queue_rows)
    ? response.dispatch_queue_rows
    : [];
  const priorityTargetSiteRows = Array.isArray(response.priority_target_site_rows)
    ? response.priority_target_site_rows
    : [];
  const priorityQuarterlyManagementRows = Array.isArray(
    response.priority_quarterly_management_rows,
  )
    ? response.priority_quarterly_management_rows
    : [];
  const recipientMissingSiteRows = Array.isArray(response.recipient_missing_site_rows)
    ? response.recipient_missing_site_rows
    : [];
  const unsentReportRows = Array.isArray(response.unsent_report_rows) ? response.unsent_report_rows : [];
  const today = new Date();
  const mappedUnsentReportRows = mapBackendOverviewUnsentRows(unsentReportRows, today);
  const mappedDeadlineSignalSummary = buildDeadlineSignalSummaryFromRows(
    mappedUnsentReportRows,
    {
      entries: deadlineSignalEntries.map((entry) => ({
        count: entry.count,
        href: normalizeText(entry.href),
        key: normalizeText(entry.key),
        label: normalizeText(entry.label),
      })),
      totalReportCount:
        typeof deadlineSignalSummary.total_report_count === 'number'
          ? deadlineSignalSummary.total_report_count
          : 0,
    },
  );
  const mappedMetricCards = syncDispatchMetricCards(
    response.metric_cards.map((card) => ({
      href: normalizeText(card.href),
      label: normalizeText(card.label),
      meta: normalizeText(card.meta),
      tone: (normalizeText(card.tone) || 'default') as 'default' | 'warning' | 'danger',
      value: normalizeText(card.value),
    })),
    mappedUnsentReportRows.length,
  );
  const mappedSummaryRows = syncDispatchSummaryRows(
    response.summary_rows.map((row) => ({
      label: normalizeText(row.label),
      meta: normalizeText(row.meta),
      value: normalizeText(row.value),
    })),
    mappedUnsentReportRows.length,
  );
  const mappedPriorityQuarterlyManagementRows = priorityQuarterlyManagementRows
    .map((row) => ({
      currentQuarterKey: normalizeText(row.current_quarter_key),
      currentQuarterLabel: normalizeText(row.current_quarter_label),
      exceptionLabel: normalizeText(row.exception_label),
      exceptionStatus: (normalizeText(row.exception_status) ||
        'ok') as SafetyAdminPriorityQuarterlyManagementRow['exceptionStatus'],
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      latestGuidanceDate: normalizeText(row.latest_guidance_date),
      latestGuidanceRound:
        typeof row.latest_guidance_round === 'number' &&
        Number.isFinite(row.latest_guidance_round)
          ? row.latest_guidance_round
          : null,
      projectAmount:
        typeof row.project_amount === 'number' && Number.isFinite(row.project_amount)
          ? row.project_amount
          : null,
      quarterlyDispatchStatus: (normalizeText(row.quarterly_dispatch_status) ||
        'report_missing') as SafetyAdminPriorityQuarterlyManagementRow['quarterlyDispatchStatus'],
      quarterlyReflectionStatus: (normalizeText(row.quarterly_reflection_status) ||
        'missing') as SafetyAdminPriorityQuarterlyManagementRow['quarterlyReflectionStatus'],
      quarterlyReportHref: normalizeText(row.quarterly_report_href),
      quarterlyReportKey: normalizeText(row.quarterly_report_key),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
    }))
    .filter((row) => isPriorityQuarterlyManagementRowScope(row, today));

  return {
    alerts: response.alerts.map((item) => mapBackendAlert(item)),
    completionRows: response.completion_rows.map((row) => ({
      href: normalizeText(row.href),
      headquarterName: normalizeText(row.headquarter_name),
      missingItems: Array.isArray(row.missing_items) ? row.missing_items.map((item) => normalizeText(item)) : [],
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
    })),
    coverageRows: response.coverage_rows.map((row) => ({
      itemCount: row.item_count,
      label: normalizeText(row.label),
      missingSiteCount: row.missing_site_count,
    })),
    deadlineSignalSummary: mappedDeadlineSignalSummary,
    endingSoonRows: endingSoonRows.map((row) => ({
      deadlineLabel: normalizeText(row.deadline_label),
      daysUntilEnd:
        typeof row.days_until_end === 'number' && Number.isFinite(row.days_until_end)
          ? row.days_until_end
          : 0,
      endDate: normalizeText(row.end_date),
      endDateSource:
        (normalizeText(row.end_date_source) || '') as SafetyAdminOverviewResponse['endingSoonRows'][number]['endDateSource'],
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
    })),
    endingSoonSummary: {
      entries: endingSoonEntries.map((entry) => ({
        count: entry.count,
        href: normalizeText(entry.href),
        key: normalizeText(entry.key),
        label: normalizeText(entry.label),
      })),
      totalSiteCount:
        typeof endingSoonSummary.total_site_count === 'number'
          ? endingSoonSummary.total_site_count
          : 0,
    },
    dispatchQueueRows: dispatchQueueRows.map((row) => ({
      dispatchAlertsEnabled: Boolean(row.dispatch_alerts_enabled),
      dispatchPolicyEnabled: Boolean(row.dispatch_policy_enabled),
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      openReportCount: typeof row.open_report_count === 'number' ? row.open_report_count : 0,
      projectAmount:
        typeof row.project_amount === 'number' && Number.isFinite(row.project_amount)
          ? row.project_amount
          : null,
      recipientEmail: normalizeText(row.recipient_email),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
      totalContractAmount:
        typeof row.total_contract_amount === 'number' &&
        Number.isFinite(row.total_contract_amount)
          ? row.total_contract_amount
          : null,
    })),
    deadlineRows: response.deadline_rows.map((row) => ({
      deadlineDate: normalizeText(row.deadline_date),
      deadlineLabel: normalizeText(row.deadline_label),
      href: normalizeText(row.href),
      reportTitle: normalizeText(row.report_title),
      reportTypeLabel: normalizeText(row.report_type_label),
      siteName: normalizeText(row.site_name),
      statusLabel: normalizeText(row.status_label),
    })),
    metricCards: mappedMetricCards,
    overdueSiteRows: response.overdue_site_rows.map((row) => ({
      badWorkplaceOverdueCount: row.bad_workplace_overdue_count,
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      overdueCount: row.overdue_count,
      quarterlyOverdueCount: row.quarterly_overdue_count,
      reportKindsLabel: normalizeText(row.report_kinds_label),
      siteName: normalizeText(row.site_name),
    })),
    pendingReviewRows: response.pending_review_rows.map((row) => ({
      assigneeName: normalizeText(row.assignee_name),
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      qualityLabel: normalizeText(row.quality_label),
      reportTitle: normalizeText(row.report_title),
      reportTypeLabel: normalizeText(row.report_type_label),
      siteName: normalizeText(row.site_name),
      updatedAt: normalizeText(row.updated_at),
    })),
    priorityQuarterlyManagementRows: mappedPriorityQuarterlyManagementRows,
    priorityTargetSiteRows: priorityTargetSiteRows.map((row) => ({
      dispatchAlertsEnabled: Boolean(row.dispatch_alerts_enabled),
      dispatchPolicyEnabled: Boolean(row.dispatch_policy_enabled),
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      openReportCount: typeof row.open_report_count === 'number' ? row.open_report_count : 0,
      projectAmount:
        typeof row.project_amount === 'number' && Number.isFinite(row.project_amount)
          ? row.project_amount
          : null,
      recipientEmail: normalizeText(row.recipient_email),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
      totalContractAmount:
        typeof row.total_contract_amount === 'number' &&
        Number.isFinite(row.total_contract_amount)
          ? row.total_contract_amount
          : null,
    })),
    quarterlyMaterialSummary: {
      entries: quarterlyMaterialEntries.map((entry) => ({
        count: entry.count,
        href: normalizeText(entry.href),
        key: normalizeText(entry.key),
        label: normalizeText(entry.label),
      })),
      missingSiteRows: quarterlyMaterialMissingSiteRows.map((row) => ({
        education: {
          filledCount: row.education.filled_count,
          missingCount: row.education.missing_count,
          requiredCount: row.education.required_count,
        },
        headquarterName: normalizeText(row.headquarter_name),
        href: normalizeText(row.href),
        measurement: {
          filledCount: row.measurement.filled_count,
          missingCount: row.measurement.missing_count,
          requiredCount: row.measurement.required_count,
        },
        missingLabels: Array.isArray(row.missing_labels)
          ? row.missing_labels.map((item) => normalizeText(item))
          : [],
        quarterKey: normalizeText(row.quarter_key),
        quarterLabel: normalizeText(row.quarter_label),
        siteId: normalizeText(row.site_id),
        siteName: normalizeText(row.site_name),
      })),
      quarterKey: normalizeText(quarterlyMaterialSummary.quarter_key),
      quarterLabel: normalizeText(quarterlyMaterialSummary.quarter_label),
      totalSiteCount:
        typeof quarterlyMaterialSummary.total_site_count === 'number'
          ? quarterlyMaterialSummary.total_site_count
          : 0,
    },
    recipientMissingSiteRows: recipientMissingSiteRows.map((row) => ({
      dispatchAlertsEnabled: Boolean(row.dispatch_alerts_enabled),
      dispatchPolicyEnabled: Boolean(row.dispatch_policy_enabled),
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      openReportCount: typeof row.open_report_count === 'number' ? row.open_report_count : 0,
      projectAmount:
        typeof row.project_amount === 'number' && Number.isFinite(row.project_amount)
          ? row.project_amount
          : null,
      recipientEmail: normalizeText(row.recipient_email),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
      totalContractAmount:
        typeof row.total_contract_amount === 'number' &&
        Number.isFinite(row.total_contract_amount)
          ? row.total_contract_amount
          : null,
    })),
    scheduleRows: response.schedule_rows.map((row) => mapBackendSchedule(row)),
    siteStatusSummary: {
      entries: siteStatusEntries.map((entry) => ({
        count: entry.count,
        href: normalizeText(entry.href),
        key: normalizeText(entry.key),
        label: normalizeText(entry.label),
      })),
      totalSiteCount:
        typeof siteStatusSummary.total_site_count === 'number' ? siteStatusSummary.total_site_count : 0,
    },
    summaryRows: mappedSummaryRows,
    unsentReportRows: mappedUnsentReportRows,
    workerLoadRows: response.worker_load_rows.map((row) => ({
      assignedSiteCount: row.assigned_site_count,
      href: normalizeText(row.href),
      loadLabel: normalizeText(row.load_label),
      overdueCount: row.overdue_count,
      userName: normalizeText(row.user_name),
    })),
  };
}

const calculateAnalyticsChangeRate = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
};

const formatAnalyticsDeltaValue = (value: number | null) => {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
};

const getAnalyticsDeltaTone = (value: number | null) => {
  if (value == null || Number.isNaN(value) || Math.abs(value) < 0.0005) {
    return 'neutral' as const;
  }
  return value > 0 ? ('positive' as const) : ('negative' as const);
};

const mapAnalyticsTrendRows = (
  rows: Array<{
    avg_per_visit_amount: number;
    executed_rounds: number;
    label: string;
    month_key: string;
    revenue: number;
  }> = [],
) =>
  rows.map((row) => ({
    avgPerVisitAmount: row.avg_per_visit_amount,
    executedRounds: row.executed_rounds,
    label: normalizeText(row.label),
    monthKey: normalizeText(row.month_key),
    revenue: row.revenue,
  }));

const mapAnalyticsEmployeeRow = (
  row:
    | NonNullable<SafetyBackendAdminAnalyticsSummaryResponse['chart_year_slices']>[number]['employee_rows'][number]
    | SafetyBackendAdminAnalyticsMonthDetailResponse['employee_rows'][number],
) => ({
  assignedSiteCount: row.assigned_site_count,
  avgPerVisitAmount:
    row.executed_rounds > 0 ? row.visit_revenue / row.executed_rounds : 0,
  completionRate:
    (row.planned_rounds ?? row.total_assigned_rounds) > 0
      ? row.executed_rounds / (row.planned_rounds ?? row.total_assigned_rounds)
      : 0,
  overdueCount: row.overdue_count,
  plannedRevenue: row.planned_revenue ?? 0,
  plannedRounds: row.planned_rounds ?? 0,
  primaryContractTypeLabel: '',
  revenueChangeRate: row.revenue_change_rate ?? null,
  totalAssignedRounds: row.total_assigned_rounds,
  userId: normalizeText(row.user_id),
  userName: normalizeText(row.user_name),
  visitRevenue: row.visit_revenue,
  executedRounds: row.executed_rounds,
});

const mapAnalyticsSiteRevenueRow = (
  row:
    | NonNullable<SafetyBackendAdminAnalyticsSummaryResponse['chart_year_slices']>[number]['site_revenue_rows'][number]
    | SafetyBackendAdminAnalyticsMonthDetailResponse['site_revenue_rows'][number],
) => ({
  assigneeName: normalizeText(row.assignee_name),
  avgPerVisitAmount:
    row.executed_rounds > 0 ? row.visit_revenue / row.executed_rounds : 0,
  executedRounds: row.executed_rounds,
  executionRate: row.execution_rate ?? 0,
  headquarterName: normalizeText(row.headquarter_name),
  href: normalizeText(row.href),
  isSummaryRow: Boolean(row.is_summary_row),
  plannedRevenue: row.planned_revenue ?? 0,
  plannedRounds: row.planned_rounds ?? 0,
  siteId:
    normalizeText(row.site_id) ||
    normalizeText(row.href) ||
    normalizeText(row.site_name),
  siteName: normalizeText(row.site_name),
  visitRevenue: row.visit_revenue,
});

function buildAnalyticsSummaryDelta(
  label: string,
  trendRows: SafetyAdminAnalyticsSummaryResponse['trendRows'],
  slices: SafetyAdminAnalyticsSummaryResponse['chartYearSlices'],
) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const trendByKey = new Map(trendRows.map((row) => [row.monthKey, row]));
  const currentYearSlice = slices.find((slice) => slice.year === now.getFullYear()) ?? slices[0];
  const previousYearSlice = slices.find(
    (slice) => slice.year === (currentYearSlice?.year ?? now.getFullYear()) - 1,
  );
  if (label === '이번 달 매출') {
    const value = calculateAnalyticsChangeRate(
      trendByKey.get(currentMonthKey)?.revenue ?? 0,
      trendByKey.get(previousMonthKey)?.revenue ?? 0,
    );
    return {
      deltaLabel: '전월 대비',
      deltaTone: getAnalyticsDeltaTone(value),
      deltaValue: formatAnalyticsDeltaValue(value),
    };
  }
  if (label === '이번 분기 매출') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const currentQuarterKeys = Array.from({ length: 3 }, (_, index) => {
      const month = currentQuarter * 3 + index + 1;
      return `${now.getFullYear()}-${String(month).padStart(2, '0')}`;
    });
    const previousQuarterDate = new Date(now.getFullYear(), currentQuarter * 3 - 3, 1);
    const previousQuarter = Math.floor(previousQuarterDate.getMonth() / 3);
    const previousQuarterKeys = Array.from({ length: 3 }, (_, index) => {
      const month = previousQuarter * 3 + index + 1;
      return `${previousQuarterDate.getFullYear()}-${String(month).padStart(2, '0')}`;
    });
    const currentValue = currentQuarterKeys.reduce(
      (sum, key) => sum + (trendByKey.get(key)?.revenue ?? 0),
      0,
    );
    const previousValue = previousQuarterKeys.reduce(
      (sum, key) => sum + (trendByKey.get(key)?.revenue ?? 0),
      0,
    );
    const value = calculateAnalyticsChangeRate(currentValue, previousValue);
    return {
      deltaLabel: '전분기 대비',
      deltaTone: getAnalyticsDeltaTone(value),
      deltaValue: formatAnalyticsDeltaValue(value),
    };
  }
  if (label === '올해 누적 매출') {
    const currentValue = (currentYearSlice?.trendRows ?? []).reduce(
      (sum, row) => sum + row.revenue,
      0,
    );
    const previousValue = (previousYearSlice?.trendRows ?? []).reduce(
      (sum, row) => sum + row.revenue,
      0,
    );
    const value = calculateAnalyticsChangeRate(currentValue, previousValue);
    return {
      deltaLabel: '전년 대비',
      deltaTone: getAnalyticsDeltaTone(value),
      deltaValue: formatAnalyticsDeltaValue(value),
    };
  }
  if (label === '직원 1인당 평균 매출') {
    const currentValue =
      currentYearSlice && currentYearSlice.employeeRows.length > 0
        ? currentYearSlice.employeeRows.reduce((sum, row) => sum + row.visitRevenue, 0) /
          currentYearSlice.employeeRows.length
        : 0;
    const previousValue =
      previousYearSlice && previousYearSlice.employeeRows.length > 0
        ? previousYearSlice.employeeRows.reduce((sum, row) => sum + row.visitRevenue, 0) /
          previousYearSlice.employeeRows.length
        : 0;
    const value = calculateAnalyticsChangeRate(currentValue, previousValue);
    return {
      deltaLabel: '전년 대비',
      deltaTone: getAnalyticsDeltaTone(value),
      deltaValue: formatAnalyticsDeltaValue(value),
    };
  }
  return {
    deltaLabel: '비교 구간 없음',
    deltaTone: 'neutral' as const,
    deltaValue: '비교 없음',
  };
}

export function mapBackendAnalyticsSummaryResponse(
  response: SafetyBackendAdminAnalyticsSummaryResponse,
): SafetyAdminAnalyticsSummaryResponse {
  const trendRows = mapAnalyticsTrendRows(
    Array.isArray(response.trend_rows) ? response.trend_rows : [],
  );
  const availableTrendYears = Array.from(
    new Set(
      [
        ...trendRows.map((row) => Number.parseInt(row.monthKey.slice(0, 4), 10)),
        ...((response.chart_year_slices ?? []).map((slice) => slice.year)),
      ].filter((year) => Number.isFinite(year)),
    ),
  ).sort((left, right) => right - left);
  if (availableTrendYears.length === 0) {
    availableTrendYears.push(new Date().getFullYear());
  }
  const mappedChartYearSlices = Array.isArray(response.chart_year_slices)
    ? response.chart_year_slices.map((slice) => ({
        employeeRows: slice.employee_rows.map((row) => mapAnalyticsEmployeeRow(row)),
        siteRevenueRows: slice.site_revenue_rows.map((row) => mapAnalyticsSiteRevenueRow(row)),
        trendRows: mapAnalyticsTrendRows(slice.trend_rows),
        year: slice.year,
      }))
    : [];
  const chartYearSlices = mappedChartYearSlices.sort((left, right) => right.year - left.year);
  const availableMonths = Array.from(
    new Set(
      [
        ...trendRows.map((row) => row.monthKey),
        ...(Array.isArray(response.available_months)
          ? response.available_months.map((monthKey) => normalizeText(monthKey))
          : []),
      ].filter(Boolean),
    ),
  ).sort((left, right) => right.localeCompare(left, 'ko'));
  const normalizedBasisMonth = normalizeText(response.basis_month);
  const basisMonth = availableMonths.includes(normalizedBasisMonth)
    ? normalizedBasisMonth
    : (availableMonths[0] ?? '');
  const totalContractAmount = response.contract_type_rows.reduce(
    (sum, row) => sum + row.total_contract_amount,
    0,
  );
  const plannedRounds = response.stats.planned_rounds ?? 0;

  return {
    availableMonths,
    availableTrendYears,
    basisMonth,
    chartYearSlices,
    contractTypeRows: response.contract_type_rows.map((row) => ({
      avgPerVisitAmount: row.avg_per_visit_amount,
      executedRounds: 0,
      label: normalizeText(row.label),
      plannedRounds: row.planned_rounds ?? 0,
      siteCount: row.site_count,
      shareRate:
        totalContractAmount > 0 ? row.total_contract_amount / totalContractAmount : 0,
      totalContractAmount: row.total_contract_amount,
      visitRevenue: row.visit_revenue ?? 0,
    })),
    stats: {
      averagePerVisitAmount: response.stats.average_per_visit_amount,
      completionRate: response.stats.completion_rate,
      countedSiteCount: response.stats.counted_site_count,
      delayRate: response.stats.delay_rate,
      excludedSiteCount: response.stats.excluded_site_count,
      includedEmployeeCount:
        typeof response.stats.included_employee_count === 'number'
          ? response.stats.included_employee_count
          : chartYearSlices[0]?.employeeRows.length ?? 0,
      overdueCount:
        typeof response.stats.overdue_count === 'number'
          ? response.stats.overdue_count
          : 0,
      plannedRounds,
      remainingRounds:
        typeof response.stats.remaining_rounds === 'number'
          ? response.stats.remaining_rounds
          : plannedRounds,
      totalExecutedRounds:
        typeof response.stats.total_executed_rounds === 'number'
          ? response.stats.total_executed_rounds
          : 0,
      totalScopedRounds:
        typeof response.stats.total_scoped_rounds === 'number'
          ? response.stats.total_scoped_rounds
          : plannedRounds,
      totalVisitRevenue:
        typeof response.stats.total_visit_revenue === 'number'
          ? response.stats.total_visit_revenue
          : 0,
    },
    summaryCards: response.summary_cards.map((card) => {
      const normalizedLabel = normalizeText(card.label);
      const delta = buildAnalyticsSummaryDelta(normalizedLabel, trendRows, chartYearSlices);
      return {
        ...delta,
        label: normalizedLabel,
        meta: normalizeText(card.meta),
        value: normalizeText(card.value),
      };
    }),
    trendRows,
  };
}

export function mapBackendAnalyticsMonthDetailResponse(
  response: SafetyBackendAdminAnalyticsMonthDetailResponse,
): SafetyAdminAnalyticsMonthDetailResponse {
  return {
    comparisonMonthKey: normalizeText(response.comparison_month_key),
    employeeRows: response.employee_rows.map((row) => mapAnalyticsEmployeeRow(row)),
    monthKey: normalizeText(response.month_key),
    siteRevenueRows: response.site_revenue_rows.map((row) => mapAnalyticsSiteRevenueRow(row)),
  };
}

export function mapBackendPhotoAsset(asset: SafetyBackendPhotoAsset): SafetyPhotoAsset {
  return {
    capturedAt: normalizeText(asset.captured_at),
    contentType: normalizeText(asset.content_type),
    createdAt: normalizeText(asset.created_at),
    exifJson: asset.exif_json ?? null,
    fileName: normalizeText(asset.file_name),
    gpsLatitude:
      typeof asset.gps_latitude === 'number' && Number.isFinite(asset.gps_latitude)
        ? asset.gps_latitude
        : null,
    gpsLongitude:
      typeof asset.gps_longitude === 'number' && Number.isFinite(asset.gps_longitude)
        ? asset.gps_longitude
        : null,
    headquarterId: normalizeText(asset.headquarter_id),
    headquarterName: normalizeText(asset.headquarter_name),
    id: normalizeText(asset.id),
    originalPath: buildSafetyAdminUpstreamUrl(normalizeText(asset.original_path)),
    roundNo: typeof asset.round_no === 'number' ? asset.round_no : 0,
    sizeBytes: typeof asset.size_bytes === 'number' ? asset.size_bytes : 0,
    siteId: normalizeText(asset.site_id),
    siteName: normalizeText(asset.site_name),
    sourceKind:
      normalizeText(asset.source_kind) === 'legacy_import' ? 'legacy_import' : 'album_upload',
    thumbnailPath: buildSafetyAdminUpstreamUrl(normalizeText(asset.thumbnail_path || asset.original_path)),
    uploadedByName: normalizeText(asset.uploaded_by_name),
    uploadedByUserId: normalizeText(asset.uploaded_by_user_id),
    sourceDocumentKey: normalizeText(asset.source_document_key),
    sourceReportKey: normalizeText(asset.source_report_key),
    sourceReportTitle: normalizeText(asset.source_report_title),
    sourceSlotKey: normalizeText(asset.source_slot_key),
  };
}

function mapBackendExcelImportCandidate(candidate: {
  id?: string | null;
  kind?: string | null;
  label?: string | null;
  reason?: string | null;
  headquarter_id?: string | null;
  site_id?: string | null;
}): ExcelMatchCandidate {
  return {
    id: normalizeText(candidate.id),
    kind: (normalizeText(candidate.kind) || 'site') as ExcelMatchCandidate['kind'],
    label: normalizeText(candidate.label),
    reason: normalizeText(candidate.reason),
    headquarterId: normalizeText(candidate.headquarter_id) || null,
    siteId: normalizeText(candidate.site_id) || null,
  };
}

function mapBackendExcelImportPreviewRow(row: {
  row_index?: number | null;
  values?: Record<string, unknown> | null;
  summary?: string | null;
  suggested_action?: string | null;
  exclusion_reason_code?: string | null;
  exclusion_reason?: string | null;
  in_scope?: boolean | null;
  duplicate_candidates?: Array<{
    id?: string | null;
    kind?: string | null;
    label?: string | null;
    reason?: string | null;
    headquarter_id?: string | null;
    site_id?: string | null;
  }> | null;
}): ExcelImportPreviewRow {
  return {
    rowIndex: typeof row.row_index === 'number' ? row.row_index : 0,
    values:
      row.values && typeof row.values === 'object'
        ? Object.fromEntries(
            Object.entries(row.values).map(([key, value]) => [normalizeText(key), normalizeText(value)]),
          )
        : {},
    summary: normalizeText(row.summary),
    suggestedAction: normalizeText(row.suggested_action),
    exclusionReasonCode: normalizeExcelRowExclusionReasonCode(row.exclusion_reason_code),
    exclusionReason: normalizeText(row.exclusion_reason) || null,
    inScope: typeof row.in_scope === 'boolean' ? row.in_scope : undefined,
    duplicateCandidates: Array.isArray(row.duplicate_candidates)
      ? row.duplicate_candidates.map((candidate) => mapBackendExcelImportCandidate(candidate))
      : [],
  };
}

function mapBackendExcelImportScopeSummary(scope: {
  source_section?: string | null;
  headquarter_id?: string | null;
  site_id?: string | null;
  label?: string | null;
} | null | undefined): ExcelImportScopeSummary {
  return {
    sourceSection: normalizeText(scope?.source_section) === 'sites' ? 'sites' : 'headquarters',
    headquarterId: normalizeText(scope?.headquarter_id) || null,
    siteId: normalizeText(scope?.site_id) || null,
    label: normalizeText(scope?.label) || '전체',
  };
}

export function mapBackendExcelImportPreview(
  preview: SafetyBackendExcelImportPreview,
): ExcelImportPreview {
  return {
    jobId: normalizeText(preview.job_id),
    fileName: normalizeText(preview.file_name),
    createdAt: normalizeText(preview.created_at),
    sheetNames: Array.isArray(preview.sheet_names)
      ? preview.sheet_names.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    scope: mapBackendExcelImportScopeSummary(preview.scope),
    sheets: Array.isArray(preview.sheets)
      ? preview.sheets.map((sheet) => ({
          name: normalizeText(sheet.name),
          headers: Array.isArray(sheet.headers)
            ? sheet.headers.map((item) => normalizeText(item)).filter(Boolean)
            : [],
          rowCount: typeof sheet.row_count === 'number' ? sheet.row_count : 0,
          includedRowCount:
            typeof sheet.included_row_count === 'number' ? sheet.included_row_count : 0,
          excludedRowCount:
            typeof sheet.excluded_row_count === 'number' ? sheet.excluded_row_count : 0,
          sampleRows: Array.isArray(sheet.sample_rows)
            ? sheet.sample_rows.map((row) =>
                Object.fromEntries(
                  Object.entries(row || {}).map(([key, value]) => [normalizeText(key), normalizeText(value)]),
                ),
              )
            : [],
          suggestedMapping:
            sheet.suggested_mapping && typeof sheet.suggested_mapping === 'object'
              ? Object.fromEntries(
                  Object.entries(sheet.suggested_mapping).map(([key, value]) => [
                    normalizeText(key),
                    normalizeText(value),
                  ]),
                )
              : {},
          detectedMappings: Array.isArray(sheet.detected_mappings)
            ? sheet.detected_mappings.map((mapping) => ({
                field: normalizeText(mapping.field),
                header: normalizeText(mapping.header),
                note: normalizeText(mapping.note) || null,
              }))
            : [],
          ignoredHeaders: Array.isArray(sheet.ignored_headers)
            ? sheet.ignored_headers.map((ignored) => ({
                header: normalizeText(ignored.header),
                reason: normalizeText(ignored.reason),
              }))
            : [],
          mappingWarnings: Array.isArray(sheet.mapping_warnings)
            ? sheet.mapping_warnings.map((item) => normalizeText(item)).filter(Boolean)
            : [],
          hasRiskyMapping: Boolean(sheet.has_risky_mapping),
          includedRows: Array.isArray(sheet.included_rows)
            ? sheet.included_rows.map((row) => mapBackendExcelImportPreviewRow(row))
            : [],
          excludedRows: Array.isArray(sheet.excluded_rows)
            ? sheet.excluded_rows.map((row) => mapBackendExcelImportPreviewRow(row))
            : [],
          summary: {
            ambiguousCreateCount: sheet.summary?.ambiguous_create_count ?? 0,
            createCount: sheet.summary?.create_count ?? 0,
            updateHeadquarterCount: sheet.summary?.update_headquarter_count ?? 0,
            updateSiteCount: sheet.summary?.update_site_count ?? 0,
          },
        }))
      : [],
  };
}

export function mapBackendExcelApplyResult(
  response: SafetyBackendExcelApplyResult,
): ExcelApplyResult {
  return {
    summary: {
      createdHeadquarterCount: response.summary?.created_headquarter_count ?? 0,
      updatedHeadquarterCount: response.summary?.updated_headquarter_count ?? 0,
      createdSiteCount: response.summary?.created_site_count ?? 0,
      updatedSiteCount: response.summary?.updated_site_count ?? 0,
      completionRequiredCount: response.summary?.completion_required_count ?? 0,
      matchedExistingUserCount: response.summary?.matched_existing_user_count ?? 0,
      createdPlaceholderUserCount: response.summary?.created_placeholder_user_count ?? 0,
      ambiguousWorkerMatchCount: response.summary?.ambiguous_worker_match_count ?? 0,
      createdAssignmentCount: response.summary?.created_assignment_count ?? 0,
    },
    rows: Array.isArray(response.rows)
      ? response.rows.map((row) => ({
          rowIndex: typeof row.row_index === 'number' ? row.row_index : 0,
          action: (normalizeText(row.action) || 'create') as ExcelApplyResult['rows'][number]['action'],
          headquarterId: normalizeText(row.headquarter_id),
          headquarterName: normalizeText(row.headquarter_name),
          siteId: normalizeText(row.site_id),
          siteName: normalizeText(row.site_name),
          requiredCompletionFields: Array.isArray(row.required_completion_fields)
            ? row.required_completion_fields.map((item) => normalizeText(item)).filter(Boolean)
            : [],
          workerMatchStatus: normalizeText(row.worker_match_status),
          matchedUserId: normalizeText(row.matched_user_id),
          matchedUserEmail: normalizeText(row.matched_user_email),
          placeholderCreated: Boolean(row.placeholder_created),
          message: normalizeText(row.message),
        }))
      : [],
  };
}

function mapMailParticipant(
  participant: { email?: string | null; name?: string | null } | null | undefined,
) {
  return {
    email: normalizeText(participant?.email),
    name: normalizeText(participant?.name) || null,
  };
}

export function mapBackendMailAccount(account: SafetyBackendMailAccount): MailAccount {
  return {
    connectionStatus: normalizeText(account.connection_status) as MailAccount['connectionStatus'],
    createdAt: normalizeText(account.created_at),
    displayName: normalizeText(account.display_name),
    email: normalizeText(account.email),
    id: normalizeText(account.id),
    isActive: Boolean(account.is_active),
    isDefault: Boolean(account.is_default),
    lastSyncedAt: normalizeText(account.last_synced_at) || null,
    mailboxLabel: normalizeText(account.mailbox_label),
    metadata: account.metadata ?? {},
    provider: (normalizeText(account.provider) || 'naver_mail') as MailAccount['provider'],
    scope: (normalizeText(account.scope) || 'personal') as MailAccount['scope'],
    updatedAt: normalizeText(account.updated_at),
    userId: normalizeText(account.user_id) || null,
  };
}

export function mapBackendMailProviderStatus(status: SafetyBackendMailProviderStatus): MailProviderStatus {
  return {
    provider: (normalizeText(status.provider) || 'google') as MailProviderStatus['provider'],
    enabled: Boolean(status.enabled),
    defaultRedirectUri: normalizeText(status.default_redirect_uri),
    allowedRedirectUris: Array.isArray(status.allowed_redirect_uris)
      ? status.allowed_redirect_uris.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    requestedRedirectUri: normalizeText(status.requested_redirect_uri),
    isRedirectAllowed: Boolean(status.is_redirect_allowed),
    missingFields: Array.isArray(status.missing_fields)
      ? status.missing_fields.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    message: normalizeText(status.message),
  };
}

export function mapBackendMailThread(thread: SafetyBackendMailThread): MailThread {
  return {
    accountDisplayName: normalizeText(thread.account_display_name),
    accountEmail: normalizeText(thread.account_email),
    accountId: normalizeText(thread.account_id),
    headquarterId: normalizeText(thread.headquarter_id) || null,
    id: normalizeText(thread.id),
    lastDirection: (normalizeText(thread.last_direction) || null) as MailThread['lastDirection'],
    lastMessageAt: normalizeText(thread.last_message_at) || null,
    messageCount: thread.message_count,
    participants: Array.isArray(thread.participants) ? thread.participants.map((item) => mapMailParticipant(item)) : [],
    provider: (normalizeText(thread.provider) || 'naver_mail') as MailThread['provider'],
    reportKey: normalizeText(thread.report_key) || null,
    scope: (normalizeText(thread.scope) || 'personal') as MailThread['scope'],
    siteId: normalizeText(thread.site_id) || null,
    snippet: normalizeText(thread.snippet),
    status: (normalizeText(thread.status) || 'draft') as MailThread['status'],
    subject: normalizeText(thread.subject),
    unreadCount: thread.unread_count,
  };
}

export function mapBackendMailMessage(message: SafetyBackendMailMessage): MailMessage {
  return {
    accountId: normalizeText(message.account_id),
    body: normalizeText(message.body),
    bodyPreview: normalizeText(message.body_preview),
    createdAt: normalizeText(message.created_at),
    deliveredAt: normalizeText(message.delivered_at) || null,
    direction: (normalizeText(message.direction) || 'outgoing') as MailMessage['direction'],
    fromEmail: normalizeText(message.from_email),
    fromName: normalizeText(message.from_name) || null,
    headquarterId: normalizeText(message.headquarter_id) || null,
    id: normalizeText(message.id),
    readAt: normalizeText(message.read_at) || null,
    reportKey: normalizeText(message.report_key) || null,
    sentAt: normalizeText(message.sent_at) || null,
    siteId: normalizeText(message.site_id) || null,
    subject: normalizeText(message.subject),
    threadId: normalizeText(message.thread_id),
    to: Array.isArray(message.to) ? message.to.map((item) => mapMailParticipant(item)) : [],
    updatedAt: normalizeText(message.updated_at),
  };
}

export function mapBackendMailThreadDetail(detail: SafetyBackendMailThreadDetail): MailThreadDetail {
  return {
    messages: detail.messages.map((message) => mapBackendMailMessage(message)),
    thread: mapBackendMailThread(detail.thread),
  };
}

export function mapBackendSmsProviderStatus(status: SafetyBackendSmsProviderStatus): SmsProviderStatus {
  return {
    provider: normalizeText(status.provider),
    enabled: Boolean(status.enabled),
    sendEnabled: Boolean(status.send_enabled),
    missingFields: Array.isArray(status.missing_fields)
      ? status.missing_fields.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    sender: normalizeText(status.sender),
    serviceId: normalizeText(status.service_id),
    message: normalizeText(status.message),
  };
}

export function mapBackendSmsMessage(message: SafetyBackendSmsMessage): SmsMessage {
  return {
    id: normalizeText(message.id),
    provider: normalizeText(message.provider),
    phoneNumber: normalizeText(message.phone_number),
    content: normalizeText(message.content),
    subject: normalizeText(message.subject),
    reportKey: normalizeText(message.report_key) || null,
    siteId: normalizeText(message.site_id) || null,
    headquarterId: normalizeText(message.headquarter_id) || null,
    sentByUserId: normalizeText(message.sent_by_user_id) || null,
    status: normalizeText(message.status),
    providerMessageId: normalizeText(message.provider_message_id) || null,
    providerResponse: message.provider_response ?? {},
    metadata: message.metadata ?? {},
    createdAt: normalizeText(message.created_at),
    updatedAt: normalizeText(message.updated_at),
  };
}

export function mapBackendSmsSendResult(response: SafetyBackendSmsSendResponse): SmsSendResult {
  return {
    ok: Boolean(response.ok),
    message: normalizeText(response.message),
    sms: mapBackendSmsMessage(response.sms),
  };
}

export function buildPhotoAlbumItemFromAsset(
  asset: SafetyPhotoAsset,
  site: SafetySite | null | undefined,
): PhotoAlbumItem {
  const headquarterName =
    normalizeText(asset.headquarterName) ||
    normalizeText(site?.headquarter_detail?.name) ||
    normalizeText(site?.headquarter?.name) ||
    '사업장';
  const siteName = normalizeText(asset.siteName) || normalizeText(site?.site_name) || '현장';

  return {
    capturedAt: asset.capturedAt,
    contentType: asset.contentType,
    createdAt: asset.createdAt,
    downloadUrl: `/api/photos/download?item_id=${encodeURIComponent(asset.id)}`,
    fileName: asset.fileName,
    gpsLatitude: asset.gpsLatitude,
    gpsLongitude: asset.gpsLongitude,
    headquarterId: asset.headquarterId,
    headquarterName,
    id: asset.id,
    previewUrl: normalizeSafetyAssetUrl(asset.thumbnailPath || asset.originalPath),
    roundNo: asset.roundNo,
    siteId: asset.siteId,
    siteName,
    sizeBytes: asset.sizeBytes,
    sourceDocumentKey: asset.sourceDocumentKey || '',
    sourceKind: asset.sourceKind,
    sourceReportKey: asset.sourceReportKey || '',
    sourceReportTitle: asset.sourceReportTitle || '',
    sourceSlotKey: asset.sourceSlotKey || '',
    uploadedByName: asset.uploadedByName,
    uploadedByUserId: asset.uploadedByUserId,
  };
}
