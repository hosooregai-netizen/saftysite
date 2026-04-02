import type {
  CaseFeedItem,
  InspectionSession,
  InspectionSite,
  SafetyInfoItem,
} from '@/types/inspectionSession';

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
  | 'hazard_category'
  | 'accident_type'
  | 'measurement_template'
  | 'safety_news'
  | 'disaster_case'
  | 'campaign_template'
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
  document_kind?: ErpDocumentKind | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export interface SafetyMasterData {
  caseFeed: SafetyCaseCatalogItem[];
  safetyInfos: SafetyInfoCatalogItem[];
  legalReferences: SafetyLegalReference[];
  correctionResultOptions: string[];
  measurementTemplates: SafetyMeasurementTemplate[];
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
