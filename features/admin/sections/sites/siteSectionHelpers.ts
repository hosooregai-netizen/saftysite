'use client';

import {
  normalizeSiteStatusForDisplay,
  parseOptionalNumber,
  toNullableText,
} from '@/lib/admin';
import type { TableSortState } from '@/types/admin';
import type {
  SafetySiteInput,
  SafetySiteStatus,
  SafetySiteUpdateInput,
  SafetyAssignment,
  SafetyHeadquarter,
  SafetyHeadquarterInput,
} from '@/types/controller';
import type { SafetySite, SafetyUser } from '@/types/backend';
import {
  getPrimarySiteManagerEmail,
  getPrimarySiteManagerName,
  getPrimarySiteManagerPhone,
  normalizeSafetyClientContacts,
  normalizeSafetySiteManagers,
} from '@/lib/siteContacts';

export interface SiteManagerFormRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

export interface ClientContactFormRow {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface SitesSectionProps {
  busy: boolean;
  canDelete: boolean;
  currentUserId: string;
  onCreate: (input: SafetySiteInput) => Promise<SafetySite>;
  onCreateHeadquarter?: (input: SafetyHeadquarterInput) => Promise<SafetyHeadquarter>;
  onUpdate: (id: string, input: SafetySiteUpdateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onUnassignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  title?: string;
  titleActionHref?: string;
  titleActionLabel?: string;
  emptyMessage?: string;
  showHeader?: boolean;
  lockedHeadquarterId?: string | null;
  onSelectSiteEntry?: (site: SafetySite) => void;
  initialStatusFilter?: 'all' | SafetySiteStatus;
  autoEditSiteId?: string | null;
}

export interface SiteFormState {
  headquarter_id: string;
  management_number: string;
  site_code: string;
  site_name: string;
  status: SafetySiteStatus;
  labor_office: string;
  guidance_officer_name: string;
  site_address: string;
  site_contact_email: string;
  site_managers: SiteManagerFormRow[];
  client_contacts: ClientContactFormRow[];
  is_high_risk_site: boolean;
  pause_start_date: string;
  project_amount: string;
  project_start_date: string;
  project_end_date: string;
  project_scale: string;
  project_kind: string;
  client_management_number: string;
  client_business_name: string;
  client_representative_name: string;
  client_corporate_registration_no: string;
  client_business_registration_no: string;
  order_type_division: string;
  technical_guidance_kind: string;
  total_contract_amount: string;
  total_rounds: string;
  per_visit_amount: string;
  contract_start_date: string;
  contract_end_date: string;
  contract_signed_date: string;
  contract_status: string;
  contract_type: string;
  contract_contact_name: string;
  inspector_name: string;
  manager_name: string;
  manager_phone: string;
  memo: string;
}

export type SiteAssignmentFilter = 'all' | 'unassigned';

export const EMPTY_FORM: SiteFormState = {
  headquarter_id: '',
  management_number: '',
  site_code: '',
  site_name: '',
  status: 'planned',
  labor_office: '',
  guidance_officer_name: '',
  site_address: '',
  site_contact_email: '',
  site_managers: [],
  client_contacts: [],
  is_high_risk_site: false,
  pause_start_date: '',
  project_amount: '',
  project_start_date: '',
  project_end_date: '',
  project_scale: '',
  project_kind: '',
  client_management_number: '',
  client_business_name: '',
  client_representative_name: '',
  client_corporate_registration_no: '',
  client_business_registration_no: '',
  order_type_division: '',
  technical_guidance_kind: '',
  total_contract_amount: '',
  total_rounds: '',
  per_visit_amount: '',
  contract_start_date: '',
  contract_end_date: '',
  contract_signed_date: '',
  contract_status: '',
  contract_type: '',
  contract_contact_name: '',
  inspector_name: '',
  manager_name: '',
  manager_phone: '',
  memo: '',
};

export function formatAssignedUsers(users: SafetyUser[]) {
  if (users.length === 0) return '-';
  return users.map((user) => user.name).join(', ');
}

export function shouldIgnoreRowClick(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [role="button"], [role="menu"], [role="menuitem"]',
      ),
    )
  );
}

export function isPinnedTestSite(site: SafetySite) {
  const labels = [
    site.site_name,
    site.headquarter_detail?.name,
    site.headquarter?.name,
  ]
    .filter(Boolean)
    .join(' ');
  return labels.includes('테스트');
}

let contactRowSequence = 0;

function createContactRowId(prefix: string) {
  contactRowSequence += 1;
  return `${prefix}-${Date.now()}-${contactRowSequence}`;
}

export function createEmptySiteManagerRow(isPrimary = false): SiteManagerFormRow {
  return {
    id: createContactRowId('site-manager'),
    name: '',
    phone: '',
    email: '',
    is_primary: isPrimary,
  };
}

export function createEmptyClientContactRow(): ClientContactFormRow {
  return {
    id: createContactRowId('client-contact'),
    name: '',
    phone: '',
    email: '',
  };
}

function hasContactValue(contact: Pick<ClientContactFormRow, 'name' | 'phone' | 'email'>) {
  return Boolean(contact.name.trim() || contact.phone.trim() || contact.email.trim());
}

function normalizeSiteManagerPayload(rows: SiteManagerFormRow[]) {
  const contacts = rows
    .map((row, index) => ({
      id: row.id || `site-manager-${index + 1}`,
      name: row.name.trim(),
      phone: row.phone.trim(),
      email: row.email.trim(),
      is_primary: Boolean(row.is_primary),
    }))
    .filter(hasContactValue);

  if (contacts.length === 0) {
    return [];
  }

  let primarySeen = false;
  const normalized = contacts.map((contact) => {
    const isPrimary = contact.is_primary && !primarySeen;
    if (isPrimary) primarySeen = true;
    return { ...contact, is_primary: isPrimary };
  });
  if (!primarySeen) {
    normalized[0] = { ...normalized[0], is_primary: true };
  }
  return normalized;
}

function normalizeClientContactPayload(rows: ClientContactFormRow[]) {
  return rows
    .map((row, index) => ({
      id: row.id || `client-contact-${index + 1}`,
      name: row.name.trim(),
      phone: row.phone.trim(),
      email: row.email.trim(),
    }))
    .filter(hasContactValue);
}

export function createEditForm(site: SafetySite): SiteFormState {
  const siteManagers = normalizeSafetySiteManagers(site).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    is_primary: contact.is_primary,
  }));
  const clientContacts = normalizeSafetyClientContacts(site).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
  }));
  const primaryManager = siteManagers.find((contact) => contact.is_primary) ?? siteManagers[0];
  return {
    headquarter_id: site.headquarter_id,
    management_number: site.management_number ?? '',
    site_code: site.site_code ?? '',
    site_name: site.site_name,
    status: normalizeSiteStatusForDisplay(site.status),
    labor_office: site.labor_office ?? '',
    guidance_officer_name: site.guidance_officer_name ?? '',
    site_address: site.site_address ?? '',
    project_amount: site.project_amount ? String(site.project_amount) : '',
    project_start_date: site.project_start_date ?? '',
    project_end_date: site.project_end_date ?? '',
    project_scale: site.project_scale ?? '',
    project_kind: site.project_kind ?? '',
    site_contact_email: primaryManager?.email ?? site.site_contact_email ?? '',
    site_managers: siteManagers,
    client_contacts: clientContacts,
    is_high_risk_site: Boolean(site.is_high_risk_site),
    pause_start_date: site.pause_start_date ?? '',
    client_management_number: site.client_management_number ?? '',
    client_business_name: site.client_business_name ?? '',
    client_representative_name: site.client_representative_name ?? '',
    client_corporate_registration_no: site.client_corporate_registration_no ?? '',
    client_business_registration_no: site.client_business_registration_no ?? '',
    order_type_division: site.order_type_division ?? '',
    technical_guidance_kind: site.technical_guidance_kind ?? '',
    total_contract_amount: site.total_contract_amount != null ? String(site.total_contract_amount) : '',
    total_rounds: site.total_rounds != null ? String(site.total_rounds) : '',
    per_visit_amount: site.per_visit_amount != null ? String(site.per_visit_amount) : '',
    contract_start_date: site.contract_start_date ?? '',
    contract_end_date: site.contract_end_date ?? '',
    contract_signed_date: site.contract_signed_date ?? site.contract_date ?? '',
    contract_status: site.contract_status ?? '',
    contract_type: site.contract_type ?? '',
    contract_contact_name: site.contract_contact_name ?? '',
    inspector_name: site.inspector_name ?? '',
    manager_name: primaryManager?.name ?? site.manager_name ?? '',
    manager_phone: primaryManager?.phone ?? site.manager_phone ?? '',
    memo: site.memo ?? '',
  };
}

export function buildSitePayload(
  form: SiteFormState,
  lockedHeadquarterId: string | null,
): SafetySiteInput | SafetySiteUpdateInput {
  const siteManagers = normalizeSiteManagerPayload(form.site_managers);
  const primaryManager = siteManagers.find((contact) => contact.is_primary) ?? siteManagers[0];
  return {
    headquarter_id: lockedHeadquarterId ?? form.headquarter_id,
    management_number: toNullableText(form.management_number),
    site_code: toNullableText(form.site_code),
    site_name: form.site_name.trim(),
    status: form.status,
    labor_office: toNullableText(form.labor_office),
    guidance_officer_name: toNullableText(form.guidance_officer_name),
    site_address: toNullableText(form.site_address),
    site_contact_email: toNullableText(primaryManager?.email ?? form.site_contact_email),
    site_managers: siteManagers,
    client_contacts: normalizeClientContactPayload(form.client_contacts),
    is_high_risk_site: form.is_high_risk_site,
    pause_start_date: toNullableText(form.pause_start_date),
    project_amount: parseOptionalNumber(form.project_amount),
    project_start_date: toNullableText(form.project_start_date),
    project_end_date: toNullableText(form.project_end_date),
    project_scale: toNullableText(form.project_scale),
    project_kind: toNullableText(form.project_kind),
    client_management_number: toNullableText(form.client_management_number),
    client_business_name: toNullableText(form.client_business_name),
    client_representative_name: toNullableText(form.client_representative_name),
    client_corporate_registration_no: toNullableText(form.client_corporate_registration_no),
    client_business_registration_no: toNullableText(form.client_business_registration_no),
    order_type_division: toNullableText(form.order_type_division),
    technical_guidance_kind: toNullableText(form.technical_guidance_kind),
    manager_name: toNullableText(primaryManager?.name ?? form.manager_name),
    manager_phone: toNullableText(primaryManager?.phone ?? form.manager_phone),
    inspector_name: toNullableText(form.inspector_name),
    contract_contact_name: toNullableText(form.contract_contact_name),
    contract_status: toNullableText(form.contract_status),
    contract_type: toNullableText(form.contract_type),
    contract_start_date: toNullableText(form.contract_start_date),
    contract_end_date: toNullableText(form.contract_end_date),
    contract_signed_date: toNullableText(form.contract_signed_date),
    per_visit_amount: parseOptionalNumber(form.per_visit_amount),
    total_rounds: (() => {
      const parsed = parseOptionalNumber(form.total_rounds);
      return typeof parsed === 'number' && Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    })(),
    total_contract_amount: parseOptionalNumber(form.total_contract_amount),
    memo: toNullableText(form.memo),
  };
}

export function getSiteManagementMissingFields(site: SafetySite): string[] {
  const businessManagementNumber =
    site.headquarter_detail?.management_number ?? site.management_number;
  const businessStartNumber = site.headquarter_detail?.opening_number ?? site.site_code;
  const requiredChecks: Array<[string, string | number | null | undefined]> = [
    ['사업장관리번호', businessManagementNumber],
    ['사업개시번호', businessStartNumber],
    ['현장명', site.site_name],
    ['현장 주소', site.site_address],
    ['현장 책임자명', getPrimarySiteManagerName(site)],
    ['현장 책임자 연락처', getPrimarySiteManagerPhone(site)],
    ['보고서 수신 메일', getPrimarySiteManagerEmail(site)],
    ['계약유형', site.contract_type],
    ['계약상태', site.contract_status],
    ['계약종료일', site.contract_end_date],
    ['기술지도 횟수', site.total_rounds],
    ['회차당 단가', site.per_visit_amount ?? site.total_contract_amount],
  ];

  return requiredChecks
    .filter(([, value]) => {
      if (typeof value === 'number') return !(Number.isFinite(value) && value > 0);
      return !String(value ?? '').trim();
    })
    .map(([label]) => label);
}

export function getDerivedPerVisitAmount(form: Pick<SiteFormState, 'per_visit_amount' | 'total_contract_amount' | 'total_rounds'>) {
  const explicitValue = parseOptionalNumber(form.per_visit_amount);
  if (typeof explicitValue === 'number' && explicitValue > 0) {
    return { source: 'explicit' as const, value: explicitValue };
  }

  const totalContractAmount = parseOptionalNumber(form.total_contract_amount);
  const totalRounds = parseOptionalNumber(form.total_rounds);
  if (
    typeof totalContractAmount === 'number' &&
    totalContractAmount > 0 &&
    typeof totalRounds === 'number' &&
    totalRounds > 0
  ) {
    return {
      source: 'derived' as const,
      value: totalContractAmount / Math.trunc(totalRounds),
    };
  }

  return {
    source: 'missing' as const,
    value: null,
  };
}

export function isCreateReady(form: SiteFormState, lockedHeadquarterId: string | null) {
  return Boolean((lockedHeadquarterId ?? form.headquarter_id).trim() && form.site_name.trim());
}

export function buildSiteSortComparator(
  sort: TableSortState,
  activeAssignmentsBySiteId: Map<string, SafetyAssignment[]>,
  usersById: Map<string, SafetyUser>,
) {
  const direction = sort.direction === 'asc' ? 1 : -1;
  return (left: SafetySite, right: SafetySite) => {
    const leftPinned = isPinnedTestSite(left);
    const rightPinned = isPinnedTestSite(right);
    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }

    if (sort.key === 'headquarter_name') {
      return (
        (left.headquarter_detail?.management_number || left.headquarter?.name || '').localeCompare(
          right.headquarter_detail?.management_number || right.headquarter?.name || '',
          'ko',
        ) * direction
      );
    }

    if (sort.key === 'project_kind') {
      return (left.project_kind ?? '').localeCompare(right.project_kind ?? '', 'ko') * direction;
    }

    if (sort.key === 'site_address') {
      return (left.site_address ?? '').localeCompare(right.site_address ?? '', 'ko') * direction;
    }

    if (sort.key === 'manager_name') {
      return getPrimarySiteManagerName(left).localeCompare(getPrimarySiteManagerName(right), 'ko') * direction;
    }

    if (sort.key === 'assigned_users') {
      const getAssignedLabel = (site: SafetySite) => {
        const assignmentsForSite = activeAssignmentsBySiteId.get(site.id) ?? [];
        const assignedUsers = assignmentsForSite
          .map((assignment) => usersById.get(assignment.user_id)?.name || '')
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'ko'));
        return assignedUsers.length > 0 ? assignedUsers.join(', ') : site.assigned_user?.name || '';
      };
      return getAssignedLabel(left).localeCompare(getAssignedLabel(right), 'ko') * direction;
    }

    if (sort.key === 'status') return left.status.localeCompare(right.status, 'ko') * direction;
    if (sort.key === 'project_end_date') {
      return (left.project_end_date ?? '').localeCompare(right.project_end_date ?? '') * direction;
    }
    if (sort.key === 'contract_end_date') {
      return (left.contract_end_date ?? '').localeCompare(right.contract_end_date ?? '') * direction;
    }
    if (sort.key === 'contract_signed_date') {
      const leftValue = left.contract_signed_date ?? left.contract_date ?? '';
      const rightValue = right.contract_signed_date ?? right.contract_date ?? '';
      return leftValue.localeCompare(rightValue) * direction;
    }
    if (sort.key === 'updated_at') {
      return (left.updated_at ?? '').localeCompare(right.updated_at ?? '') * direction;
    }
    if (sort.key === 'last_visit_date') {
      return (left.last_visit_date ?? '').localeCompare(right.last_visit_date ?? '') * direction;
    }
    if (sort.key === 'guidance_max_visit_round') {
      return (
        ((left.guidance_max_visit_round ?? 0) - (right.guidance_max_visit_round ?? 0)) * direction
      );
    }
    if (sort.key === 'project_amount') {
      return ((left.project_amount ?? 0) - (right.project_amount ?? 0)) * direction;
    }

    return left.site_name.localeCompare(right.site_name, 'ko') * direction;
  };
}
