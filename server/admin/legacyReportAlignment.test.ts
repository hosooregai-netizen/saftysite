import assert from 'node:assert/strict';
import test from 'node:test';

import type { ControllerReportRow, SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import {
  alignAdminReportRowsWithLegacySites,
  alignScheduleRowsWithLegacyReports,
} from './legacyReportAlignment';
import type { LegacyAdminReportSnapshotRow } from './legacyAdminReportsSnapshot';

function buildSite(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    active_assignment_count: 0,
    assigned_user: null,
    assigned_users: [],
    client_business_name: null,
    client_business_registration_no: null,
    client_corporate_registration_no: null,
    client_management_number: null,
    client_representative_name: null,
    contract_contact_name: null,
    contract_date: null,
    contract_end_date: null,
    contract_signed_date: null,
    contract_start_date: null,
    contract_status: null,
    contract_type: null,
    created_at: '2026-04-23T00:00:00Z',
    guidance_max_visit_round: null,
    guidance_officer_name: null,
    headquarter: { id: 'hq-1', name: '서울서부' },
    headquarter_detail: {
      address: null,
      business_registration_no: null,
      contact_name: null,
      contact_phone: null,
      corporate_registration_no: null,
      created_at: '',
      id: 'hq-1',
      lifecycle_status: 'active',
      is_active: true,
      license_no: null,
      management_number: null,
      memo: null,
      name: '서울서부',
      opening_number: null,
      updated_at: '',
    },
    headquarter_id: 'hq-1',
    id: 'site-live',
    inspector_name: null,
    is_active: true,
    labor_office: null,
    last_visit_date: null,
    lifecycle_status: 'active',
    management_number: null,
    manager_name: null,
    manager_phone: null,
    memo: 'legacy_insafed_site_id:75828',
    order_type_division: null,
    per_visit_amount: null,
    project_amount: null,
    project_end_date: null,
    project_kind: null,
    project_scale: null,
    project_start_date: null,
    required_completion_fields: [],
    site_address: null,
    site_code: null,
    site_contact_email: null,
    site_name: '청파동3가 118-35 다세대 신축공사',
    status: 'active',
    technical_guidance_kind: null,
    total_contract_amount: null,
    total_rounds: null,
    updated_at: '2026-04-23T00:00:00Z',
    ...overrides,
  };
}

function buildLegacyRow(overrides: Partial<LegacyAdminReportSnapshotRow> = {}): LegacyAdminReportSnapshotRow {
  return {
    assigneeName: '조식',
    headquarterName: '서울서부',
    legacyReportId: '628181',
    legacySiteId: '75828',
    pdfFileName: '보고서.pdf',
    roundNo: 1,
    siteName: '청파동3가 118-35 다세대 신축공사',
    status: '완료',
    visitDate: '2026-04-01',
    ...overrides,
  };
}

function buildReportRow(overrides: Partial<ControllerReportRow> = {}): ControllerReportRow {
  return {
    assigneeName: '조식',
    assigneeUserId: 'user-1',
    checkerUserId: '',
    controllerReview: null,
    deadlineDate: '2026-04-08',
    dispatch: null,
    dispatchSignal: '',
    dispatchStatus: '',
    headquarterId: 'hq-wrong',
    headquarterName: '잘못된 본부',
    lifecycleStatus: 'closed',
    originalPdfAvailable: true,
    originalPdfDownloadPath: '/api/admin/reports/legacy/original-pdf',
    periodLabel: '',
    progressRate: 100,
    qualityStatus: 'unchecked',
    reportKey: 'legacy:technical_guidance:628181',
    reportMonth: '',
    reportTitle: '1차 기술지도 보고서',
    reportType: 'technical_guidance',
    routeParam: 'legacy:technical_guidance:628181',
    siteId: 'site-wrong',
    siteName: '잘못된 현장',
    sortLabel: '잘못된 현장 1차 기술지도 보고서',
    status: 'submitted',
    updatedAt: '2026-04-01T09:00:00+09:00',
    visitDate: '2026-04-01',
    workflowStatus: 'submitted',
    ...overrides,
  };
}

function buildScheduleRow(overrides: Partial<SafetyInspectionSchedule> = {}): SafetyInspectionSchedule {
  return {
    actualVisitDate: '',
    assigneeName: '조식',
    assigneeUserId: 'user-1',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: 'hq-1',
    headquarterName: '서울서부',
    id: 'schedule-1',
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: true,
    linkedReportKey: '',
    plannedDate: '2026-04-01',
    roundNo: 1,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: 'site-live',
    siteName: '청파동3가 118-35 다세대 신축공사',
    status: 'planned',
    totalRounds: 7,
    windowEnd: '2026-10-30',
    windowStart: '2025-10-21',
    ...overrides,
  };
}

test('alignAdminReportRowsWithLegacySites rewires legacy reports to the matched live site', () => {
  const [row] = alignAdminReportRowsWithLegacySites([buildReportRow()], {
    legacyRows: [buildLegacyRow()],
    sites: [buildSite()],
  });

  assert.equal(row?.siteId, 'site-live');
  assert.equal(row?.siteName, '청파동3가 118-35 다세대 신축공사');
  assert.equal(row?.headquarterId, 'hq-1');
  assert.equal(row?.headquarterName, '서울서부');
});

test('alignScheduleRowsWithLegacyReports marks completed legacy schedules as completed', () => {
  const [row] = alignScheduleRowsWithLegacyReports([buildScheduleRow()], {
    legacyRows: [buildLegacyRow()],
    sites: [buildSite()],
    today: new Date('2026-04-23T00:00:00+09:00'),
  });

  assert.equal(row?.status, 'completed');
  assert.equal(row?.actualVisitDate, '2026-04-01');
  assert.equal(row?.linkedReportKey, 'legacy:technical_guidance:628181');
  assert.equal(row?.isOverdue, false);
  assert.equal(row?.plannedDate, '2026-04-01');
});

test('alignScheduleRowsWithLegacyReports keeps draft legacy schedules in progress-ready state', () => {
  const [row] = alignScheduleRowsWithLegacyReports(
    [buildScheduleRow({ isOverdue: true, plannedDate: '2026-04-19', roundNo: 2 })],
    {
      legacyRows: [
        buildLegacyRow({
          legacyReportId: '636877',
          roundNo: 2,
          status: '진행',
          visitDate: '2026-04-24',
        }),
      ],
      sites: [buildSite()],
      today: new Date('2026-04-23T00:00:00+09:00'),
    },
  );

  assert.equal(row?.status, 'planned');
  assert.equal(row?.actualVisitDate, '');
  assert.equal(row?.linkedReportKey, 'legacy:technical_guidance:636877');
  assert.equal(row?.plannedDate, '2026-04-24');
  assert.equal(row?.isOverdue, false);
});

test('alignScheduleRowsWithLegacyReports keeps reserved legacy schedules planned', () => {
  const [row] = alignScheduleRowsWithLegacyReports(
    [
      buildScheduleRow({
        isOverdue: true,
        linkedReportKey: 'legacy:technical_guidance:636877',
        plannedDate: '2026-04-19',
        roundNo: 2,
      }),
    ],
    {
      legacyRows: [
        buildLegacyRow({
          legacyReportId: '636877',
          roundNo: 2,
          status: '예약',
          visitDate: '2026-04-24',
        }),
      ],
      sites: [buildSite()],
      today: new Date('2026-04-25T00:00:00+09:00'),
    },
  );

  assert.equal(row?.status, 'planned');
  assert.equal(row?.actualVisitDate, '');
  assert.equal(row?.linkedReportKey, '');
  assert.equal(row?.plannedDate, '2026-04-24');
  assert.equal(row?.isOverdue, true);
});
