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

export type SafetyContentType =
  | 'measurement_template'
  | 'safety_news'
  | 'disaster_case'
  | 'campaign_template'
  | 'doc7_reference_material';

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
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SafetyMasterData {
  caseFeed: SafetyCaseCatalogItem[];
  safetyInfos: SafetyInfoCatalogItem[];
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

export interface SafetyAiHazardFindingInput {
  location: string;
  likelihood: string;
  severity: string;
  riskLevel: string;
  accidentType: string;
  causativeAgentKey: string;
  inspector: string;
  emphasis: string;
  improvementPlan: string;
  legalReferenceId: string;
  legalReferenceTitle: string;
  referenceMaterial1: string;
  referenceMaterial2: string;
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
  payload: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status?: SafetyReportStatus;
  create_revision?: boolean;
  revision_reason?: 'autosave' | 'manual_save' | 'submit' | 'publish';
}
