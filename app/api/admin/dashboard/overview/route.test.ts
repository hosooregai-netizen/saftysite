import assert from 'node:assert/strict';
import test from 'node:test';

import { applyOverviewUpstreamFallbacks } from './routeFallbacks';
import { mapBackendOverviewResponse } from '@/server/admin/upstreamMappers';
import type { SafetyAdminOverviewResponse } from '@/types/admin';
import type { SafetyBackendAdminOverviewResponse } from '@/types/backend';

function buildMappedOverview(): SafetyAdminOverviewResponse {
  return {
    alerts: [],
    completionRows: [],
    coverageRows: [],
    deadlineSignalSummary: { entries: [], totalReportCount: 0 },
    dispatchQueueRows: [],
    deadlineRows: [],
    endingSoonRows: [],
    endingSoonSummary: { entries: [], totalSiteCount: 0 },
    metricCards: [
      { href: '/headquarters?siteStatus=all', label: 'All sites', meta: 'Managed sites', tone: 'default', value: '15 items' },
      { href: '/headquarters?siteStatus=active', label: 'Active', meta: 'Operating sites', tone: 'default', value: '10 items' },
      { href: '/headquarters?siteStatus=planned', label: 'Planned', meta: 'Upcoming sites', tone: 'default', value: '3 items' },
      { href: '/headquarters?siteStatus=closed', label: 'Closed', meta: 'Closed sites', tone: 'default', value: '2 items' },
      { href: '/headquarters?siteStatus=active', label: 'Missing material', meta: 'Quarterly gaps', tone: 'warning', value: '5 sites' },
      { href: '/reports', label: 'Dispatch management', meta: 'Outstanding sends', tone: 'default', value: '0 items' },
    ],
    overdueSiteRows: [],
    pendingReviewRows: [],
    priorityQuarterlyManagementRows: [],
    priorityTargetSiteRows: [],
    quarterlyMaterialSummary: { entries: [], missingSiteRows: [], quarterKey: '', quarterLabel: '', totalSiteCount: 0 },
    recipientMissingSiteRows: [],
    scheduleRows: [],
    siteStatusSummary: { entries: [], totalSiteCount: 0 },
    summaryRows: [
      { label: 'All sites', meta: 'Managed sites', value: '15 items' },
      { label: 'Active', meta: 'Operating sites', value: '10 items' },
      { label: 'Planned', meta: 'Upcoming sites', value: '3 items' },
      { label: 'Closed', meta: 'Closed sites', value: '2 items' },
      { label: 'Missing material', meta: 'Quarterly gaps', value: '5 sites' },
      { label: 'Dispatch management', meta: 'Outstanding sends', value: '0 items' },
    ],
    unsentReportRows: [],
    workerLoadRows: [],
  };
}

function buildBackendOverview(): SafetyBackendAdminOverviewResponse {
  return {
    alerts: [],
    completion_rows: [],
    coverage_rows: [],
    deadline_rows: [],
    deadline_signal_summary: {
      entries: [{ count: 1, href: '/reports?dispatchStatus=warning', key: 'd_plus_4_6', label: 'D+4~6' }],
      total_report_count: 1,
    },
    dispatch_queue_rows: [],
    ending_soon_rows: [],
    ending_soon_summary: { entries: [], total_site_count: 0 },
    metric_cards: [],
    overdue_site_rows: [],
    pending_review_rows: [],
    priority_quarterly_management_rows: [
      {
        current_quarter_key: '2026-Q2',
        current_quarter_label: '2026 Q2',
        exception_label: 'none',
        exception_status: 'ok',
        headquarter_name: 'HQ',
        href: '/reports/q1',
        latest_guidance_date: '2026-04-01',
        latest_guidance_round: 1,
        project_amount: 3000000000,
        quarterly_dispatch_status: 'sent',
        quarterly_reflection_status: 'created',
        quarterly_report_href: '/reports/q1',
        quarterly_report_key: 'q1',
        site_id: 's1',
        site_name: 'Site 1',
      },
    ],
    priority_target_site_rows: [],
    quarterly_material_summary: {
      entries: [],
      missing_site_rows: [],
      quarter_key: '',
      quarter_label: '',
      total_site_count: 0,
    },
    recipient_missing_site_rows: [],
    schedule_rows: [],
    site_status_summary: { entries: [], total_site_count: 0 },
    summary_rows: [],
    unsent_report_rows: [
      {
        assignee_name: 'Owner',
        deadline_date: '2026-04-18',
        dispatch_status: 'warning',
        headquarter_name: 'HQ',
        href: '/reports/r1',
        mail_missing_reason: '',
        mail_ready: true,
        recipient_email: 'owner@example.com',
        recipient_name: 'Owner',
        reference_date: '2026-04-18',
        report_key: 'r1',
        report_title: 'Report',
        report_type_label: 'Technical guidance',
        site_id: 's1',
        site_name: 'Site 1',
        unsent_days: 4,
        visit_date: '2026-04-18',
      },
    ],
    worker_load_rows: [],
  };
}

test('preserves raw upstream unsent and priority rows when mapped overview is emptied by later-stage filtering', () => {
  const restored = applyOverviewUpstreamFallbacks(buildBackendOverview(), buildMappedOverview());

  assert.equal(restored.unsentReportRows.length, 1);
  assert.equal((restored.priorityQuarterlyManagementRows ?? []).length, 1);
  assert.equal(restored.deadlineSignalSummary.totalReportCount, 1);
  assert.match(restored.metricCards[5]?.value ?? '', /^1/);
  assert.match(restored.summaryRows[5]?.value ?? '', /^1/);
});

test('keeps mapped overview unchanged when representative rows are already present', () => {
  const mappedOverview = buildMappedOverview();
  mappedOverview.unsentReportRows = [
    {
      assigneeName: 'Owner',
      deadlineDate: '2026-04-18',
      dispatchStatus: 'warning',
      headquarterName: 'HQ',
      href: '/reports/r1',
      referenceDate: '2026-04-18',
      reportKey: 'r1',
      reportTitle: 'Report',
      reportTypeLabel: 'Technical guidance',
      siteId: 's1',
      siteName: 'Site 1',
      unsentDays: 4,
      visitDate: '2026-04-18',
    },
  ];
  mappedOverview.priorityQuarterlyManagementRows = [
    {
      currentQuarterKey: '2026-Q2',
      currentQuarterLabel: '2026 Q2',
      exceptionLabel: 'none',
      exceptionStatus: 'ok',
      headquarterName: 'HQ',
      href: '/reports/q1',
      latestGuidanceDate: '2026-04-01',
      latestGuidanceRound: 1,
      projectAmount: 3000000000,
      quarterlyDispatchStatus: 'sent',
      quarterlyReflectionStatus: 'created',
      quarterlyReportHref: '/reports/q1',
      quarterlyReportKey: 'q1',
      siteId: 's1',
      siteName: 'Site 1',
    },
  ];

  const preserved = applyOverviewUpstreamFallbacks(buildBackendOverview(), mappedOverview);

  assert.strictEqual(preserved, mappedOverview);
});

test('drops long-overdue unsent rows from the mapped overview queue', () => {
  const backendOverview = buildBackendOverview();
  backendOverview.metric_cards = [
    {
      href: '/reports',
      label: 'Dispatch management',
      meta: 'Outstanding sends',
      tone: 'danger',
      value: '1 items',
    },
  ];
  backendOverview.summary_rows = [
    { label: 'Dispatch management', meta: 'Outstanding sends', value: '1 items' },
  ];
  backendOverview.unsent_report_rows = [
    {
      assignee_name: 'Owner',
      deadline_date: '2026-03-01',
      dispatch_status: 'overdue',
      headquarter_name: 'HQ',
      href: '/reports/r-long',
      mail_missing_reason: '',
      mail_ready: true,
      recipient_email: 'owner@example.com',
      recipient_name: 'Owner',
      reference_date: '2026-03-01',
      report_key: 'r-long',
      report_title: 'Long overdue report',
      report_type_label: 'Technical guidance',
      site_id: 's1',
      site_name: 'Site 1',
      unsent_days: 49,
      visit_date: '2026-03-01',
    },
  ];

  const mappedOverview = mapBackendOverviewResponse(backendOverview);

  assert.equal(mappedOverview.unsentReportRows.length, 0);
  assert.equal(mappedOverview.deadlineSignalSummary.totalReportCount, 0);
  assert.match(mappedOverview.metricCards[0]?.value ?? '', /^0/);
});

test('does not restore long-overdue unsent rows through upstream fallback', () => {
  const mappedOverview = buildMappedOverview();
  const backendOverview = buildBackendOverview();
  backendOverview.unsent_report_rows = [
    {
      assignee_name: 'Owner',
      deadline_date: '2026-03-01',
      dispatch_status: 'overdue',
      headquarter_name: 'HQ',
      href: '/reports/r-long',
      mail_missing_reason: '',
      mail_ready: true,
      recipient_email: 'owner@example.com',
      recipient_name: 'Owner',
      reference_date: '2026-03-01',
      report_key: 'r-long',
      report_title: 'Long overdue report',
      report_type_label: 'Technical guidance',
      site_id: 's1',
      site_name: 'Site 1',
      unsent_days: 49,
      visit_date: '2026-03-01',
    },
  ];

  const restored = applyOverviewUpstreamFallbacks(backendOverview, mappedOverview);

  assert.equal(restored.unsentReportRows.length, 0);
  assert.equal(restored.deadlineSignalSummary.totalReportCount, 0);
  assert.match(restored.metricCards[5]?.value ?? '', /^0/);
});

test('restores upstream unsent rows in dispatch priority order', () => {
  const mappedOverview = buildMappedOverview();
  const backendOverview = buildBackendOverview();
  backendOverview.unsent_report_rows = [
    {
      assignee_name: 'No Mail',
      deadline_date: '2026-04-10',
      dispatch_status: 'overdue',
      headquarter_name: 'HQ',
      href: '/reports/r-not-ready',
      mail_missing_reason: 'Missing mail',
      mail_ready: false,
      recipient_email: '',
      recipient_name: '',
      reference_date: '2026-04-10',
      report_key: 'r-not-ready',
      report_title: 'Not ready report',
      report_type_label: 'Technical guidance',
      site_id: 's2',
      site_name: 'Site 2',
      unsent_days: 9,
      visit_date: '2026-04-10',
    },
    {
      assignee_name: 'Ready',
      deadline_date: '2026-04-11',
      dispatch_status: 'warning',
      headquarter_name: 'HQ',
      href: '/reports/r-ready',
      mail_missing_reason: '',
      mail_ready: true,
      recipient_email: 'ready@example.com',
      recipient_name: 'Ready',
      reference_date: '2026-04-11',
      report_key: 'r-ready',
      report_title: 'Ready report',
      report_type_label: 'Technical guidance',
      site_id: 's1',
      site_name: 'Site 1',
      unsent_days: 8,
      visit_date: '2026-04-11',
    },
  ];

  const restored = applyOverviewUpstreamFallbacks(backendOverview, mappedOverview);

  assert.deepEqual(
    restored.unsentReportRows.map((row) => row.reportKey),
    ['r-ready', 'r-not-ready'],
  );
});
