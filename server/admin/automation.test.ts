import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSiteInspectionSchedules } from '@/lib/admin/siteContractProfile';
import { upsertSiteScheduleByRound } from './automation';
import type { SafetySite, SafetyUser } from '@/types/backend';

function buildUser(): SafetyUser {
  return {
    id: 'user-1',
    email: 'worker@example.com',
    is_active: true,
    last_login_at: null,
    name: '담당자',
    organization_name: null,
    phone: '010-0000-0000',
    position: null,
    role: 'field_agent',
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  };
}

function buildSite(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    id: 'site-1',
    headquarter_id: 'hq-1',
    headquarter: { id: 'hq-1', name: '본부' },
    headquarter_detail: null,
    assigned_user: { email: 'worker@example.com', id: 'user-1', name: '담당자', role: 'field_agent' },
    assigned_users: [{ email: 'worker@example.com', id: 'user-1', name: '담당자', role: 'field_agent' }],
    active_assignment_count: 1,
    site_name: '테스트 현장',
    site_code: null,
    management_number: null,
    labor_office: null,
    guidance_officer_name: null,
    project_start_date: null,
    project_end_date: '2026-03-26',
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
    is_high_risk_site: null,
    site_address: null,
    status: 'active',
    pause_start_date: null,
    lifecycle_status: 'active',
    is_active: true,
    memo: null,
    contract_date: null,
    contract_start_date: null,
    contract_end_date: '2026-03-26',
    contract_signed_date: null,
    contract_type: null,
    contract_status: null,
    total_rounds: 8,
    guidance_max_visit_round: null,
    per_visit_amount: null,
    total_contract_amount: null,
    last_visit_date: null,
    required_completion_fields: null,
    dispatch_policy: null,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

test('upsertSiteScheduleByRound creates a memo-backed schedule for an unpersisted round', () => {
  const user = buildUser();
  const site = buildSite();

  const result = upsertSiteScheduleByRound(
    site,
    [user],
    7,
    {
      linkedReportKey: 'report-7',
      plannedDate: '2026-04-20',
      selectionReasonLabel: '현장 요청',
      selectionReasonMemo: '오전 방문',
    },
    {
      actorUserId: user.id,
      actorUserName: user.name,
    },
  );

  assert.equal(result.schedule.id, 'schedule:site-1:7');
  assert.equal(result.schedule.roundNo, 7);
  assert.equal(result.schedule.linkedReportKey, 'report-7');
  assert.equal(result.schedule.plannedDate, '2026-04-20');
  assert.equal(result.schedule.windowStart, '');
  assert.equal(result.schedule.windowEnd, '2026-03-26');
  assert.equal(result.schedule.selectionConfirmedByUserId, user.id);

  const parsed = parseSiteInspectionSchedules(result.memo);
  const persisted = parsed.find((item) => item.roundNo === 7);
  assert.ok(persisted);
  assert.equal(persisted?.plannedDate, '2026-04-20');
  assert.equal(persisted?.linkedReportKey, 'report-7');
});

test('upsertSiteScheduleByRound keeps existing schedule id when updating same round', () => {
  const user = buildUser();
  const site = buildSite({
    memo: '\n[SAFETY_SITE_META]{"contractProfile":{"totalRounds":8},"schedules":[{"id":"existing-3","siteId":"site-1","roundNo":3,"plannedDate":"2026-04-10","status":"planned"}]}',
  });

  const result = upsertSiteScheduleByRound(
    site,
    [user],
    3,
    {
      plannedDate: '2026-04-22',
      selectionReasonMemo: '변경',
    },
    {
      actorUserId: user.id,
      actorUserName: user.name,
    },
  );

  assert.equal(result.schedule.id, 'existing-3');
  assert.equal(result.schedule.plannedDate, '2026-04-22');
});
