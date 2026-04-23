import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fetchAssignedSafetySites,
  fetchSafetySiteDetail,
} from './endpoints';

test('fetchAssignedSafetySites requests the summary contract and expands placeholder site rows', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;

  globalThis.fetch = async (input) => {
    fetchCount += 1;
    assert.equal(
      String(input),
      '/api/safety/assignments/me/sites?active_only=true&limit=500',
    );
    return new Response(
      JSON.stringify([
        {
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
        },
      ]),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const sites = await fetchAssignedSafetySites('worker-token');

    assert.equal(fetchCount, 1);
    assert.equal(sites[0].site_name, 'Summary Site');
    assert.equal(sites[0].headquarter_detail, null);
    assert.equal(sites[0].manager_name, null);
    assert.equal(sites[0].status, 'active');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchSafetySiteDetail requests the site detail contract', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    assert.equal(
      String(input),
      '/api/safety/sites/site-1?include_headquarter_detail=true&include_assigned_user=true',
    );
    return new Response(
      JSON.stringify({
        id: 'site-1',
        headquarter_id: 'hq-1',
        headquarter: { id: 'hq-1', name: 'HQ One' },
        headquarter_detail: {
          id: 'hq-1',
          name: 'HQ One',
          management_number: 'MG-001',
          opening_number: null,
          business_registration_no: null,
          corporate_registration_no: null,
          license_no: null,
          contact_name: null,
          contact_phone: null,
          address: 'HQ Address',
          memo: null,
          is_active: true,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-02T00:00:00Z',
        },
        assigned_user: null,
        assigned_users: [],
        active_assignment_count: 0,
        site_name: 'Detailed Site',
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
        client_business_name: null,
        client_representative_name: null,
        client_corporate_registration_no: null,
        client_business_registration_no: null,
        order_type_division: null,
        technical_guidance_kind: null,
        manager_name: 'Manager Kim',
        inspector_name: null,
        contract_contact_name: null,
        manager_phone: null,
        site_contact_email: 'site@example.com',
        is_high_risk_site: false,
        site_address: 'Detailed Address',
        status: 'active',
        pause_start_date: null,
        memo: null,
        contract_date: null,
        contract_start_date: null,
        contract_end_date: null,
        contract_signed_date: null,
        contract_type: null,
        contract_status: null,
        total_rounds: 8,
        guidance_max_visit_round: 0,
        per_visit_amount: null,
        total_contract_amount: null,
        last_visit_date: null,
        required_completion_fields: [],
        dispatch_policy: null,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-22T00:00:00Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const site = await fetchSafetySiteDetail('worker-token', 'site-1');

    assert.equal(site.site_name, 'Detailed Site');
    assert.equal(site.headquarter_detail?.address, 'HQ Address');
    assert.equal(site.site_contact_email, 'site@example.com');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
