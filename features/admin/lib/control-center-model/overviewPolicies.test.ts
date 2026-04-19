import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  SafetyAdminPriorityQuarterlyManagementRow,
  SafetyAdminUnsentReportRow,
} from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import {
  buildDispatchManagementRows,
  compareDispatchManagementUnsentRows,
  isPriorityQuarterlyManagementRowScope,
  isPriorityQuarterlySiteScope,
  isSiteInCurrentQuarterWindow,
} from './overviewPolicies';

const today = new Date('2026-04-19T00:00:00+09:00');

function buildSite(
  overrides: Partial<SafetySite> = {},
): SafetySite {
  return {
    contract_date: null,
    contract_end_date: null,
    contract_signed_date: null,
    contract_start_date: null,
    headquarter_detail: null,
    is_active: true,
    last_visit_date: '',
    lifecycle_status: 'active',
    project_amount: 1_500_000_000,
    project_end_date: null,
    project_start_date: null,
    status: 'active',
    ...overrides,
  } as SafetySite;
}

function buildDispatchRow(
  overrides: Partial<{
    dispatchCompleted: boolean | null;
    dispatchStatus: string | null;
    lifecycleStatus: string | null;
    progressRate: number | null;
    reportType: string | null;
    siteId: string | null;
    status: string;
    workflowStatus: string | null;
  }> = {},
) {
  return {
    dispatchCompleted: false,
    dispatchStatus: 'warning',
    lifecycleStatus: 'active',
    progressRate: null,
    reportType: 'technical_guidance',
    siteId: 'site-1',
    status: 'draft',
    workflowStatus: 'draft',
    ...overrides,
  };
}

function buildUnsentRow(
  overrides: Partial<SafetyAdminUnsentReportRow> = {},
): SafetyAdminUnsentReportRow {
  return {
    assigneeName: '담당자',
    deadlineDate: '2026-04-19',
    dispatchStatus: 'warning',
    headquarterName: 'HQ',
    href: '/reports/r1',
    referenceDate: '2026-04-19',
    reportKey: 'r1',
    reportTitle: 'Report 1',
    reportTypeLabel: '지도보고서',
    siteId: 'site-1',
    siteName: 'Site 1',
    unsentDays: 1,
    visitDate: '2026-04-19',
    ...overrides,
  };
}

function buildPriorityRow(
  overrides: Partial<SafetyAdminPriorityQuarterlyManagementRow> = {},
): SafetyAdminPriorityQuarterlyManagementRow {
  return {
    currentQuarterKey: '2026-Q2',
    currentQuarterLabel: '2026년 2분기',
    exceptionLabel: '정상',
    exceptionStatus: 'ok',
    headquarterName: 'HQ',
    href: '/reports/q1',
    latestGuidanceDate: '',
    latestGuidanceRound: null,
    projectAmount: 3_000_000_000,
    quarterlyDispatchStatus: 'report_missing',
    quarterlyReflectionStatus: 'missing',
    quarterlyReportHref: '',
    quarterlyReportKey: '',
    siteId: 'site-1',
    siteName: 'Site 1',
    ...overrides,
  };
}

test('current-quarter site scope prefers project period and falls back to contract period', () => {
  assert.equal(
    isSiteInCurrentQuarterWindow(
      buildSite({
        project_start_date: '2026-04-01',
        project_end_date: '2026-06-30',
      }),
      today,
    ),
    true,
  );
  assert.equal(
    isSiteInCurrentQuarterWindow(
      buildSite({
        contract_start_date: '2026-04-15',
        contract_end_date: '2026-05-31',
      }),
      today,
    ),
    true,
  );
  assert.equal(
    isSiteInCurrentQuarterWindow(
      buildSite({
        project_start_date: '2026-01-01',
        project_end_date: '2026-03-31',
      }),
      today,
    ),
    false,
  );
});

test('dispatch management rows keep non-priority active current-quarter rows only', () => {
  const siteById = new Map([
    [
      'site-active-quarter',
      buildSite({
        project_amount: 1_200_000_000,
        project_start_date: '2026-04-01',
        project_end_date: '2026-06-30',
      }),
    ],
    [
      'site-other-quarter',
      buildSite({
        project_start_date: '2026-01-01',
        project_end_date: '2026-03-31',
      }),
    ],
    [
      'site-planned-quarter',
      buildSite({
        project_start_date: '2026-04-01',
        project_end_date: '2026-06-30',
        lifecycle_status: 'planned',
        status: 'planned',
      }),
    ],
  ]);

  const rows = [
    buildDispatchRow({ siteId: 'site-active-quarter' }),
    buildDispatchRow({ siteId: 'site-other-quarter' }),
    buildDispatchRow({ siteId: 'site-planned-quarter' }),
  ];

  const filtered = buildDispatchManagementRows(rows, siteById, today);

  assert.deepEqual(filtered.map((row) => row.siteId), ['site-active-quarter']);
});

test('dispatch priority comparator puts mail-ready rows first and then older unsent rows', () => {
  const sorted = [
    buildUnsentRow({
      mailReady: false,
      reportKey: 'not-ready',
      reportTitle: 'Not ready',
      siteId: 'site-3',
      siteName: 'Site 3',
      unsentDays: 9,
      visitDate: '2026-04-10',
    }),
    buildUnsentRow({
      mailReady: true,
      reportKey: 'ready-old',
      reportTitle: 'Ready old',
      siteId: 'site-1',
      siteName: 'Site 1',
      unsentDays: 8,
      visitDate: '2026-04-11',
    }),
    buildUnsentRow({
      mailReady: true,
      reportKey: 'ready-new',
      reportTitle: 'Ready new',
      siteId: 'site-2',
      siteName: 'Site 2',
      unsentDays: 5,
      visitDate: '2026-04-12',
    }),
  ].sort(compareDispatchManagementUnsentRows);

  assert.deepEqual(
    sorted.map((row) => row.reportKey),
    ['ready-old', 'ready-new', 'not-ready'],
  );
});

test('priority quarterly site scope requires 20억 이상 and current-quarter overlap', () => {
  assert.equal(
    isPriorityQuarterlySiteScope({
      site: buildSite({
        project_amount: 3_000_000_000,
        project_start_date: '2026-04-01',
        project_end_date: '2026-06-30',
      }),
      today,
    }),
    true,
  );
  assert.equal(
    isPriorityQuarterlySiteScope({
      site: buildSite({
        project_amount: 3_000_000_000,
        contract_start_date: '2026-04-10',
        contract_end_date: '2026-05-20',
      }),
      today,
    }),
    true,
  );
  assert.equal(
    isPriorityQuarterlySiteScope({
      site: buildSite({
        project_amount: 1_900_000_000,
        project_start_date: '2026-04-01',
        project_end_date: '2026-06-30',
      }),
      today,
    }),
    false,
  );
  assert.equal(
    isPriorityQuarterlySiteScope({
      site: buildSite({
        project_amount: 3_000_000_000,
        project_start_date: '2026-01-01',
        project_end_date: '2026-03-31',
      }),
      today,
    }),
    false,
  );
});

test('priority quarterly row scope follows the current quarter key from upstream rows', () => {
  assert.equal(
    isPriorityQuarterlyManagementRowScope(
      buildPriorityRow({ currentQuarterKey: '2026-Q2' }),
      today,
    ),
    true,
  );
  assert.equal(
    isPriorityQuarterlyManagementRowScope(
      buildPriorityRow({ currentQuarterKey: '2026-Q1' }),
      today,
    ),
    false,
  );
});
