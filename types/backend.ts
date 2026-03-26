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

export type SafetyContentType =
  | 'hazard_category'
  | 'accident_type'
  | 'measurement_template'
  | 'safety_news'
  | 'disaster_case'
  | 'campaign_template'
  | 'ai_prompt'
  | 'legal_reference'
  | 'correction_result_option';

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
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  payload: Record<string, unknown>;
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
  payload: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status?: SafetyReportStatus;
  create_revision?: boolean;
  revision_reason?: 'autosave' | 'manual_save' | 'submit' | 'publish';
}

