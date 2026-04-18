import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAdminOverviewPolicyOverlay,
  mergeAdminOverviewPolicyOverlay,
} from './overviewPolicyOverlay';
import type { SafetyAdminOverviewResponse } from '@/types/admin';

function buildBaseOverview(): SafetyAdminOverviewResponse {
  return {
    alerts: [{
      createdAt: '',
      description: '',
      href: '/alerts/1',
      id: 'a1',
      reportKey: '',
      scheduleId: '',
      severity: 'info',
      siteId: '',
      title: 'Alert',
      type: 'schedule_conflict',
    }],
    completionRows: [{ href: '/sites/s1', headquarterName: 'HQ', missingItems: ['contact'], siteId: 's1', siteName: 'Site 1' }],
    coverageRows: [{ itemCount: 1, label: 'Coverage', missingSiteCount: 0 }],
    deadlineSignalSummary: {
      entries: [{ count: 1, href: '/reports?dispatchStatus=warning', key: 'd_plus_4_6', label: 'D+4~6' }],
      totalReportCount: 1,
    },
    dispatchQueueRows: [{ dispatchAlertsEnabled: true, dispatchPolicyEnabled: true, headquarterName: 'HQ', href: '/reports', openReportCount: 1, projectAmount: 1000, recipientEmail: 'x@example.com', siteId: 's1', siteName: 'Site 1', totalContractAmount: 1000 }],
    deadlineRows: [{ deadlineDate: '2026-04-18', deadlineLabel: 'Today', href: '/reports/r1', reportTitle: 'Report', reportTypeLabel: 'Technical guidance', siteName: 'Site 1', statusLabel: 'Pending' }],
    endingSoonRows: [{ deadlineLabel: 'D-7', daysUntilEnd: 7, endDate: '2026-04-25', endDateSource: 'contract_end_date', headquarterName: 'HQ', href: '/sites/s1', siteId: 's1', siteName: 'Site 1' }],
    endingSoonSummary: {
      entries: [{ count: 1, href: '/sites?endingSoon=true', key: 'd_0_7', label: 'D-0~7' }],
      totalSiteCount: 1,
    },
    metricCards: [
      { href: '/headquarters?siteStatus=all', label: 'All sites', meta: 'Managed sites', tone: 'warning', value: '99 items' },
      { href: '/headquarters?siteStatus=active', label: 'Active', meta: 'Operating sites', tone: 'warning', value: '88 items' },
      { href: '/headquarters?siteStatus=planned', label: 'Planned', meta: 'Upcoming sites', tone: 'warning', value: '77 items' },
      { href: '/headquarters?siteStatus=closed', label: 'Closed', meta: 'Closed sites', tone: 'warning', value: '66 items' },
      { href: '/headquarters?siteStatus=active', label: 'Missing material', meta: 'Quarterly gaps', tone: 'warning', value: '5 sites' },
      { href: '/reports', label: 'Dispatch management', meta: 'Outstanding sends', tone: 'danger', value: '4 items' },
    ],
    overdueSiteRows: [{ badWorkplaceOverdueCount: 0, headquarterName: 'HQ', href: '/sites/s1', overdueCount: 1, quarterlyOverdueCount: 0, reportKindsLabel: 'Quarterly', siteName: 'Site 1' }],
    pendingReviewRows: [{ assigneeName: 'Owner', headquarterName: 'HQ', href: '/reports/r1', qualityLabel: 'Needs review', reportTitle: 'Report', reportTypeLabel: 'Technical guidance', siteName: 'Site 1', updatedAt: '2026-04-18' }],
    priorityQuarterlyManagementRows: [{ currentQuarterKey: '2026-Q2', currentQuarterLabel: '2026 Q2', exceptionLabel: 'none', exceptionStatus: 'ok', headquarterName: 'HQ', href: '/reports/q1', latestGuidanceDate: '2026-04-01', latestGuidanceRound: 1, projectAmount: 3000000000, quarterlyDispatchStatus: 'sent', quarterlyReflectionStatus: 'created', quarterlyReportHref: '/reports/q1', quarterlyReportKey: 'q1', siteId: 's1', siteName: 'Site 1' }],
    priorityTargetSiteRows: [{ dispatchAlertsEnabled: true, dispatchPolicyEnabled: true, headquarterName: 'HQ', href: '/reports', openReportCount: 1, projectAmount: 1000, recipientEmail: 'x@example.com', siteId: 's1', siteName: 'Site 1', totalContractAmount: 1000 }],
    quarterlyMaterialSummary: {
      entries: [{ count: 1, href: '/reports?quarter=2026-Q2', key: 'missing', label: 'Missing' }],
      missingSiteRows: [{ education: { filledCount: 0, missingCount: 1, requiredCount: 1 }, headquarterName: 'HQ', href: '/sites/s1', measurement: { filledCount: 0, missingCount: 1, requiredCount: 1 }, missingLabels: ['education'], quarterKey: '2026-Q2', quarterLabel: '2026 Q2', siteId: 's1', siteName: 'Site 1' }],
      quarterKey: '2026-Q2',
      quarterLabel: '2026 Q2',
      totalSiteCount: 1,
    },
    recipientMissingSiteRows: [{ dispatchAlertsEnabled: true, dispatchPolicyEnabled: true, headquarterName: 'HQ', href: '/reports', openReportCount: 1, projectAmount: 1000, recipientEmail: '', siteId: 's1', siteName: 'Site 1', totalContractAmount: 1000 }],
    scheduleRows: [{ actualVisitDate: '', assigneeName: 'Owner', assigneeUserId: 'u1', exceptionMemo: '', exceptionReasonCode: '', headquarterId: 'h1', headquarterName: 'HQ', id: 'sch1', isConflicted: false, isOutOfWindow: false, isOverdue: false, linkedReportKey: '', plannedDate: '2026-04-18', roundNo: 1, selectionConfirmedAt: '', selectionConfirmedByName: '', selectionConfirmedByUserId: '', selectionReasonLabel: '', selectionReasonMemo: '', siteId: 's1', siteName: 'Site 1', status: 'planned', totalRounds: 1, windowEnd: '2026-04-20', windowStart: '2026-04-18' }],
    siteStatusSummary: {
      entries: [
        { count: 99, href: '/headquarters?siteStatus=active', key: 'active', label: 'Active' },
        { count: 88, href: '/headquarters?siteStatus=planned', key: 'planned', label: 'Planned' },
        { count: 77, href: '/headquarters?siteStatus=closed', key: 'closed', label: 'Closed' },
      ],
      totalSiteCount: 264,
    },
    summaryRows: [
      { label: 'All sites', meta: 'Managed sites', value: '99 items' },
      { label: 'Active', meta: 'Operating sites', value: '88 items' },
      { label: 'Planned', meta: 'Upcoming sites', value: '77 items' },
      { label: 'Closed', meta: 'Closed sites', value: '66 items' },
      { label: 'Missing material', meta: 'Quarterly gaps', value: '5 sites' },
      { label: 'Dispatch management', meta: 'Outstanding sends', value: '4 items' },
    ],
    unsentReportRows: [{ assigneeName: 'Owner', deadlineDate: '2026-04-18', dispatchStatus: 'warning', headquarterName: 'HQ', href: '/reports/r1', referenceDate: '2026-04-18', reportKey: 'r1', reportTitle: 'Report', reportTypeLabel: 'Technical guidance', siteId: 's1', siteName: 'Site 1', unsentDays: 4, visitDate: '2026-04-18' }],
    workerLoadRows: [{ assignedSiteCount: 1, href: '/users/u1', loadLabel: 'Normal', overdueCount: 0, userName: 'Owner' }],
  };
}

test('merge keeps overview response top-level shape and only patches site status driven fields', () => {
  const base = buildBaseOverview();
  const overlay = {
    siteStatusSummary: {
      entries: [
        { count: 10, href: '/headquarters?siteStatus=active', key: 'active', label: 'Active' },
        { count: 3, href: '/headquarters?siteStatus=planned', key: 'planned', label: 'Planned' },
        { count: 2, href: '/headquarters?siteStatus=closed', key: 'closed', label: 'Closed' },
      ],
      totalSiteCount: 15,
    },
  };

  const merged = mergeAdminOverviewPolicyOverlay(base, overlay);

  assert.deepEqual(Object.keys(merged).sort(), Object.keys(base).sort());
  assert.deepEqual(merged.siteStatusSummary, overlay.siteStatusSummary);

  assert.match(merged.metricCards[0]?.value ?? '', /^15/);
  assert.match(merged.metricCards[1]?.value ?? '', /^10/);
  assert.match(merged.metricCards[2]?.value ?? '', /^3/);
  assert.match(merged.metricCards[3]?.value ?? '', /^2/);
  assert.equal(merged.metricCards[4]?.value, base.metricCards[4]?.value);
  assert.equal(merged.metricCards[5]?.value, base.metricCards[5]?.value);
  assert.equal(merged.metricCards[0]?.tone, 'default');
  assert.equal(merged.metricCards[5]?.tone, base.metricCards[5]?.tone);

  assert.match(merged.summaryRows[0]?.value ?? '', /^15/);
  assert.match(merged.summaryRows[1]?.value ?? '', /^10/);
  assert.match(merged.summaryRows[2]?.value ?? '', /^3/);
  assert.match(merged.summaryRows[3]?.value ?? '', /^2/);
  assert.equal(merged.summaryRows[4]?.value, base.summaryRows[4]?.value);
  assert.equal(merged.summaryRows[5]?.value, base.summaryRows[5]?.value);

  assert.deepEqual(merged.deadlineSignalSummary, base.deadlineSignalSummary);
  assert.deepEqual(merged.priorityQuarterlyManagementRows, base.priorityQuarterlyManagementRows);
  assert.deepEqual(merged.unsentReportRows, base.unsentReportRows);
});

test('build reuses upstream site status summary without extra source fetch requirements', () => {
  const base = buildBaseOverview();

  const overlay = buildAdminOverviewPolicyOverlay(base);

  assert.notStrictEqual(overlay.siteStatusSummary, base.siteStatusSummary);
  assert.deepEqual(overlay.siteStatusSummary, base.siteStatusSummary);
  assert.notStrictEqual(overlay.siteStatusSummary.entries, base.siteStatusSummary.entries);
});
