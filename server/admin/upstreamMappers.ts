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
  SafetyBackendFieldSignatureRecord,
  SafetyBackendInspectionSchedule,
  SafetyBackendK2bApplyResult,
  SafetyBackendK2bImportPreview,
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
import type { FieldSignatureRecord } from '@/types/assist';
import type {
  K2bApplyResult,
  K2bImportPreview,
  K2bMatchCandidate,
} from '@/types/k2b';
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

function mapBackendK2bCandidate(candidate: {
  id?: string | null;
  kind?: string | null;
  label?: string | null;
  reason?: string | null;
  headquarter_id?: string | null;
  site_id?: string | null;
}): K2bMatchCandidate {
  return {
    id: normalizeText(candidate.id),
    kind: (normalizeText(candidate.kind) || 'site') as K2bMatchCandidate['kind'],
    label: normalizeText(candidate.label),
    reason: normalizeText(candidate.reason),
    headquarterId: normalizeText(candidate.headquarter_id) || null,
    siteId: normalizeText(candidate.site_id) || null,
  };
}

export function mapBackendK2bImportPreview(
  preview: SafetyBackendK2bImportPreview,
): K2bImportPreview {
  return {
    jobId: normalizeText(preview.job_id),
    fileName: normalizeText(preview.file_name),
    createdAt: normalizeText(preview.created_at),
    sheetNames: Array.isArray(preview.sheet_names)
      ? preview.sheet_names.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    sheets: Array.isArray(preview.sheets)
      ? preview.sheets.map((sheet) => ({
          name: normalizeText(sheet.name),
          headers: Array.isArray(sheet.headers)
            ? sheet.headers.map((item) => normalizeText(item)).filter(Boolean)
            : [],
          rowCount: typeof sheet.row_count === 'number' ? sheet.row_count : 0,
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
          rowPreviews: Array.isArray(sheet.row_previews)
            ? sheet.row_previews.map((row) => ({
                rowIndex: typeof row.row_index === 'number' ? row.row_index : 0,
                values:
                  row.values && typeof row.values === 'object'
                    ? Object.fromEntries(
                        Object.entries(row.values).map(([key, value]) => [normalizeText(key), normalizeText(value)]),
                      )
                    : {},
                summary: normalizeText(row.summary),
                suggestedAction: normalizeText(row.suggested_action),
                duplicateCandidates: Array.isArray(row.duplicate_candidates)
                  ? row.duplicate_candidates.map((candidate) => mapBackendK2bCandidate(candidate))
                  : [],
              }))
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

export function mapBackendK2bApplyResult(
  response: SafetyBackendK2bApplyResult,
): K2bApplyResult {
  return {
    summary: {
      createdHeadquarterCount: response.summary?.created_headquarter_count ?? 0,
      updatedHeadquarterCount: response.summary?.updated_headquarter_count ?? 0,
      createdSiteCount: response.summary?.created_site_count ?? 0,
      updatedSiteCount: response.summary?.updated_site_count ?? 0,
      completionRequiredCount: response.summary?.completion_required_count ?? 0,
    },
    rows: Array.isArray(response.rows)
      ? response.rows.map((row) => ({
          rowIndex: typeof row.row_index === 'number' ? row.row_index : 0,
          action: (normalizeText(row.action) || 'create') as K2bApplyResult['rows'][number]['action'],
          headquarterId: normalizeText(row.headquarter_id),
          headquarterName: normalizeText(row.headquarter_name),
          siteId: normalizeText(row.site_id),
          siteName: normalizeText(row.site_name),
          requiredCompletionFields: Array.isArray(row.required_completion_fields)
            ? row.required_completion_fields.map((item) => normalizeText(item)).filter(Boolean)
            : [],
          message: normalizeText(row.message),
        }))
      : [],
  };
}

export function mapBackendFieldSignatureRecord(
  record: SafetyBackendFieldSignatureRecord,
): FieldSignatureRecord {
  return {
    id: normalizeText(record.id),
    siteId: normalizeText(record.site_id),
    scheduleId: normalizeText(record.schedule_id) || null,
    signedByUserId: normalizeText(record.signed_by_user_id),
    signedByName: normalizeText(record.signed_by_name),
    signedAt: normalizeText(record.signed_at),
    imageDataUrl: normalizeText(record.image_data_url),
    note: normalizeText(record.note) || null,
    createdAt: normalizeText(record.created_at),
    updatedAt: normalizeText(record.updated_at),
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
    previewUrl: asset.thumbnailPath || asset.originalPath,
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
