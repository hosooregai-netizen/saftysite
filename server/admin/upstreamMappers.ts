import { normalizeControllerReview, normalizeDispatchMeta } from '@/lib/admin/reportMeta';
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
  SafetyBackendPhotoAsset,
  SafetyBackendScheduleListResponse,
  SafetySite,
} from '@/types/backend';
import type { PhotoAlbumItem, SafetyPhotoAsset } from '@/types/photos';
import { buildSafetyAdminUpstreamUrl } from './safetyApiServer';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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
  return {
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
    status: normalizeText(row.status),
    updatedAt: normalizeText(row.updated_at),
    visitDate: normalizeText(row.visit_date),
  };
}

export function mapBackendAdminReportsResponse(
  response: SafetyBackendAdminReportsResponse,
): SafetyAdminReportsResponse {
  return {
    limit: response.limit,
    offset: response.offset,
    rows: response.rows.map((row) => mapBackendAdminReportRow(row)),
    total: response.total,
  };
}

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
    scheduleRows: response.schedule_rows.map((row) => mapBackendSchedule(row)),
    summaryRows: response.summary_rows.map((row) => ({
      label: normalizeText(row.label),
      meta: normalizeText(row.meta),
      value: normalizeText(row.value),
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
  return {
    contractTypeRows: response.contract_type_rows.map((row) => ({
      avgPerVisitAmount: row.avg_per_visit_amount,
      label: normalizeText(row.label),
      siteCount: row.site_count,
      totalContractAmount: row.total_contract_amount,
    })),
    employeeRows: response.employee_rows.map((row) => ({
      assignedSiteCount: row.assigned_site_count,
      badWorkplaceSubmittedCount: row.bad_workplace_submitted_count,
      completedReportCount: row.completed_report_count,
      contractContributionRevenue: row.contract_contribution_revenue,
      overdueCount: row.overdue_count,
      quarterlyCompletedCount: row.quarterly_completed_count,
      totalAssignedRounds: row.total_assigned_rounds,
      userId: normalizeText(row.user_id),
      userName: normalizeText(row.user_name),
      visitRevenue: row.visit_revenue,
      executedRounds: row.executed_rounds,
    })),
    siteRevenueRows: response.site_revenue_rows.map((row) => ({
      contractContributionRevenue: row.contract_contribution_revenue,
      contractTypeLabel: normalizeText(row.contract_type_label),
      executedRounds: row.executed_rounds,
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      siteName: normalizeText(row.site_name),
      visitRevenue: row.visit_revenue,
    })),
    stats: {
      averagePerVisitAmount: response.stats.average_per_visit_amount,
      completionRate: response.stats.completion_rate,
      countedSiteCount: response.stats.counted_site_count,
      delayRate: response.stats.delay_rate,
      excludedSiteCount: response.stats.excluded_site_count,
    },
    summaryCards: response.summary_cards.map((card) => ({
      label: normalizeText(card.label),
      meta: normalizeText(card.meta),
      value: normalizeText(card.value),
    })),
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
    id: normalizeText(asset.id),
    originalPath: buildSafetyAdminUpstreamUrl(normalizeText(asset.original_path)),
    sizeBytes: typeof asset.size_bytes === 'number' ? asset.size_bytes : 0,
    siteId: normalizeText(asset.site_id),
    sourceKind: 'album_upload',
    thumbnailPath: buildSafetyAdminUpstreamUrl(normalizeText(asset.thumbnail_path || asset.original_path)),
    uploadedByName: normalizeText(asset.uploaded_by_name),
    uploadedByUserId: normalizeText(asset.uploaded_by_user_id),
  };
}

export function buildPhotoAlbumItemFromAsset(
  asset: SafetyPhotoAsset,
  site: SafetySite | null | undefined,
): PhotoAlbumItem {
  const headquarterName =
    normalizeText(site?.headquarter_detail?.name) ||
    normalizeText(site?.headquarter?.name) ||
    '사업장';
  const siteName = normalizeText(site?.site_name) || '현장';

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
    previewUrl: asset.thumbnailPath || asset.originalPath,
    siteId: asset.siteId,
    siteName,
    sizeBytes: asset.sizeBytes,
    sourceDocumentKey: '',
    sourceKind: 'album_upload',
    sourceReportKey: '',
    sourceReportTitle: '',
    sourceSlotKey: '',
    uploadedByName: asset.uploadedByName,
    uploadedByUserId: asset.uploadedByUserId,
  };
}
