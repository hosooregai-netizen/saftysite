import {
  asRecord,
  createEmptyAdminSiteSnapshot,
  createTimestamp,
  generateId,
  normalizeBoolean,
  normalizeText,
  normalizeTimestamp,
} from '@/constants/inspectionSession/shared';
import type { AdminSiteSnapshot, InspectionSite } from '@/types/inspectionSession';

const SNAPSHOT_PLACEHOLDER_PATTERN = /^(?:-|\u2013|\u2014)+$/;

export function isMeaningfulSnapshotText(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  return Boolean(normalized) && !SNAPSHOT_PLACEHOLDER_PATTERN.test(normalized);
}

function normalizeSnapshotText(value: unknown): string {
  if (isMeaningfulSnapshotText(value)) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

function hasOwn(source: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function pickText(sources: Record<string, unknown>[], ...keys: string[]): string {
  for (const source of sources) {
    for (const key of keys) {
      const value = normalizeSnapshotText(source[key]);
      if (value) {
        return value;
      }
    }
  }

  return '';
}

function pickBoolean(sources: Record<string, unknown>[], ...keys: string[]): boolean {
  for (const source of sources) {
    for (const key of keys) {
      if (hasOwn(source, key)) {
        return normalizeBoolean(source[key]);
      }
    }
  }

  return false;
}

function formatNormalizedDateRange(start: unknown, end: unknown): string {
  const normalizedStart = normalizeSnapshotText(start);
  const normalizedEnd = normalizeSnapshotText(end);
  if (normalizedStart && normalizedEnd) {
    return `${normalizedStart} ~ ${normalizedEnd}`;
  }

  return normalizedStart || normalizedEnd;
}

export function normalizeAdminSiteSnapshot(
  raw: unknown,
  fallback?: unknown,
): AdminSiteSnapshot {
  const primary = asRecord(raw);
  const secondary = asRecord(fallback);
  const sources = [primary, secondary];

  const customerName = pickText(
    sources,
    'customerName',
    'customer_name',
    'clientBusinessName',
    'client_business_name',
    'companyName',
    'company_name',
  );
  const clientBusinessName = pickText(
    sources,
    'clientBusinessName',
    'client_business_name',
    'companyName',
    'company_name',
    'customerName',
    'customer_name',
  );

  return createEmptyAdminSiteSnapshot({
    customerName,
    clientBusinessName,
    clientRepresentativeName: pickText(
      sources,
      'clientRepresentativeName',
      'client_representative_name',
      'representativeName',
      'representative_name',
    ),
    siteName: pickText(sources, 'siteName', 'site_name', 'title'),
    assigneeName: pickText(sources, 'assigneeName', 'assignee_name', 'drafter'),
    siteManagementNumber: pickText(
      sources,
      'siteManagementNumber',
      'site_management_number',
      'managementNumber',
      'management_number',
      'headquarterManagementNumber',
      'headquarter_management_number',
    ),
    businessStartNumber: pickText(
      sources,
      'businessStartNumber',
      'business_start_number',
      'openingNumber',
      'opening_number',
      'businessStartNo',
      'business_start_no',
      'siteCode',
      'site_code',
    ),
    constructionPeriod:
      pickText(sources, 'constructionPeriod', 'construction_period') ||
      formatNormalizedDateRange(
        pickText(sources, 'project_start_date', 'projectStartDate'),
        pickText(sources, 'project_end_date', 'projectEndDate'),
      ),
    constructionAmount: pickText(
      sources,
      'constructionAmount',
      'construction_amount',
      'projectAmount',
      'project_amount',
    ),
    isHighRiskSite: pickBoolean(sources, 'isHighRiskSite', 'is_high_risk_site'),
    siteManagerName: pickText(
      sources,
      'siteManagerName',
      'site_manager_name',
      'managerName',
      'manager_name',
    ),
    siteManagerPhone: pickText(
      sources,
      'siteManagerPhone',
      'site_manager_phone',
      'managerPhone',
      'manager_phone',
    ),
    siteContactEmail: pickText(
      sources,
      'siteContactEmail',
      'site_contact_email',
      'contactEmail',
      'contact_email',
    ),
    siteAddress: pickText(sources, 'siteAddress', 'site_address'),
    companyName:
      pickText(sources, 'companyName', 'company_name') ||
      clientBusinessName ||
      customerName,
    corporationRegistrationNumber: pickText(
      sources,
      'corporationRegistrationNumber',
      'corporation_registration_number',
      'corporateRegistrationNumber',
      'corporate_registration_number',
      'corporate_registration_no',
    ),
    businessRegistrationNumber: pickText(
      sources,
      'businessRegistrationNumber',
      'business_registration_number',
      'business_registration_no',
    ),
    licenseNumber: pickText(
      sources,
      'licenseNumber',
      'license_number',
      'license_no',
    ),
    headquartersContact:
      pickText(sources, 'headquartersContact', 'headquarters_contact') ||
      pickText(sources, 'contactPhone', 'contact_phone') ||
      pickText(sources, 'contactName', 'contact_name'),
    headquartersAddress: pickText(
      sources,
      'headquartersAddress',
      'headquarters_address',
      'address',
    ),
  });
}

export function mergeAdminSiteSnapshots(
  primary: unknown,
  fallback?: unknown,
): AdminSiteSnapshot {
  const normalizedPrimary = normalizeAdminSiteSnapshot(primary);
  const normalizedFallback = normalizeAdminSiteSnapshot(fallback);
  const merged = createEmptyAdminSiteSnapshot({ ...normalizedFallback });
  const mutableMerged = merged as unknown as Record<string, string | boolean>;

  (Object.keys(merged) as Array<keyof AdminSiteSnapshot>).forEach((key) => {
    const value = normalizedPrimary[key];

    if (typeof value === 'string') {
      if (isMeaningfulSnapshotText(value)) {
        mutableMerged[key] = value;
      }
      return;
    }

    if (typeof value === 'boolean') {
      mutableMerged[key] = value || normalizedFallback[key];
    }
  });

  return merged;
}

export function normalizeInspectionSite(raw: unknown): InspectionSite {
  const source = asRecord(raw);
  const snapshotSource =
    'adminSiteSnapshot' in source ? asRecord(source.adminSiteSnapshot) : source;
  const snapshot = mergeAdminSiteSnapshots(snapshotSource, source);
  const timestamp = createTimestamp();

  return {
    id: normalizeText(source.id) || generateId('site'),
    headquarterId:
      normalizeText(source.headquarterId) || normalizeText(source.headquarter_id),
    title:
      normalizeText(source.title) ||
      snapshot.siteName ||
      snapshot.customerName ||
      '현장',
    customerName: snapshot.customerName,
    siteName: snapshot.siteName,
    assigneeName: snapshot.assigneeName,
    adminSiteSnapshot: snapshot,
    createdAt: normalizeTimestamp(source.createdAt ?? source.created_at, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt ?? source.updated_at, timestamp),
  };
}
