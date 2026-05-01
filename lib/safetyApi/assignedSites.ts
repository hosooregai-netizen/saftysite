import { mergeAdminSiteSnapshots, normalizeInspectionSite } from '@/constants/inspectionSession/normalizeSite';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
import type { SafetyAssignedSiteSummary, SafetySite } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';

export function expandAssignedSiteSummaryToSafetySite(
  summary: SafetyAssignedSiteSummary,
): SafetySite {
  return {
    id: summary.id,
    headquarter_id: summary.headquarter_id,
    headquarter: summary.headquarter,
    headquarter_detail: null,
    assigned_user: summary.assigned_user,
    assigned_users: [],
    active_assignment_count: summary.active_assignment_count,
    site_name: summary.site_name,
    site_code: null,
    management_number: null,
    labor_office: null,
    guidance_officer_name: null,
    project_start_date: null,
    project_end_date: null,
    project_amount: null,
    project_scale: null,
    project_kind: null,
    client_management_number: null,
    client_business_name: summary.client_business_name,
    client_representative_name: null,
    client_corporate_registration_no: null,
    client_business_registration_no: null,
    order_type_division: null,
    technical_guidance_kind: null,
    manager_name: null,
    inspector_name: null,
    contract_contact_name: null,
    manager_phone: null,
    site_contact_email: null,
    site_managers: [],
    primary_site_manager: null,
    client_contacts: [],
    is_high_risk_site: false,
    site_address: summary.site_address,
    status: 'active',
    pause_start_date: null,
    memo: null,
    contract_date: null,
    contract_start_date: null,
    contract_end_date: null,
    contract_signed_date: null,
    contract_type: null,
    contract_status: null,
    total_rounds: summary.total_rounds,
    guidance_max_visit_round: null,
    per_visit_amount: null,
    total_contract_amount: null,
    last_visit_date: null,
    required_completion_fields: [],
    dispatch_policy: null,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
  };
}

export function mergeAssignedSiteSummaryIntoSafetySite(
  current: SafetySite | null | undefined,
  summarySite: SafetySite,
): SafetySite {
  if (!current) {
    return summarySite;
  }

  return {
    ...current,
    headquarter_id: summarySite.headquarter_id || current.headquarter_id,
    headquarter: summarySite.headquarter ?? current.headquarter,
    assigned_user: summarySite.assigned_user ?? current.assigned_user,
    active_assignment_count:
      summarySite.active_assignment_count ?? current.active_assignment_count,
    site_name: summarySite.site_name || current.site_name,
    client_business_name:
      summarySite.client_business_name ?? current.client_business_name,
    site_address: summarySite.site_address ?? current.site_address,
    total_rounds: summarySite.total_rounds ?? current.total_rounds,
    created_at: summarySite.created_at || current.created_at,
    updated_at: summarySite.updated_at || current.updated_at,
  };
}

export function mergeAssignedSiteDetail(
  current: SafetySite | null | undefined,
  detailedSite: SafetySite,
): SafetySite {
  if (!current) {
    return detailedSite;
  }

  return {
    ...current,
    ...detailedSite,
    headquarter: detailedSite.headquarter ?? current.headquarter,
    headquarter_detail: detailedSite.headquarter_detail ?? current.headquarter_detail,
    assigned_user: detailedSite.assigned_user ?? current.assigned_user,
    assigned_users: detailedSite.assigned_users ?? current.assigned_users,
    active_assignment_count:
      detailedSite.active_assignment_count ?? current.active_assignment_count,
    site_name: detailedSite.site_name || current.site_name,
    client_business_name:
      detailedSite.client_business_name ?? current.client_business_name,
    site_address: detailedSite.site_address ?? current.site_address,
    total_rounds: detailedSite.total_rounds ?? current.total_rounds,
    created_at: detailedSite.created_at || current.created_at,
    updated_at: detailedSite.updated_at || current.updated_at,
  };
}

export function mergeAssignedSafetySiteIntoInspectionSite(
  current: InspectionSite | null | undefined,
  nextSite: SafetySite,
): InspectionSite {
  const mappedSite = mapSafetySiteToInspectionSite(nextSite);
  if (!current) {
    return mappedSite;
  }

  return normalizeInspectionSite({
    ...current,
    headquarterId: mappedSite.headquarterId || current.headquarterId,
    totalRounds: mappedSite.totalRounds ?? current.totalRounds,
    title: mappedSite.title || current.title,
    customerName: mappedSite.customerName || current.customerName,
    siteName: mappedSite.siteName || current.siteName,
    assigneeName: mappedSite.assigneeName || current.assigneeName,
    adminSiteSnapshot: mergeAdminSiteSnapshots(
      mappedSite.adminSiteSnapshot,
      current.adminSiteSnapshot,
    ),
    createdAt: mappedSite.createdAt || current.createdAt,
    updatedAt: mappedSite.updatedAt || current.updatedAt,
  });
}

export function mergeAssignedSafetySitesIntoInspectionSites(
  currentSites: InspectionSite[],
  nextSites: SafetySite[],
): InspectionSite[] {
  const currentById = new Map(currentSites.map((site) => [site.id, site]));
  return nextSites.map((site) =>
    mergeAssignedSafetySiteIntoInspectionSite(currentById.get(site.id) ?? null, site),
  );
}

export function upsertAssignedSafetySitesIntoInspectionSites(
  currentSites: InspectionSite[],
  nextSites: SafetySite[],
): InspectionSite[] {
  const nextById = new Map(currentSites.map((site) => [site.id, site]));
  nextSites.forEach((site) => {
    nextById.set(
      site.id,
      mergeAssignedSafetySiteIntoInspectionSite(nextById.get(site.id) ?? null, site),
    );
  });
  return Array.from(nextById.values());
}
