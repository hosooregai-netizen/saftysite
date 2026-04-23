import assert from 'node:assert/strict';
import test from 'node:test';

import {
  expandAssignedSiteSummaryToSafetySite,
  mergeAssignedSafetySiteIntoInspectionSite,
  mergeAssignedSiteDetail,
  mergeAssignedSiteSummaryIntoSafetySite,
} from './assignedSites';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
import type { SafetyAssignedSiteSummary, SafetySite } from '@/types/backend';

function buildSummary(overrides: Partial<SafetyAssignedSiteSummary> = {}): SafetyAssignedSiteSummary {
  return {
    id: 'site-1',
    headquarter_id: 'hq-1',
    headquarter: { id: 'hq-1', name: 'HQ One' },
    assigned_user: {
      id: 'user-1',
      email: 'worker@example.com',
      name: 'Worker One',
      role: 'field_agent',
    },
    active_assignment_count: 1,
    site_name: 'Summary Site',
    client_business_name: 'Summary Client',
    site_address: 'Summary Address',
    total_rounds: 4,
    created_at: '2026-04-20T00:00:00Z',
    updated_at: '2026-04-23T00:00:00Z',
    ...overrides,
  };
}

function buildDetailedSite(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    id: 'site-1',
    headquarter_id: 'hq-1',
    headquarter: { id: 'hq-1', name: 'HQ One' },
    headquarter_detail: {
      id: 'hq-1',
      name: 'HQ One',
      management_number: 'MG-001',
      opening_number: 'OPEN-1',
      business_registration_no: 'BRN-1',
      corporate_registration_no: 'CRN-1',
      license_no: 'LIC-1',
      contact_name: 'HQ Contact',
      contact_phone: '02-123-4567',
      address: 'HQ Address',
      memo: null,
      is_active: true,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-02T00:00:00Z',
    },
    assigned_user: {
      id: 'user-1',
      email: 'worker@example.com',
      name: 'Worker One',
      role: 'field_agent',
    },
    assigned_users: [
      {
        id: 'user-1',
        email: 'worker@example.com',
        name: 'Worker One',
        role: 'field_agent',
      },
    ],
    active_assignment_count: 1,
    site_name: 'Detailed Site',
    site_code: 'SITE-001',
    management_number: 'SITE-MG-001',
    labor_office: 'Labor Office',
    guidance_officer_name: 'Guide',
    project_start_date: '2026-04-01',
    project_end_date: '2026-12-31',
    project_amount: 1000000,
    project_scale: 'Large',
    project_kind: 'Construction',
    client_management_number: 'CLIENT-001',
    client_business_name: 'Detailed Client',
    client_representative_name: 'Client Rep',
    client_corporate_registration_no: 'CLIENT-CRN',
    client_business_registration_no: 'CLIENT-BRN',
    order_type_division: 'Order',
    technical_guidance_kind: 'Regular',
    manager_name: 'Manager Kim',
    inspector_name: 'Inspector Lee',
    contract_contact_name: 'Contact Park',
    manager_phone: '010-1111-2222',
    site_contact_email: 'site@example.com',
    is_high_risk_site: true,
    site_address: 'Detailed Address',
    status: 'active',
    pause_start_date: null,
    memo: 'Detailed Memo',
    contract_date: '2026-03-01',
    contract_start_date: '2026-04-01',
    contract_end_date: '2026-12-31',
    contract_signed_date: '2026-03-15',
    contract_type: 'annual',
    contract_status: 'active',
    total_rounds: 8,
    guidance_max_visit_round: 3,
    per_visit_amount: 100000,
    total_contract_amount: 800000,
    last_visit_date: '2026-04-22',
    required_completion_fields: ['manager_phone'],
    dispatch_policy: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-22T00:00:00Z',
    ...overrides,
  };
}

test('expandAssignedSiteSummaryToSafetySite builds a lightweight placeholder site', () => {
  const site = expandAssignedSiteSummaryToSafetySite(buildSummary());

  assert.equal(site.site_name, 'Summary Site');
  assert.equal(site.client_business_name, 'Summary Client');
  assert.equal(site.site_address, 'Summary Address');
  assert.equal(site.total_rounds, 4);
  assert.equal(site.headquarter_detail, null);
  assert.equal(site.manager_name, null);
  assert.equal(site.status, 'active');
});

test('mergeAssignedSiteSummaryIntoSafetySite preserves detailed fields while refreshing summary data', () => {
  const current = buildDetailedSite();
  const merged = mergeAssignedSiteSummaryIntoSafetySite(
    current,
    expandAssignedSiteSummaryToSafetySite(
      buildSummary({
        site_name: 'Updated Summary Site',
        site_address: 'Updated Summary Address',
        total_rounds: 10,
      }),
    ),
  );

  assert.equal(merged.site_name, 'Updated Summary Site');
  assert.equal(merged.site_address, 'Updated Summary Address');
  assert.equal(merged.total_rounds, 10);
  assert.equal(merged.headquarter_detail?.address, 'HQ Address');
  assert.equal(merged.manager_name, 'Manager Kim');
});

test('mergeAssignedSiteDetail upgrades a summary placeholder to a detailed site', () => {
  const merged = mergeAssignedSiteDetail(
    expandAssignedSiteSummaryToSafetySite(buildSummary()),
    buildDetailedSite(),
  );

  assert.equal(merged.headquarter_detail?.management_number, 'MG-001');
  assert.equal(merged.manager_phone, '010-1111-2222');
  assert.equal(merged.site_contact_email, 'site@example.com');
});

test('mergeAssignedSafetySiteIntoInspectionSite refreshes summary fields without erasing detailed snapshot values', () => {
  const currentInspectionSite = mapSafetySiteToInspectionSite(buildDetailedSite());
  const mergedInspectionSite = mergeAssignedSafetySiteIntoInspectionSite(
    currentInspectionSite,
    expandAssignedSiteSummaryToSafetySite(
      buildSummary({
        site_name: 'Fresh Summary Name',
        site_address: 'Fresh Summary Address',
        total_rounds: 12,
      }),
    ),
  );

  assert.equal(mergedInspectionSite.siteName, 'Fresh Summary Name');
  assert.equal(mergedInspectionSite.totalRounds, 12);
  assert.equal(mergedInspectionSite.adminSiteSnapshot.siteAddress, 'Fresh Summary Address');
  assert.equal(mergedInspectionSite.adminSiteSnapshot.headquartersAddress, 'HQ Address');
  assert.equal(mergedInspectionSite.adminSiteSnapshot.siteManagerPhone, '010-1111-2222');
});
