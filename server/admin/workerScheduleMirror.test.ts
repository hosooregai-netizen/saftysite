import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSiteInspectionSchedules } from '@/lib/admin/siteContractProfile';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import {
  buildWorkerScheduleMirrorMemo,
  buildWorkerSchedulesMirrorMemo,
  clearWorkerScheduleMirrorRowsForTests,
  getWorkerScheduleMirrorRows,
  rememberWorkerScheduleMirrorRows,
} from './workerScheduleMirror';

function site(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    active_assignment_count: 1,
    assigned_user: { email: 'agent@example.com', id: 'agent-1', name: 'Agent', role: 'field_agent' },
    assigned_users: [{ email: 'agent@example.com', id: 'agent-1', name: 'Agent', role: 'field_agent' }],
    client_business_name: null,
    client_business_registration_no: null,
    client_corporate_registration_no: null,
    client_management_number: null,
    client_representative_name: null,
    contract_contact_name: null,
    contract_date: '2026-04-01',
    contract_end_date: '2026-05-31',
    contract_signed_date: null,
    contract_start_date: '2026-03-22',
    contract_status: null,
    contract_type: null,
    created_at: '2026-04-01T00:00:00.000Z',
    dispatch_policy: null,
    guidance_max_visit_round: null,
    guidance_officer_name: null,
    headquarter: { id: 'hq-1', name: 'HQ' },
    headquarter_detail: null,
    headquarter_id: 'hq-1',
    id: 'site-1',
    inspector_name: null,
    is_active: true,
    is_high_risk_site: null,
    labor_office: null,
    last_visit_date: null,
    lifecycle_status: 'active',
    management_number: null,
    manager_name: null,
    manager_phone: null,
    memo: null,
    order_type_division: null,
    pause_start_date: null,
    per_visit_amount: null,
    project_amount: null,
    project_end_date: '2026-05-31',
    project_kind: null,
    project_scale: null,
    project_start_date: '2026-03-22',
    required_completion_fields: null,
    site_address: null,
    site_code: null,
    site_contact_email: null,
    site_name: 'Test Site',
    status: 'active',
    technical_guidance_kind: null,
    total_contract_amount: null,
    total_rounds: 10,
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

function schedule(overrides: Partial<SafetyInspectionSchedule> = {}): SafetyInspectionSchedule {
  return {
    actualVisitDate: overrides.actualVisitDate ?? '2026-04-29',
    assigneeName: 'Agent',
    assigneeUserId: 'agent-1',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: 'hq-1',
    headquarterName: 'HQ',
    id: 'backend-schedule-6',
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: overrides.linkedReportKey ?? 'report-6',
    plannedDate: overrides.plannedDate ?? '2026-04-29',
    roundNo: overrides.roundNo ?? 6,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: 'site-1',
    siteName: 'Test Site',
    status: 'planned',
    totalRounds: 10,
    windowEnd: '2026-05-31',
    windowStart: '2026-03-22',
    ...overrides,
  };
}

test('worker schedule mirror memo persists worker-entered visit date by round', () => {
  const memo = buildWorkerScheduleMirrorMemo(site(), schedule());
  const rows = parseSiteInspectionSchedules(memo);
  const mirrored = rows.find((row) => row.roundNo === 6);

  assert.ok(mirrored);
  assert.equal(mirrored?.id, 'schedule:site-1:6');
  assert.equal(mirrored?.plannedDate, '2026-04-29');
  assert.equal(mirrored?.actualVisitDate, '2026-04-29');
  assert.equal(mirrored?.linkedReportKey, 'report-6');
});

test('worker schedule mirror memo clears the mirrored date when worker clears a duplicate reservation', () => {
  const existingMemo =
    '\n[SAFETY_SITE_META]{"contractProfile":{"totalRounds":10},"schedules":[{"id":"schedule:site-1:6","siteId":"site-1","roundNo":6,"plannedDate":"2026-04-29","actualVisitDate":"2026-04-29","status":"planned"}]}';
  const memo = buildWorkerScheduleMirrorMemo(
    site({ memo: existingMemo }),
    schedule({ actualVisitDate: '', linkedReportKey: '', plannedDate: '' }),
  );
  const rows = parseSiteInspectionSchedules(memo);
  const mirrored = rows.find((row) => row.roundNo === 6);

  assert.ok(mirrored);
  assert.equal(mirrored?.plannedDate, '');
  assert.equal(mirrored?.actualVisitDate, '');
});

test('worker schedules mirror memo can backfill existing selected rows from schedule reads', () => {
  const memo = buildWorkerSchedulesMirrorMemo(site(), [
    schedule({ plannedDate: '', roundNo: 1 }),
    schedule({ id: 'backend-schedule-6', plannedDate: '2026-04-29', roundNo: 6 }),
    schedule({ id: 'backend-schedule-7', plannedDate: '2026-04-30', roundNo: 7 }),
  ]);
  const rows = parseSiteInspectionSchedules(memo);

  assert.equal(rows.find((row) => row.roundNo === 1)?.plannedDate, '');
  assert.equal(rows.find((row) => row.roundNo === 6)?.plannedDate, '2026-04-29');
  assert.equal(rows.find((row) => row.roundNo === 7)?.plannedDate, '2026-04-30');
});

test('worker schedule mirror store keeps rows available for admin reads without site memo writes', () => {
  clearWorkerScheduleMirrorRowsForTests();

  rememberWorkerScheduleMirrorRows([
    schedule({ id: 'backend-schedule-6', plannedDate: '2026-04-29', roundNo: 6 }),
  ]);
  rememberWorkerScheduleMirrorRows([
    schedule({ id: 'replacement-schedule-6', plannedDate: '2026-04-30', roundNo: 6 }),
  ]);

  const rows = getWorkerScheduleMirrorRows();

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, 'replacement-schedule-6');
  assert.equal(rows[0]?.plannedDate, '2026-04-30');
  assert.ok(rows[0]?.selectionConfirmedAt);
});
