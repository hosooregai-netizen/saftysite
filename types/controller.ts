import type {
  SiteDispatchPolicy,
  SafetyHeadquarterLifecycleStatus,
  SafetyContentItem,
  SafetyContentType,
  SafetySite,
  SafetyUser,
  SafetyUserRole,
} from '@/types/backend';

export type SafetySiteStatus = 'planned' | 'active' | 'closed' | 'deleted';

export interface SafetyHeadquarter {
  id: string;
  name: string;
  management_number: string | null;
  opening_number: string | null;
  business_registration_no: string | null;
  corporate_registration_no: string | null;
  license_no: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  address: string | null;
  memo: string | null;
  is_active: boolean;
  lifecycle_status?: SafetyHeadquarterLifecycleStatus;
  created_at: string;
  updated_at: string;
}

export interface SafetyAssignmentSummary {
  id: string;
  name: string;
}

export interface SafetyAssignment {
  id: string;
  user_id: string;
  site_id: string;
  role_on_site: string;
  memo: string | null;
  is_active: boolean;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  user: SafetyAssignmentSummary | null;
  site: SafetyAssignmentSummary | null;
}

export interface SafetyUserCreateInput {
  auto_provisioned_from_excel?: boolean;
  email: string;
  is_active?: boolean;
  name: string;
  password: string;
  phone?: string | null;
  role: SafetyUserRole;
  position?: string | null;
  organization_name?: string | null;
}

export interface SafetyUserUpdateInput {
  auto_provisioned_from_excel?: boolean | null;
  email?: string | null;
  is_active?: boolean | null;
  name?: string | null;
  phone?: string | null;
  role?: SafetyUserRole | null;
  position?: string | null;
  organization_name?: string | null;
}

export interface SafetyHeadquarterInput {
  name: string;
  management_number?: string | null;
  opening_number?: string | null;
  business_registration_no?: string | null;
  corporate_registration_no?: string | null;
  license_no?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  memo?: string | null;
  is_active?: boolean;
  lifecycle_status?: SafetyHeadquarterLifecycleStatus;
}

export type SafetyHeadquarterUpdateInput = Partial<SafetyHeadquarterInput>;

export interface SafetySiteInput {
  headquarter_id: string;
  site_name: string;
  site_code?: string | null;
  management_number?: string | null;
  labor_office?: string | null;
  guidance_officer_name?: string | null;
  project_start_date?: string | null;
  project_end_date?: string | null;
  project_amount?: number | null;
  project_scale?: string | null;
  project_kind?: string | null;
  client_management_number?: string | null;
  client_business_name?: string | null;
  client_representative_name?: string | null;
  client_corporate_registration_no?: string | null;
  client_business_registration_no?: string | null;
  order_type_division?: string | null;
  technical_guidance_kind?: string | null;
  manager_name?: string | null;
  inspector_name?: string | null;
  contract_contact_name?: string | null;
  manager_phone?: string | null;
  site_contact_email?: string | null;
  is_high_risk_site?: boolean | null;
  site_address?: string | null;
  contract_date?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  contract_signed_date?: string | null;
  contract_type?: string | null;
  contract_status?: string | null;
  total_rounds?: number | null;
  per_visit_amount?: number | null;
  total_contract_amount?: number | null;
  required_completion_fields?: string[] | null;
  dispatch_policy?: SiteDispatchPolicy | null;
  status?: SafetySiteStatus;
  lifecycle_status?: SafetySiteStatus;
  memo?: string | null;
}

export type SafetySiteUpdateInput = Partial<SafetySiteInput>;

export interface SafetyAssignmentInput {
  user_id: string;
  site_id: string;
  role_on_site?: string;
  memo?: string | null;
}

export interface SafetyAssignmentUpdateInput {
  role_on_site?: string | null;
  memo?: string | null;
  is_active?: boolean | null;
}

export interface SafetyContentItemInput {
  content_type: SafetyContentType;
  title: string;
  code?: string | null;
  body: Record<string, unknown> | string;
  tags?: string[];
  sort_order?: number;
  effective_from?: string | null;
  effective_to?: string | null;
  is_active?: boolean;
}

export type SafetyContentItemUpdateInput = Partial<
  Omit<SafetyContentItemInput, 'content_type'>
>;

export interface ControllerDashboardData {
  users: SafetyUser[];
  headquarters: SafetyHeadquarter[];
  sites: SafetySite[];
  assignments: SafetyAssignment[];
  contentItems: SafetyContentItem[];
}
