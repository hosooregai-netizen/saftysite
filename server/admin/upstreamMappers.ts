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
import type {
  ControllerReportRow,
  SafetyAdminAlert,
  SafetyAdminAnalyticsResponse,
  SafetyAdminOverviewResponse,
  SafetyAdminReportsResponse,
  SafetyAdminScheduleListResponse,
  SafetyInspectionSchedule,
} from '@/types/admin';
import type {
  SafetyBackendAdminAlert,
  SafetyBackendAdminAnalyticsResponse,
  SafetyBackendAdminOverviewResponse,
  SafetyBackendAdminReportRow,
  SafetyBackendAdminReportsResponse,
  SafetyBackendInspectionSchedule,
  SafetyBackendExcelApplyResult,
  SafetyBackendExcelImportPreview,
  SafetyBackendMailAccount,
  SafetyBackendMailProviderStatus,
  SafetyBackendMailMessage,
  SafetyBackendMailThread,
  SafetyBackendMailThreadDetail,
  SafetyBackendNotificationFeedResponse,
  SafetyBackendNotificationItem,
  SafetyBackendPhotoAsset,
  SafetyBackendScheduleListResponse,
  SafetyBackendSmsMessage,
  SafetyBackendSmsProviderStatus,
  SafetyBackendSmsSendResponse,
  SafetySite,
} from '@/types/backend';
import type { MailAccount, MailMessage, MailProviderStatus, MailThread, MailThreadDetail } from '@/types/mail';
import type { SmsMessage, SmsProviderStatus, SmsSendResult } from '@/types/messages';
import type { NotificationFeedResponse, NotificationItem } from '@/types/notifications';
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
  return applyControllerReportRowStatus({
    assigneeName: normalizeText(row.assignee_name),
    assigneeUserId: normalizeText(row.assignee_user_id),
    checkerUserId: normalizeText(row.checker_user_id),
    controllerReview: mapBackendReview(row),
    deadlineDate: normalizeText(row.deadline_date),
    dispatch: mapBackendDispatch(row),
    dispatchStatus: (normalizeText(row.dispatch_status) || '') as ControllerReportRow['dispatchStatus'],
    headquarterId: normalizeText(row.headquarter_id),
    headquarterName: normalizeText(row.headquarter_name),
    periodLabel: normalizeText(row.period_label),
    progressRate:
      typeof row.progress_rate === 'number' && Number.isFinite(row.progress_rate)
        ? row.progress_rate
        : null,
    qualityStatus: (normalizeText(row.quality_status) || 'unchecked') as ControllerReportRow['qualityStatus'],
    reportKey: normalizeText(row.report_key),
    reportMonth: normalizeText(row.report_month),
    reportTitle: normalizeText(row.report_title),
    reportType: (normalizeText(row.report_type) || 'technical_guidance') as ControllerReportRow['reportType'],
    routeParam: normalizeText(row.route_param),
    siteId: normalizeText(row.site_id),
    siteName: normalizeText(row.site_name),
    sortLabel: normalizeText(row.sort_label),
    status: normalizeText(row.workflow_status) || normalizeText(row.status),
    updatedAt: normalizeText(row.updated_at),
    visitDate: normalizeText(row.visit_date),
    workflowStatus: normalizeText(row.workflow_status),
    lifecycleStatus: normalizeText(row.lifecycle_status),
  });
}

export function mapBackendAdminReportsResponse(
  response: SafetyBackendAdminReportsResponse,
): SafetyAdminReportsResponse {
  return {
    limit: response.limit,
    offset: response.offset,
    rows: response.rows
      .map((row) => mapBackendAdminReportRow(row))
      .filter((row) => isVisibleReport(row)),
    total: response.total,
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
  const dispatchQueueRows = Array.isArray(response.dispatch_queue_rows)
    ? response.dispatch_queue_rows
    : [];
  const priorityTargetSiteRows = Array.isArray(response.priority_target_site_rows)
    ? response.priority_target_site_rows
    : [];
  const recipientMissingSiteRows = Array.isArray(response.recipient_missing_site_rows)
    ? response.recipient_missing_site_rows
    : [];
  const unsentReportRows = Array.isArray(response.unsent_report_rows) ? response.unsent_report_rows : [];

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
    deadlineSignalSummary: {
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
    dispatchQueueRows: dispatchQueueRows.map((row) => ({
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
    metricCards: response.metric_cards.map((card) => ({
      href: normalizeText(card.href),
      label: normalizeText(card.label),
      meta: normalizeText(card.meta),
      tone: (normalizeText(card.tone) || 'default') as 'default' | 'warning' | 'danger',
      value: normalizeText(card.value),
    })),
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
    priorityTargetSiteRows: priorityTargetSiteRows.map((row) => ({
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
    summaryRows: response.summary_rows.map((row) => ({
      label: normalizeText(row.label),
      meta: normalizeText(row.meta),
      value: normalizeText(row.value),
    })),
    unsentReportRows: unsentReportRows.map((row) => ({
      assigneeName: normalizeText(row.assignee_name),
      deadlineDate: normalizeText(row.deadline_date),
      dispatchStatus: (normalizeText(row.dispatch_status) || '') as SafetyAdminOverviewResponse['unsentReportRows'][number]['dispatchStatus'],
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      referenceDate: normalizeText(row.reference_date),
      reportKey: normalizeText(row.report_key),
      reportTitle: normalizeText(row.report_title),
      reportTypeLabel: normalizeText(row.report_type_label),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
      unsentDays: typeof row.unsent_days === 'number' ? row.unsent_days : 0,
      visitDate: normalizeText(row.visit_date),
      mailMissingReason: normalizeText(row.mail_missing_reason),
      mailReady: Boolean(row.mail_ready),
      recipientEmail: normalizeText(row.recipient_email),
      recipientName: normalizeText(row.recipient_name),
    })),
    workerLoadRows: response.worker_load_rows.map((row) => ({
      assignedSiteCount: row.assigned_site_count,
      href: normalizeText(row.href),
      loadLabel: normalizeText(row.load_label),
      overdueCount: row.overdue_count,
      userName: normalizeText(row.user_name),
    })),
  };
}

export function mapBackendAnalyticsResponse(
  response: SafetyBackendAdminAnalyticsResponse,
): SafetyAdminAnalyticsResponse {
  const totalContractAmount = response.contract_type_rows.reduce(
    (sum, row) => sum + row.total_contract_amount,
    0,
  );
  const totalOverdueCount = response.employee_rows.reduce(
    (sum, row) => sum + row.overdue_count,
    0,
  );
  const totalExecutedRounds = response.employee_rows.reduce(
    (sum, row) => sum + row.executed_rounds,
    0,
  );
  const totalVisitRevenue = response.employee_rows.reduce(
    (sum, row) => sum + row.visit_revenue,
    0,
  );

  return {
    contractTypeRows: response.contract_type_rows.map((row) => ({
      avgPerVisitAmount: row.avg_per_visit_amount,
      executedRounds: 0,
      label: normalizeText(row.label),
      plannedRounds: row.planned_rounds ?? 0,
      siteCount: row.site_count,
      shareRate: totalContractAmount > 0 ? row.total_contract_amount / totalContractAmount : 0,
      totalContractAmount: row.total_contract_amount,
      visitRevenue: row.visit_revenue ?? 0,
    })),
    employeeRows: response.employee_rows.map((row) => ({
      assignedSiteCount: row.assigned_site_count,
      avgPerVisitAmount:
        row.executed_rounds > 0 ? row.visit_revenue / row.executed_rounds : 0,
      completionRate:
        row.total_assigned_rounds > 0 ? row.executed_rounds / row.total_assigned_rounds : 0,
      overdueCount: row.overdue_count,
      plannedRevenue: row.planned_revenue ?? 0,
      plannedRounds: row.planned_rounds ?? 0,
      primaryContractTypeLabel: '',
      revenueChangeRate: null,
      totalAssignedRounds: row.total_assigned_rounds,
      userId: normalizeText(row.user_id),
      userName: normalizeText(row.user_name),
      visitRevenue: row.visit_revenue,
      executedRounds: row.executed_rounds,
    })),
    siteRevenueRows: response.site_revenue_rows.map((row) => ({
      avgPerVisitAmount:
        row.executed_rounds > 0 ? row.visit_revenue / row.executed_rounds : 0,
      contractTypeLabel: normalizeText(row.contract_type_label),
      executedRounds: row.executed_rounds,
      executionRate: row.execution_rate ?? 0,
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      plannedRevenue: row.planned_revenue ?? 0,
      plannedRounds: row.planned_rounds ?? 0,
      siteId: normalizeText(row.href) || normalizeText(row.site_name),
      siteName: normalizeText(row.site_name),
      visitRevenue: row.visit_revenue,
    })),
    stats: {
      averagePerVisitAmount: response.stats.average_per_visit_amount,
      completionRate: response.stats.completion_rate,
      countedSiteCount: response.stats.counted_site_count,
      delayRate: response.stats.delay_rate,
      excludedSiteCount: response.stats.excluded_site_count,
      includedEmployeeCount: response.employee_rows.length,
      overdueCount: totalOverdueCount,
      plannedContractRevenue: response.stats.planned_contract_revenue ?? 0,
      plannedRounds: response.stats.planned_rounds ?? 0,
      totalExecutedRounds,
      totalVisitRevenue,
    },
    summaryCards: response.summary_cards.map((card) => ({
      deltaLabel: '비교 구간 없음',
      deltaTone: 'neutral',
      deltaValue: '비교 없음',
      label: normalizeText(card.label),
      meta: normalizeText(card.meta),
      value: normalizeText(card.value),
    })),
    trendRows: Array.isArray(response.trend_rows)
      ? response.trend_rows.map((row) => ({
          avgPerVisitAmount: row.avg_per_visit_amount,
          executedRounds: row.executed_rounds,
          label: normalizeText(row.label),
          monthKey: normalizeText(row.month_key),
          revenue: row.revenue,
        }))
      : [],
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

export function mapBackendNotificationItem(item: SafetyBackendNotificationItem): NotificationItem {
  return {
    category: normalizeText(item.category) as NotificationItem['category'],
    createdAt: normalizeText(item.created_at),
    description: normalizeText(item.description),
    href: normalizeText(item.href),
    id: normalizeText(item.id),
    isImportant: Boolean(item.is_important),
    isRead: Boolean(item.is_read),
    messageId: normalizeText(item.message_id),
    reportKey: normalizeText(item.report_key),
    severity: (normalizeText(item.severity) || 'info') as NotificationItem['severity'],
    siteId: normalizeText(item.site_id),
    sourceId: normalizeText(item.source_id),
    sourceType: normalizeText(item.source_type),
    threadId: normalizeText(item.thread_id),
    title: normalizeText(item.title),
  };
}

export function mapBackendNotificationFeed(
  response: SafetyBackendNotificationFeedResponse,
): NotificationFeedResponse {
  return {
    rows: response.rows.map((item) => mapBackendNotificationItem(item)),
    unreadCount: response.unread_count,
    unreadImportantCount: response.unread_important_count,
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
