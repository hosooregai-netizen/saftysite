import type {
  CaseFeedItem,
  InspectionSession,
  InspectionSite,
  SafetyInfoItem,
} from '@/types/inspectionSession';
import type {
  ControllerReportType,
  ReportControllerReview,
  ReportDispatchMeta,
} from '@/types/admin';
export interface SafetyMeasurementTemplate {
  id: string;
  title: string;
  instrumentName: string;
  safetyCriteria: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SafetyCaseCatalogItem extends CaseFeedItem {
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SafetyInfoCatalogItem extends SafetyInfoItem {
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SafetyDoc7ReferenceMaterialCatalogItem {
  id: string;
  title: string;
  accidentType: string;
  /** 표준 키 또는 CRUD에서 직접 입력한 문자열 */
  causativeAgentKey: string;
  body: string;
  imageUrl: string;
  referenceTitle1: string;
  referenceTitle2: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  sortOrder: number;
}

export type SafetyUserRole =
  | 'super_admin'
  | 'admin'
  | 'controller'
  | 'field_agent'
  | 'client_viewer';

export type SafetyReportStatus = 'draft' | 'submitted' | 'published' | 'archived';
export type SafetyEmploymentType = 'daily' | 'regular' | 'partner' | 'other';
export type WorkerAckDocumentKind = 'hazard_notice' | 'tbm' | 'safety_education';
export type ErpDocumentKind =
  | WorkerAckDocumentKind
  | 'safety_work_log'
  | 'safety_inspection_log'
  | 'patrol_inspection_log';
export type WorkerMobileSessionStatus = 'active' | 'expired' | 'revoked' | 'blocked';
export type WorkerMobileTaskStatus = 'pending' | 'completed' | 'not_available';
export type WorkerMobileTaskAvailabilityReason =
  | 'excluded'
  | 'missing_document'
  | 'server_unavailable'
  | null;
export type SafetyInspectionChecklistStatus = 'good' | 'warning' | 'action_required';

export type SafetyContentType =
  | 'measurement_template'
  | 'safety_news'
  | 'disaster_case'
  | 'campaign_template'
  | 'doc7_reference_material'
  | 'ai_prompt'
  | 'legal_reference'
  | 'correction_result_option'
  | 'tbm_template'
  | 'notice_template'
  | 'education_template'
  | 'ppe_catalog'
  | 'worker_trade';

export interface SafetyTokenResponse {
  access_token: string;
  token_type: string;
}

export interface SafetyUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: SafetyUserRole;
  position: string | null;
  organization_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface SafetyUserSummary {
  id: string;
  name: string;
  email: string;
  role: SafetyUserRole;
}

export interface SafetyHeadquarterSummary {
  id: string;
  name: string;
}

export interface SafetyHeadquarterDetail extends SafetyHeadquarterSummary {
  business_registration_no: string | null;
  corporate_registration_no: string | null;
  license_no: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  address: string | null;
  memo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SafetySite {
  id: string;
  headquarter_id: string;
  headquarter: SafetyHeadquarterSummary | null;
  headquarter_detail: SafetyHeadquarterDetail | null;
  assigned_user: SafetyUserSummary | null;
  assigned_users?: SafetyUserSummary[] | null;
  active_assignment_count?: number | null;
  site_name: string;
  site_code: string | null;
  management_number: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  project_amount: number | null;
  manager_name: string | null;
  manager_phone: string | null;
  site_address: string | null;
  status: string;
  memo: string | null;
  contract_date?: string | null;
  contract_type?: string | null;
  contract_status?: string | null;
  total_rounds?: number | null;
  per_visit_amount?: number | null;
  total_contract_amount?: number | null;
  required_completion_fields?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SafetyContentItem {
  id: string;
  content_type: SafetyContentType;
  title: string;
  code: string | null;
  body: unknown;
  tags: string[];
  sort_order: number;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SafetySignatureRecord {
  name: string;
  company_name: string | null;
  signed_at: string | null;
  signature_data: string | null;
}

export interface SafetyInspectionChecklistItem {
  item: string;
  status: SafetyInspectionChecklistStatus;
  note: string;
}

export interface TbmDocumentPayload {
  topic: string;
  riskFactors: string[];
  countermeasures: string[];
  signatures: SafetySignatureRecord[];
}

export interface HazardNoticePayload {
  title: string;
  content: string;
  targetTrades: string[];
  effectiveFrom: string | null;
  effectiveTo: string | null;
  noticeItems: string[];
}

export interface SafetyEducationPayload {
  educationName: string;
  materialSummary: string;
  agenda: string[];
  signatures: SafetySignatureRecord[];
}

export interface SafetyWorkLogPayload {
  workerCount: number | null;
  mainTasks: string[];
  issues: string[];
  photos: string[];
}

export interface SafetyInspectionPayload {
  checklist: SafetyInspectionChecklistItem[];
  actions: string[];
  photos: string[];
}

export interface ErpDocumentPayloadMap {
  tbm: TbmDocumentPayload;
  hazard_notice: HazardNoticePayload;
  safety_education: SafetyEducationPayload;
  safety_work_log: SafetyWorkLogPayload;
  safety_inspection_log: SafetyInspectionPayload;
  patrol_inspection_log: SafetyInspectionPayload;
}

export interface SafetyReport {
  id: string;
  report_key: string;
  report_title: string;
  site_id: string;
  headquarter_id: string | null;
  assigned_user_id: string | null;
  visit_date: string | null;
  visit_round: number | null;
  total_round: number | null;
  progress_rate: number | null;
  status: SafetyReportStatus;
  payload_version: number;
  latest_revision_no: number;
  submitted_at: string | null;
  published_at: string | null;
  last_autosaved_at: string | null;
  report_type?: ControllerReportType | null;
  review?: ReportControllerReview | null;
  dispatch?: ReportDispatchMeta | null;
  document_kind?: ErpDocumentKind | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  payload: Record<string, unknown>;
}

export interface SafetyReportListItem {
  id: string;
  report_key: string;
  report_title: string;
  site_id: string;
  headquarter_id: string | null;
  assigned_user_id: string | null;
  visit_date: string | null;
  visit_round: number | null;
  total_round: number | null;
  progress_rate: number | null;
  status: SafetyReportStatus;
  payload_version: number;
  latest_revision_no: number;
  submitted_at: string | null;
  published_at: string | null;
  last_autosaved_at: string | null;
  report_type?: ControllerReportType | null;
  review?: ReportControllerReview | null;
  dispatch?: ReportDispatchMeta | null;
  document_kind?: ErpDocumentKind | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SafetyOperationalQuarterlyIndexItem {
  report_key: string;
  report_title: string;
  site_id: string;
  status: SafetyReportStatus;
  period_start_date: string;
  period_end_date: string;
  quarter_key: string;
  year: number;
  quarter: number;
  selected_report_count: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface SafetyOperationalBadWorkplaceIndexItem {
  report_key: string;
  report_title: string;
  site_id: string;
  status: SafetyReportStatus;
  report_month: string;
  reporter_user_id: string;
  reporter_name: string;
  source_finding_count: number;
  violation_count: number;
  created_at: string;
  updated_at: string;
}

export interface SafetySiteOperationalReportIndexResponse {
  quarterly_reports: SafetyOperationalQuarterlyIndexItem[];
  bad_workplace_reports: SafetyOperationalBadWorkplaceIndexItem[];
}

export interface SafetyBackendAdminReportRow {
  assignee_name: string;
  assignee_user_id: string;
  checker_user_id: string;
  controller_review: {
    checked_at?: string | null;
    checker_user_id?: string | null;
    note?: string | null;
    owner_user_id?: string | null;
    quality_status?: string | null;
  } | null;
  deadline_date: string;
  dispatch: {
    deadline_date?: string | null;
    dispatch_status?: string | null;
    sent_completed_at?: string | null;
    mailbox_account_id?: string | null;
    mail_thread_id?: string | null;
    message_id?: string | null;
    recipient?: string | null;
    read_at?: string | null;
    reply_at?: string | null;
    reply_summary?: string | null;
    sent_history?: Array<{
      id: string;
      memo?: string | null;
      sent_at: string;
      sent_by_user_id?: string | null;
    }>;
  } | null;
  dispatch_status: string | null;
  headquarter_id: string;
  headquarter_name: string;
  period_label: string;
  progress_rate: number | null;
  quality_status: string;
  report_key: string;
  report_month: string;
  report_title: string;
  report_type: string;
  route_param: string;
  site_id: string;
  site_name: string;
  sort_label: string;
  status: string;
  updated_at: string;
  visit_date: string;
}

export interface SafetyBackendAdminReportsResponse {
  limit: number;
  offset: number;
  rows: SafetyBackendAdminReportRow[];
  total: number;
}

export interface SafetyBackendInspectionSchedule {
  assignee_name: string;
  assignee_user_id: string;
  exception_memo: string;
  exception_reason_code: string;
  headquarter_id: string;
  headquarter_name: string;
  id: string;
  is_conflicted: boolean;
  is_out_of_window: boolean;
  is_overdue: boolean;
  linked_report_key: string;
  planned_date: string;
  round_no: number;
  site_id: string;
  site_name: string;
  status: string;
  window_end: string;
  window_start: string;
}

export interface SiteWorker {
  id: string;
  site_id: string;
  name: string;
  phone: string | null;
  company_name: string | null;
  trade: string | null;
  employment_type: SafetyEmploymentType;
  is_blocked: boolean;
  special_access: string | null;
  ppe_issues: string[];
  ack_exemptions: WorkerAckDocumentKind[];
  latest_attendance_at: string | null;
  latest_hazard_notice_ack_at: string | null;
  latest_tbm_ack_at: string | null;
  latest_education_ack_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerMobileSession {
  id: string;
  worker_id: string;
  site_id: string;
  token: string;
  entry_url: string;
  expires_at: string;
  revoked_at: string | null;
  issued_by: string | null;
  created_at: string;
  updated_at?: string | null;
  status: WorkerMobileSessionStatus;
}

export interface WorkerMobileTask {
  kind: ErpDocumentKind;
  label: string;
  status: WorkerMobileTaskStatus;
  availability_reason: WorkerMobileTaskAvailabilityReason;
  report_id: string | null;
  report_title: string | null;
  report_updated_at: string | null;
  completed_at: string | null;
  note: string | null;
}

export interface WorkerMobileSessionDetail {
  session: WorkerMobileSession;
  worker: Pick<SiteWorker, 'id' | 'name' | 'phone' | 'company_name' | 'trade'>;
  site: Pick<SafetySite, 'id' | 'site_name' | 'headquarter_id'>;
  tasks: WorkerMobileTask[];
}

export interface MobileAcknowledgementRecord {
  worker_id: string | null;
  worker_name: string | null;
  kind: ErpDocumentKind | null;
  signature_name: string | null;
  signature_data: string | null;
  note: string | null;
  acknowledged_at: string | null;
}

export interface SafetyPendingMobileAckWorker {
  worker_id: string;
  name: string;
  phone: string | null;
  company_name: string | null;
  trade: string | null;
}

export interface SafetyPendingMobileAckGroup {
  kind: WorkerAckDocumentKind;
  label: string;
  count: number;
  excluded_count: number;
  report_id: string | null;
  report_title: string | null;
  report_updated_at: string | null;
  workers: SafetyPendingMobileAckWorker[];
}

export interface SafetyDashboardDocumentSummary {
  report_id: string;
  report_key: string;
  report_title: string;
  document_kind: ErpDocumentKind | null;
  status: SafetyReportStatus;
  visit_date: string | null;
  updated_at: string | null;
}

export interface SafetySiteDashboard {
  site: SafetySite;
  registered_worker_count: number;
  blocked_worker_count: number;
  unacknowledged_notice_count: number;
  unsigned_tbm_count: number;
  incomplete_education_count: number;
  incomplete_inspection_document_count: number;
  latest_documents: SafetyDashboardDocumentSummary[];
  pending_mobile_ack_groups: SafetyPendingMobileAckGroup[];
}

export interface SafetyReportDraftContextItem {
  report: SafetyReportListItem;
  summary_items: string[];
}

export interface SafetyReportDraftContext {
  site_id: string;
  document_kind: ErpDocumentKind;
  previous_document: SafetyReportDraftContextItem | null;
  recent_documents: SafetyReportDraftContextItem[];
  recent_payload: Record<string, unknown>;
  unresolved_items: string[];
  unresolved_payload: Record<string, unknown>;
  template_items: string[];
  worker_summary: {
    registered_count: number;
    active_count: number;
    trade_names: string[];
    company_names: string[];
    worker_names: string[];
    employment_breakdown: Record<string, number>;
  };
}

export type SiteWorkerImportErrorRaw = Record<string, string | null | undefined>;

export interface SiteWorkerImportError {
  row_number: number;
  name: string | null;
  message: string;
  raw: SiteWorkerImportErrorRaw;
}

export interface SiteWorkerImportResponse {
  processed_count: number;
  created_count: number;
  failed_count: number;
  created_workers: SiteWorker[];
  errors: SiteWorkerImportError[];
}

export interface SafetyLegalReference {
  id: string;
  title: string;
  body: string;
  referenceMaterial1: string;
  referenceMaterial2: string;
}

export interface SafetyBackendScheduleListResponse {
  limit: number;
  month: string;
  offset: number;
  rows: SafetyBackendInspectionSchedule[];
  total: number;
}

export interface SafetyBackendK2bMatchCandidate {
  id: string;
  kind: 'headquarter' | 'site';
  label: string;
  reason: string;
  headquarter_id?: string | null;
  site_id?: string | null;
}

export interface SafetyBackendK2bPreviewRow {
  row_index: number;
  values: Record<string, string>;
  summary: string;
  suggested_action: string;
  exclusion_reason_code?: string | null;
  exclusion_reason?: string | null;
  in_scope?: boolean;
  duplicate_candidates: SafetyBackendK2bMatchCandidate[];
}

export interface SafetyBackendK2bSheetPreview {
  name: string;
  headers: string[];
  row_count: number;
  included_row_count: number;
  excluded_row_count: number;
  sample_rows: Record<string, string>[];
  suggested_mapping: Record<string, string>;
  included_rows: SafetyBackendK2bPreviewRow[];
  excluded_rows: SafetyBackendK2bPreviewRow[];
  summary: {
    create_count: number;
    update_headquarter_count: number;
    update_site_count: number;
    ambiguous_create_count: number;
  };
}

export interface SafetyBackendK2bImportPreview {
  job_id: string;
  file_name: string;
  created_at: string;
  sheet_names: string[];
  scope: {
    source_section: 'headquarters' | 'sites';
    headquarter_id?: string | null;
    site_id?: string | null;
    label: string;
  };
  sheets: SafetyBackendK2bSheetPreview[];
}

export interface SafetyBackendK2bApplyRowResult {
  row_index: number;
  action: 'create' | 'update_headquarter' | 'update_site';
  headquarter_id: string;
  headquarter_name: string;
  site_id: string;
  site_name: string;
  required_completion_fields: string[];
  message: string;
}

export interface SafetyBackendK2bApplyResult {
  summary: {
    created_headquarter_count: number;
    updated_headquarter_count: number;
    created_site_count: number;
    updated_site_count: number;
    completion_required_count: number;
  };
  rows: SafetyBackendK2bApplyRowResult[];
}

export interface SafetyBackendFieldSignatureRecord {
  id: string;
  site_id: string;
  schedule_id?: string | null;
  signed_by_user_id: string;
  signed_by_name: string;
  signed_at: string;
  image_data_url: string;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafetyBackendAdminAlert {
  created_at: string;
  description: string;
  href: string;
  id: string;
  report_key: string;
  schedule_id: string;
  severity: string;
  site_id: string;
  title: string;
  type: string;
}

export interface SafetyBackendMailAccount {
  id: string;
  provider: string;
  scope: string;
  connection_status: string;
  email: string;
  display_name: string;
  mailbox_label: string;
  is_active: boolean;
  is_default: boolean;
  user_id: string | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SafetyBackendMailProviderStatus {
  provider: string;
  enabled: boolean;
  default_redirect_uri: string;
  allowed_redirect_uris: string[];
  requested_redirect_uri: string;
  is_redirect_allowed: boolean;
  missing_fields: string[];
  message: string;
}

export interface SafetyBackendMailProviderStatusResponse {
  rows: SafetyBackendMailProviderStatus[];
}

export interface SafetyBackendMailThread {
  id: string;
  account_id: string;
  account_email: string;
  account_display_name: string;
  provider: string;
  scope: string;
  subject: string;
  snippet: string;
  participants: Array<{
    email: string;
    name?: string | null;
  }>;
  report_key: string | null;
  site_id: string | null;
  headquarter_id: string | null;
  last_message_at: string | null;
  unread_count: number;
  message_count: number;
  status: string;
  last_direction: string | null;
}

export interface SafetyBackendMailMessage {
  id: string;
  thread_id: string;
  account_id: string;
  direction: string;
  subject: string;
  body: string;
  body_preview: string;
  from_email: string;
  from_name: string | null;
  to: Array<{
    email: string;
    name?: string | null;
  }>;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  report_key: string | null;
  site_id: string | null;
  headquarter_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafetyBackendMailThreadDetail {
  thread: SafetyBackendMailThread;
  messages: SafetyBackendMailMessage[];
}

export interface SafetyBackendNotificationItem {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  href: string;
  is_read: boolean;
  is_important: boolean;
  source_type: string;
  source_id: string;
  created_at: string;
  site_id: string;
  report_key: string;
  thread_id: string;
  message_id: string;
}

export interface SafetyBackendNotificationFeedResponse {
  unread_count: number;
  unread_important_count: number;
  rows: SafetyBackendNotificationItem[];
}

export interface SafetyBackendSmsProviderStatus {
  provider: string;
  enabled: boolean;
  send_enabled: boolean;
  missing_fields: string[];
  sender: string;
  service_id: string;
  message: string;
}

export interface SafetyBackendSmsProviderStatusResponse {
  rows: SafetyBackendSmsProviderStatus[];
}

export interface SafetyBackendSmsMessage {
  id: string;
  provider: string;
  phone_number: string;
  content: string;
  subject: string;
  report_key: string | null;
  site_id: string | null;
  headquarter_id: string | null;
  sent_by_user_id: string | null;
  status: string;
  provider_message_id: string | null;
  provider_response: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SafetyBackendSmsSendResponse {
  ok: boolean;
  message: string;
  sms: SafetyBackendSmsMessage;
}

export interface SafetyBackendAdminOverviewResponse {
  alerts: SafetyBackendAdminAlert[];
  completion_rows: Array<{
    href: string;
    headquarter_name: string;
    missing_items: string[];
    site_id: string;
    site_name: string;
  }>;
  coverage_rows: Array<{
    item_count: number;
    label: string;
    missing_site_count: number;
  }>;
  deadline_signal_summary: {
    entries: Array<{
      count: number;
      href: string;
      key: string;
      label: string;
    }>;
    total_report_count: number;
  };
  deadline_rows: Array<{
    deadline_date: string;
    deadline_label: string;
    href: string;
    report_title: string;
    report_type_label: string;
    site_name: string;
    status_label: string;
  }>;
  metric_cards: Array<{
    href: string;
    label: string;
    meta: string;
    tone: 'default' | 'warning' | 'danger' | string;
    value: string;
  }>;
  overdue_site_rows: Array<{
    bad_workplace_overdue_count: number;
    headquarter_name: string;
    href: string;
    overdue_count: number;
    quarterly_overdue_count: number;
    report_kinds_label: string;
    site_name: string;
  }>;
  pending_review_rows: Array<{
    assignee_name: string;
    headquarter_name: string;
    href: string;
    quality_label: string;
    report_title: string;
    report_type_label: string;
    site_name: string;
    updated_at: string;
  }>;
  quarterly_material_summary: {
    entries: Array<{
      count: number;
      href: string;
      key: string;
      label: string;
    }>;
    missing_site_rows: Array<{
      education: {
        filled_count: number;
        missing_count: number;
        required_count: number;
      };
      headquarter_name: string;
      href: string;
      measurement: {
        filled_count: number;
        missing_count: number;
        required_count: number;
      };
      missing_labels: string[];
      quarter_key: string;
      quarter_label: string;
      site_id: string;
      site_name: string;
    }>;
    quarter_key: string;
    quarter_label: string;
    total_site_count: number;
  };
  schedule_rows: SafetyBackendInspectionSchedule[];
  site_status_summary: {
    entries: Array<{
      count: number;
      href: string;
      key: string;
      label: string;
    }>;
    total_site_count: number;
  };
  summary_rows: Array<{ label: string; meta: string; value: string }>;
  unsent_report_rows: Array<{
    assignee_name?: string;
    deadline_date: string;
    dispatch_status: string;
    headquarter_name: string;
    href: string;
    reference_date: string;
    report_key: string;
    report_title: string;
    report_type_label: string;
    site_id: string;
    site_name: string;
    unsent_days: number;
    visit_date: string;
  }>;
  worker_load_rows: Array<{
    assigned_site_count: number;
    href: string;
    load_label: string;
    overdue_count: number;
    user_name: string;
  }>;
}

export interface SafetyBackendAdminAnalyticsResponse {
  contract_type_rows: Array<{
    avg_per_visit_amount: number;
    label: string;
    site_count: number;
    total_contract_amount: number;
  }>;
  employee_rows: Array<{
    assigned_site_count: number;
    bad_workplace_submitted_count: number;
    completed_report_count: number;
    contract_contribution_revenue: number;
    overdue_count: number;
    quarterly_completed_count: number;
    total_assigned_rounds: number;
    user_id: string;
    user_name: string;
    visit_revenue: number;
    executed_rounds: number;
  }>;
  site_revenue_rows: Array<{
    contract_contribution_revenue: number;
    contract_type_label: string;
    executed_rounds: number;
    headquarter_name: string;
    href: string;
    site_name: string;
    visit_revenue: number;
  }>;
  stats: {
    average_per_visit_amount: number;
    completion_rate: number;
    counted_site_count: number;
    delay_rate: number;
    excluded_site_count: number;
  };
  summary_cards: Array<{
    label: string;
    meta: string;
    value: string;
  }>;
}

export interface SafetyBackendPhotoAsset {
  captured_at: string | null;
  content_type: string;
  created_at: string;
  exif_json: Record<string, unknown>;
  file_name: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  headquarter_id: string;
  headquarter_name: string;
  id: string;
  original_path: string;
  size_bytes: number;
  site_id: string;
  site_name: string;
  source_kind: 'album_upload' | 'legacy_import';
  source_report_key: string;
  source_document_key: string;
  source_slot_key: string;
  source_report_title: string;
  thumbnail_path: string;
  updated_at: string;
  uploaded_by_name: string;
  uploaded_by_user_id: string;
}

export interface SafetyBackendPhotoAssetListResponse {
  limit: number;
  offset: number;
  rows: SafetyBackendPhotoAsset[];
  total: number;
}

export interface SafetyMasterData {
  caseFeed: SafetyCaseCatalogItem[];
  safetyInfos: SafetyInfoCatalogItem[];
  legalReferences: SafetyLegalReference[];
  correctionResultOptions: string[];
  measurementTemplates: SafetyMeasurementTemplate[];
  doc7ReferenceMaterials: SafetyDoc7ReferenceMaterialCatalogItem[];
}

export interface SafetyHydratedData {
  user: SafetyUser;
  sites: InspectionSite[];
  sessions: InspectionSession[];
  masterData: SafetyMasterData;
}

export interface SafetyLoginInput {
  email: string;
  password: string;
}

export interface SafetyAiChartEntry {
  label: string;
  count: number;
}

export interface SafetyTechnicalGuidanceSeedFollowUp {
  id: string;
  source_session_id: string | null;
  source_finding_id: string | null;
  location: string;
  guidance_date: string;
  confirmation_date: string;
  before_photo_url: string;
  after_photo_url: string;
  result: string;
}

export interface SafetyTechnicalGuidanceSeed {
  next_visit_round: number;
  projection_version: number;
  open_followups: SafetyTechnicalGuidanceSeedFollowUp[];
  cumulative_accident_entries: SafetyAiChartEntry[];
  cumulative_agent_entries: SafetyAiChartEntry[];
  previous_authoritative_report: SafetyReportListItem | null;
}

export interface SafetyQuarterlySummarySeedSourceReport {
  report_key: string;
  report_title: string;
  guidance_date: string;
  drafter: string;
  progress_rate: string;
  finding_count: number;
  improved_count: number;
}

export interface SafetyQuarterlySummarySeedImplementationRow {
  session_id: string;
  report_title: string;
  report_date: string;
  report_number: number;
  drafter: string;
  progress_rate: string;
  finding_count: number;
  improved_count: number;
  note: string;
}

export interface SafetyQuarterlySummarySeedFuturePlan {
  id: string;
  process_name: string;
  hazard: string;
  countermeasure: string;
  note: string;
  source: string;
}

export interface SafetyQuarterlySummarySeed {
  period_start_date: string;
  period_end_date: string;
  selected_report_keys: string[];
  source_reports: SafetyQuarterlySummarySeedSourceReport[];
  last_calculated_at: string;
  implementation_rows: SafetyQuarterlySummarySeedImplementationRow[];
  accident_stats: SafetyAiChartEntry[];
  causative_stats: SafetyAiChartEntry[];
  future_plans: SafetyQuarterlySummarySeedFuturePlan[];
  major_measures: string[];
}

export interface SafetyAiHazardFindingInput {
  location: string;
  hazardDescription?: string;
  likelihood: string;
  severity: string;
  riskLevel: string;
  accidentType: string;
  causativeAgentKey: string;
  inspector: string;
  emphasis: string;
  improvementPlan: string;
  improvementRequest?: string;
  legalReferenceId: string;
  legalReferenceTitle: string;
  referenceLawTitles?: string[];
  referenceMaterial1: string;
  referenceMaterial2: string;
  referenceMaterialImage?: string;
  referenceMaterialDescription?: string;
  referenceCatalogAccidentType: string;
  referenceCatalogCausativeAgentKey: string;
  carryForward: boolean;
  metadata?: string;
}

export interface SafetyDoc5SummaryRequest {
  currentAccidentEntries: SafetyAiChartEntry[];
  cumulativeAccidentEntries: SafetyAiChartEntry[];
  currentAgentEntries: SafetyAiChartEntry[];
  cumulativeAgentEntries: SafetyAiChartEntry[];
  findings: SafetyAiHazardFindingInput[];
}

export interface SafetyDoc11EducationRequest {
  topic: string;
  attendeeCount: string;
  materialName: string;
}

export interface SafetyAiTextResponse {
  text: string;
}

export interface SafetyHazardAnalysisItem {
  metadata: string;
  objects: string[];
  risk_factor: string[];
  improvements: string[];
  laws: string[];
  likelihood: number;
  severity: number;
}

export interface SafetyCausativeAgentsResponse {
  agents: Record<string, boolean>;
  reasoning: string;
}

export interface SafetyUpsertReportInput {
  report_key: string;
  report_title: string;
  site_id: string;
  headquarter_id?: string | null;
  assigned_user_id?: string | null;
  visit_date?: string | null;
  visit_round?: number | null;
  total_round?: number | null;
  progress_rate?: number | null;
  document_kind?: ErpDocumentKind | null;
  payload: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status?: SafetyReportStatus;
  create_revision?: boolean;
  revision_reason?: 'autosave' | 'manual_save' | 'submit' | 'publish';
}

export interface SafetyReportStatusUpdateInput {
  status: SafetyReportStatus;
  create_revision?: boolean;
  revision_reason?: 'autosave' | 'manual_save' | 'submit' | 'publish';
}

export interface SiteWorkerUpsertInput {
  site_id?: string;
  name: string;
  phone?: string | null;
  company_name?: string | null;
  trade?: string | null;
  employment_type: SafetyEmploymentType;
  special_access?: string | null;
  ppe_issues?: string[];
  ack_exemptions?: WorkerAckDocumentKind[];
}

export interface WorkerMobileTaskAcknowledgeInput {
  kind: ErpDocumentKind;
  report_id: string | null;
  signature_name: string | null;
  signature_data: string | null;
  note: string | null;
}
