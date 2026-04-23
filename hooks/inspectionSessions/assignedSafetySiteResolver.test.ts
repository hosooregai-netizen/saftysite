import assert from 'node:assert/strict';
import test from 'node:test';

import { expandAssignedSiteSummaryToSafetySite } from '@/lib/safetyApi/assignedSites';
import type { SafetyAssignedSiteSummary, SafetySite } from '@/types/backend';
import { resolveAssignedSafetySite } from './assignedSafetySiteResolver';

function buildSummary(
  overrides: Partial<SafetyAssignedSiteSummary> = {},
): SafetyAssignedSiteSummary {
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

function buildDetail(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    ...expandAssignedSiteSummaryToSafetySite(buildSummary()),
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
    manager_name: 'Manager Kim',
    manager_phone: '010-1111-2222',
    site_contact_email: 'site@example.com',
    ...overrides,
  };
}

test('resolveAssignedSafetySite fetches detail for cached summary sites and merges it', async () => {
  const summarySite = expandAssignedSiteSummaryToSafetySite(buildSummary());
  const detailSite = buildDetail();
  const assignedSitesById = new Map([[summarySite.id, summarySite]]);
  let replaceCount = 0;
  let upsertDetailCount = 0;
  let storeUpsertCount = 0;

  const resolved = await resolveAssignedSafetySite('site-1', {
    fetchAssignedSafetySites: async () => {
      assert.fail('summary list refetch should not run when summary is cached');
    },
    fetchSafetySiteDetail: async (siteId) => {
      assert.equal(siteId, 'site-1');
      return detailSite;
    },
    getAssignedSafetySite: (siteId) => assignedSitesById.get(siteId) ?? null,
    hasAssignedSafetySiteDetail: () => false,
    replaceAssignedSafetySites: () => {
      replaceCount += 1;
    },
    upsertAssignedSafetySiteDetail: (site) => {
      upsertDetailCount += 1;
      assignedSitesById.set(site.id, site);
    },
    replaceAssignedSitesInStore: () => {
      assert.fail('store replacement should not run for cached summaries');
    },
    upsertAssignedSitesIntoStore: () => {
      storeUpsertCount += 1;
    },
  });

  assert.equal(replaceCount, 0);
  assert.equal(upsertDetailCount, 1);
  assert.equal(storeUpsertCount, 2);
  assert.equal(resolved?.headquarter_detail?.address, 'HQ Address');
});

test('resolveAssignedSafetySite refetches summaries before loading detail when cache is empty', async () => {
  const summarySite = expandAssignedSiteSummaryToSafetySite(buildSummary());
  const detailSite = buildDetail();
  const assignedSitesById = new Map<string, SafetySite>();
  let replacedSummaryCount = 0;
  let replacedStoreCount = 0;

  const resolved = await resolveAssignedSafetySite('site-1', {
    fetchAssignedSafetySites: async () => [summarySite],
    fetchSafetySiteDetail: async () => detailSite,
    getAssignedSafetySite: (siteId) => assignedSitesById.get(siteId) ?? null,
    hasAssignedSafetySiteDetail: () => false,
    replaceAssignedSafetySites: (sites) => {
      replacedSummaryCount += 1;
      assignedSitesById.clear();
      sites.forEach((site) => {
        assignedSitesById.set(site.id, site);
      });
    },
    upsertAssignedSafetySiteDetail: (site) => {
      assignedSitesById.set(site.id, site);
    },
    replaceAssignedSitesInStore: (sites) => {
      replacedStoreCount += 1;
      assert.equal(sites.length, 1);
    },
    upsertAssignedSitesIntoStore: () => {},
  });

  assert.equal(replacedSummaryCount, 1);
  assert.equal(replacedStoreCount, 1);
  assert.equal(resolved?.manager_name, 'Manager Kim');
});

test('resolveAssignedSafetySite returns cached detail without refetching', async () => {
  const detailSite = buildDetail();

  const resolved = await resolveAssignedSafetySite('site-1', {
    fetchAssignedSafetySites: async () => {
      assert.fail('detail cache should skip summary refetch');
    },
    fetchSafetySiteDetail: async () => {
      assert.fail('detail cache should skip detail refetch');
    },
    getAssignedSafetySite: () => detailSite,
    hasAssignedSafetySiteDetail: () => true,
    replaceAssignedSafetySites: () => {
      assert.fail('detail cache should not replace summaries');
    },
    upsertAssignedSafetySiteDetail: () => {
      assert.fail('detail cache should not upsert detail');
    },
    replaceAssignedSitesInStore: () => {
      assert.fail('detail cache should not replace store');
    },
    upsertAssignedSitesIntoStore: () => {},
  });

  assert.equal(resolved?.site_contact_email, 'site@example.com');
});
