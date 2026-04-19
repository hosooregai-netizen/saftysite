import type { SafetySite } from '@/types/backend';
import type { AdminSiteSnapshot, InspectionSite } from '@/types/inspectionSession';
import {
  formatDateRange,
  formatProjectAmount,
  normalizeMapperText,
} from './utils';

const DEFAULT_SITE_TOTAL_ROUNDS = 8;

function buildHeadquarterContact(site: SafetySite): string {
  const contactName = normalizeMapperText(site.headquarter_detail?.contact_name);
  const contactPhone = normalizeMapperText(site.headquarter_detail?.contact_phone);

  return contactPhone || contactName;
}

export function mapSafetySiteToAdminSnapshot(site: SafetySite): AdminSiteSnapshot {
  const headquarterName =
    normalizeMapperText(site.headquarter_detail?.name) ||
    normalizeMapperText(site.headquarter?.name);
  const assignedUserNames = (site.assigned_users || [])
    .map((user) => normalizeMapperText(user.name))
    .filter(Boolean);
  const assigneeName =
    assignedUserNames.length > 0
      ? assignedUserNames.join(', ')
      : normalizeMapperText(site.assigned_user?.name);

  return {
    customerName:
      normalizeMapperText(site.client_business_name) ||
      headquarterName,
    clientBusinessName: normalizeMapperText(site.client_business_name),
    clientRepresentativeName: normalizeMapperText(site.client_representative_name),
    siteName: normalizeMapperText(site.site_name),
    assigneeName,
    siteManagementNumber:
      normalizeMapperText(site.headquarter_detail?.management_number) ||
      normalizeMapperText(site.management_number),
    businessStartNumber:
      normalizeMapperText(site.headquarter_detail?.opening_number) ||
      normalizeMapperText(site.site_code),
    constructionPeriod: formatDateRange(site.project_start_date, site.project_end_date),
    constructionAmount: formatProjectAmount(site.project_amount),
    isHighRiskSite: Boolean(site.is_high_risk_site),
    siteManagerName: normalizeMapperText(site.manager_name),
    siteManagerPhone: normalizeMapperText(site.manager_phone),
    siteContactEmail: normalizeMapperText(site.site_contact_email),
    siteAddress: normalizeMapperText(site.site_address),
    companyName:
      normalizeMapperText(site.client_business_name) ||
      headquarterName,
    corporationRegistrationNumber: normalizeMapperText(
      site.headquarter_detail?.corporate_registration_no
    ),
    businessRegistrationNumber: normalizeMapperText(
      site.headquarter_detail?.business_registration_no
    ),
    licenseNumber: normalizeMapperText(site.headquarter_detail?.license_no),
    headquartersContact: buildHeadquarterContact(site),
    headquartersAddress: normalizeMapperText(site.headquarter_detail?.address),
  };
}

export function mapSafetySiteToInspectionSite(site: SafetySite): InspectionSite {
  const adminSiteSnapshot = mapSafetySiteToAdminSnapshot(site);
  const resolvedTotalRounds =
    typeof site.total_rounds === 'number' && site.total_rounds > 0
      ? site.total_rounds
      : DEFAULT_SITE_TOTAL_ROUNDS;

  return {
    id: site.id,
    headquarterId: site.headquarter_id,
    totalRounds: resolvedTotalRounds,
    title: adminSiteSnapshot.siteName || adminSiteSnapshot.customerName || '현장',
    customerName: adminSiteSnapshot.customerName,
    siteName: adminSiteSnapshot.siteName,
    assigneeName: adminSiteSnapshot.assigneeName,
    adminSiteSnapshot,
    createdAt: site.created_at,
    updatedAt: site.updated_at,
  };
}
