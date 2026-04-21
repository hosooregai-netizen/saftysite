import assert from 'node:assert/strict';
import test from 'node:test';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { SafetyAdminHeadquarterListResponse } from '@/types/admin';
import type {
  SafetyBackendAdminHeadquarterListResponse,
  SafetyHeadquarterDetail,
  SafetySite,
} from '@/types/backend';
import { createGetHandler } from './getHandler';

type RouteHarnessOptions = {
  fallbackResponse?: SafetyAdminHeadquarterListResponse;
  fetchAdminImpl?: (
    token: string,
    params: Record<string, string | number | boolean | null | undefined>,
    request?: Request | null,
  ) => Promise<SafetyBackendAdminHeadquarterListResponse>;
  fetchSafetyHeadquartersResult?: SafetyHeadquarterDetail[];
  fetchSafetySitesResult?: SafetySite[];
  mappedResponse?: SafetyAdminHeadquarterListResponse;
};

function createRouteHarness(options: RouteHarnessOptions = {}) {
  const calls = {
    buildLocal: [] as unknown[],
    fetchAdmin: [] as Array<{
      params: Record<string, string | number | boolean | null | undefined>;
      request: Request | null;
      token: string;
    }>,
    fetchSafetyHeadquarters: [] as Array<{ request: Request | null; token: string }>,
    fetchSafetySites: [] as Array<{ request: Request | null; token: string }>,
    mapResponse: [] as unknown[],
    readToken: [] as Request[],
  };

  const fallbackResponse =
    options.fallbackResponse ??
    ({
      limit: 30,
      offset: 0,
      refreshedAt: '2026-04-21T00:00:00.000Z',
      rows: [] as SafetyAdminHeadquarterListResponse['rows'],
      summary: {
        completedCount: 0,
        contactGapCount: 0,
        memoGapCount: 0,
        registrationGapCount: 0,
      },
      total: 0,
    } as const);
  const mappedResponse =
    options.mappedResponse ??
    ({
      limit: 30,
      offset: 0,
      refreshedAt: '2026-04-21T00:00:00.000Z',
      rows: [] as SafetyAdminHeadquarterListResponse['rows'],
      summary: {
        completedCount: 0,
        contactGapCount: 0,
        memoGapCount: 0,
        registrationGapCount: 0,
      },
      total: 0,
    } as const);

  const GET = createGetHandler({
    buildAdminHeadquartersListResponse: (...args: unknown[]) => {
      calls.buildLocal.push(args);
      return fallbackResponse;
    },
    fetchAdminHeadquartersListServer: async (
      token: string,
      params: Record<string, string | number | boolean | null | undefined>,
      request?: Request | null,
    ) => {
      calls.fetchAdmin.push({ params, request: request ?? null, token });
      if (options.fetchAdminImpl) {
        return options.fetchAdminImpl(token, params, request);
      }
      return {
        limit: 30,
        offset: 0,
        refreshed_at: '2026-04-21T00:00:00.000Z',
        rows: [] as SafetyBackendAdminHeadquarterListResponse['rows'],
        summary: {
          completed_count: 0,
          contact_gap_count: 0,
          memo_gap_count: 0,
          registration_gap_count: 0,
        },
        total: 0,
      };
    },
    fetchSafetyHeadquartersServer: async (token: string, request?: Request | null) => {
      calls.fetchSafetyHeadquarters.push({ request: request ?? null, token });
      return options.fetchSafetyHeadquartersResult ?? [];
    },
    fetchSafetySitesServer: async (token: string, request?: Request | null) => {
      calls.fetchSafetySites.push({ request: request ?? null, token });
      return options.fetchSafetySitesResult ?? [];
    },
    mapBackendAdminHeadquartersListResponse: (
      response: SafetyBackendAdminHeadquarterListResponse,
    ) => {
      calls.mapResponse.push(response);
      return mappedResponse;
    },
    readRequiredAdminToken: (request: Request) => {
      calls.readToken.push(request);
      return 'token-123';
    },
  });

  return {
    GET,
    calls,
    fallbackResponse,
    mappedResponse,
  };
}

test('general list proxies upstream with active_only=true', async () => {
  const backendResponse = {
    limit: 30,
    offset: 30,
    refreshed_at: '2026-04-21T00:00:00.000Z',
    rows: [
      {
        id: 'hq-2',
        name: 'HQ 2',
        management_number: 'HQ-002',
        opening_number: null,
        business_registration_no: null,
        corporate_registration_no: null,
        license_no: null,
        contact_name: null,
        contact_phone: null,
        address: null,
        memo: null,
        is_active: true,
        created_at: '2026-04-20T00:00:00.000Z',
        updated_at: '2026-04-21T00:00:00.000Z',
        site_count: 4,
        sequence_no: 2,
      },
    ],
    summary: {
      completed_count: 0,
      contact_gap_count: 1,
      memo_gap_count: 1,
      registration_gap_count: 1,
    },
    total: 31,
  };
  const mappedResponse: SafetyAdminHeadquarterListResponse = {
    limit: 30,
    offset: 30,
    refreshedAt: '2026-04-21T00:00:00.000Z',
    rows: [
      {
        id: 'hq-2',
        name: 'HQ 2',
        management_number: 'HQ-002',
        opening_number: null,
        business_registration_no: null,
        corporate_registration_no: null,
        license_no: null,
        contact_name: null,
        contact_phone: null,
        address: null,
        memo: null,
        is_active: true,
        lifecycle_status: 'active',
        created_at: '2026-04-20T00:00:00.000Z',
        updated_at: '2026-04-21T00:00:00.000Z',
        site_count: 4,
        sequence_no: 2,
      },
    ],
    summary: {
      completedCount: 0,
      contactGapCount: 1,
      memoGapCount: 1,
      registrationGapCount: 1,
    },
    total: 31,
  };
  const { GET, calls } = createRouteHarness({
    fetchAdminImpl: async () => backendResponse,
    mappedResponse,
  });

  const response = await GET(
    new Request(
      'http://localhost/api/admin/headquarters/list?limit=30&offset=30&sort_by=created_at&sort_dir=desc',
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(calls.fetchAdmin.length, 1);
  assert.deepEqual(calls.fetchAdmin[0]?.params, {
    active_only: true,
    id: '',
    limit: 30,
    offset: 30,
    query: '',
    sort_by: 'created_at',
    sort_dir: 'desc',
  });
  assert.equal(calls.buildLocal.length, 0);
  assert.equal(calls.mapResponse.length, 1);
  assert.deepEqual(await response.json(), mappedResponse);
});

test('id lookup does not force active_only', async () => {
  const { GET, calls, mappedResponse } = createRouteHarness();

  const response = await GET(
    new Request(
      'http://localhost/api/admin/headquarters/list?id=hq-1&limit=1&offset=0&sort_by=created_at&sort_dir=desc',
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(calls.fetchAdmin.length, 1);
  assert.equal(calls.fetchAdmin[0]?.params.id, 'hq-1');
  assert.equal(calls.fetchAdmin[0]?.params.active_only, undefined);
  assert.equal(calls.buildLocal.length, 0);
  assert.deepEqual(await response.json(), mappedResponse);
});

test('general list falls back to local builder on upstream 5xx', async () => {
  const { GET, calls, fallbackResponse } = createRouteHarness({
    fallbackResponse: {
      limit: 30,
      offset: 0,
      refreshedAt: '2026-04-21T00:00:00.000Z',
      rows: [
        {
          id: 'hq-local',
          name: 'Local HQ',
          management_number: null,
          opening_number: null,
          business_registration_no: null,
          corporate_registration_no: null,
          license_no: null,
          contact_name: null,
          contact_phone: null,
          address: null,
          memo: null,
          is_active: true,
          created_at: '2026-04-21T00:00:00.000Z',
          updated_at: '2026-04-21T00:00:00.000Z',
          site_count: 2,
          sequence_no: 1,
        },
      ],
      summary: {
        completedCount: 0,
        contactGapCount: 1,
        memoGapCount: 1,
        registrationGapCount: 1,
      },
      total: 1,
    },
    fetchAdminImpl: async () => {
      throw new SafetyServerApiError('upstream failure', 503);
    },
    fetchSafetyHeadquartersResult: [
      {
        id: 'hq-local',
        name: 'Local HQ',
        management_number: null,
        opening_number: null,
        business_registration_no: null,
        corporate_registration_no: null,
        license_no: null,
        contact_name: null,
        contact_phone: null,
        address: null,
        memo: null,
        is_active: true,
        created_at: '2026-04-21T00:00:00.000Z',
        updated_at: '2026-04-21T00:00:00.000Z',
      },
    ],
    fetchSafetySitesResult: [
      {
        id: 'site-1',
        headquarter_id: 'hq-local',
        headquarter: null,
        headquarter_detail: null,
        assigned_user: null,
        assigned_users: [],
        active_assignment_count: 0,
        site_name: 'Local Site',
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
        manager_name: null,
        inspector_name: null,
        contract_contact_name: null,
        manager_phone: null,
        site_contact_email: null,
        site_address: null,
        is_high_risk_site: false,
        status: 'active',
        pause_start_date: null,
        memo: null,
        contract_date: null,
        contract_start_date: null,
        contract_end_date: null,
        contract_signed_date: null,
        contract_type: null,
        contract_status: null,
        total_rounds: null,
        per_visit_amount: null,
        total_contract_amount: null,
        last_visit_date: null,
        guidance_max_visit_round: 0,
        required_completion_fields: [],
        dispatch_policy: {
          enabled: false,
          alerts_enabled: false,
          updated_at: null,
          updated_by: null,
        },
        created_at: '2026-04-21T00:00:00.000Z',
        updated_at: '2026-04-21T00:00:00.000Z',
      },
    ],
  });

  const response = await GET(
    new Request('http://localhost/api/admin/headquarters/list?limit=30&offset=0'),
  );

  assert.equal(response.status, 200);
  assert.equal(calls.fetchAdmin.length, 1);
  assert.equal(calls.fetchSafetyHeadquarters.length, 1);
  assert.equal(calls.fetchSafetySites.length, 1);
  assert.equal(calls.buildLocal.length, 1);
  assert.equal(calls.mapResponse.length, 0);
  assert.deepEqual(await response.json(), fallbackResponse);
});

test('id lookup keeps upstream error response instead of falling back locally', async () => {
  const { GET, calls } = createRouteHarness({
    fetchAdminImpl: async () => {
      throw new SafetyServerApiError('upstream failure', 503);
    },
  });

  const response = await GET(
    new Request('http://localhost/api/admin/headquarters/list?id=hq-1&limit=1&offset=0'),
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'upstream failure' });
  assert.equal(calls.fetchSafetyHeadquarters.length, 0);
  assert.equal(calls.fetchSafetySites.length, 0);
  assert.equal(calls.buildLocal.length, 0);
});
