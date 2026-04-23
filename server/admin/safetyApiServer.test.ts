import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fetchAssignedSafetySitesServer,
  getServerRequestTimeoutMs,
  requestSafetyAdminServer,
} from './safetyApiServer';

const UPSTREAM_BASE_URL_ENV_KEY = 'SAFETY_API_UPSTREAM_BASE_URL';
const ORIGINAL_UPSTREAM_BASE_URL = process.env[UPSTREAM_BASE_URL_ENV_KEY];

function withUpstreamBaseUrl(value: string, callback: () => Promise<void>) {
  process.env[UPSTREAM_BASE_URL_ENV_KEY] = value;

  return callback().finally(() => {
    if (ORIGINAL_UPSTREAM_BASE_URL === undefined) {
      delete process.env[UPSTREAM_BASE_URL_ENV_KEY];
    } else {
      process.env[UPSTREAM_BASE_URL_ENV_KEY] = ORIGINAL_UPSTREAM_BASE_URL;
    }
  });
}

test('requestSafetyAdminServer tolerates empty JSON bodies on successful write responses', async () => {
  const originalFetch = globalThis.fetch;

  await withUpstreamBaseUrl('https://example.com/api/v1', async () => {
    globalThis.fetch = async () =>
      new Response('', {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });

    try {
      const result = await requestSafetyAdminServer(
        '/headquarters',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'mock' }),
          headers: { 'Content-Type': 'application/json' },
        },
        'token',
      );

      assert.equal(result, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('getServerRequestTimeoutMs treats mail send as long running', () => {
  assert.equal(getServerRequestTimeoutMs('/mail/send', {}), 45000);
});

test('getServerRequestTimeoutMs keeps ordinary reads on the default timeout', () => {
  assert.equal(getServerRequestTimeoutMs('/mail/threads', {}), 15000);
});

test('fetchAssignedSafetySitesServer requests assignment summaries and expands placeholder sites', async () => {
  const originalFetch = globalThis.fetch;

  await withUpstreamBaseUrl('https://example.com/api/v1', async () => {
    globalThis.fetch = async (input) => {
      assert.equal(
        String(input),
        'https://example.com/api/v1/assignments/me/sites?active_only=true&limit=200&offset=0',
      );

      return new Response(
        JSON.stringify([
          {
            id: 'site-1',
            headquarter_id: 'hq-1',
            headquarter: {
              id: 'hq-1',
              name: 'HQ One',
            },
            assigned_user: null,
            active_assignment_count: 1,
            site_name: 'Alpha Site',
            client_business_name: 'Client One',
            site_address: 'Seoul',
            total_rounds: 8,
            created_at: '2026-04-23T00:00:00.000Z',
            updated_at: '2026-04-23T00:00:00.000Z',
          },
        ]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    try {
      const sites = await fetchAssignedSafetySitesServer('token');

      assert.equal(sites.length, 1);
      assert.deepEqual(sites[0], {
        id: 'site-1',
        headquarter_id: 'hq-1',
        headquarter: {
          id: 'hq-1',
          name: 'HQ One',
        },
        headquarter_detail: null,
        assigned_user: null,
        assigned_users: [],
        active_assignment_count: 1,
        site_name: 'Alpha Site',
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
        client_business_name: 'Client One',
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
        is_high_risk_site: false,
        is_active: true,
        lifecycle_status: 'active',
        site_address: 'Seoul',
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
        guidance_max_visit_round: null,
        per_visit_amount: null,
        total_contract_amount: null,
        last_visit_date: null,
        required_completion_fields: [],
        dispatch_policy: null,
        created_at: '2026-04-23T00:00:00.000Z',
        updated_at: '2026-04-23T00:00:00.000Z',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
