import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildContractWindowFromSafetySite,
  buildContractWindowFromScheduleRows,
  buildScheduleReportSyncPlan,
  resolveContractWindow,
} from './scheduleReportSync';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { InspectionReportListItem } from '@/types/inspectionSession';

const contractWindow = {
  windowEnd: '2026-05-30',
  windowStart: '2026-04-09',
};

function schedule(input: Partial<SafetyInspectionSchedule> & Pick<SafetyInspectionSchedule, 'id' | 'roundNo'>): SafetyInspectionSchedule {
  return {
    actualVisitDate: input.actualVisitDate ?? '',
    assigneeName: '',
    assigneeUserId: '',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: '',
    headquarterName: '',
    id: input.id,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: input.linkedReportKey ?? '',
    plannedDate: input.plannedDate ?? '',
    roundNo: input.roundNo,
    totalRounds: input.totalRounds ?? 3,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: 'site-1',
    siteName: 'Site 1',
    status: input.status ?? 'planned',
    windowEnd: input.windowEnd ?? '2026-04-09',
    windowStart: input.windowStart ?? '2026-04-09',
  };
}

function report(input: Partial<InspectionReportListItem> & Pick<InspectionReportListItem, 'reportKey'>): InspectionReportListItem {
  return {
    assignedUserId: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    dispatchCompleted: input.dispatchCompleted ?? false,
    headquarterId: null,
    id: input.reportKey,
    lastAutosavedAt: null,
    latestRevisionNo: 0,
    meta: {},
    originalPdfAvailable: false,
    payloadVersion: 1,
    progressRate: null,
    publishedAt: null,
    readOnly: false,
    reportKey: input.reportKey,
    reportOpenHref: null,
    reportOpenMode: 'session',
    reportTitle: input.reportTitle ?? `old-${input.reportKey}`,
    scheduleId: input.scheduleId ?? null,
    siteId: 'site-1',
    status: input.status ?? 'draft',
    submittedAt: null,
    totalRound: null,
    updatedAt: '2026-04-01T00:00:00.000Z',
    visitDate: input.visitDate ?? null,
    visitRound: input.visitRound ?? null,
  };
}

const title = (date: string, round: number) => `${date} report ${round}`;

test('buildContractWindowFromSafetySite reads registered contract start and end dates', () => {
  assert.deepEqual(
    buildContractWindowFromSafetySite({
      contract_date: '2026-04-04',
      contract_end_date: '2026-05-31',
      contract_signed_date: '2026-04-04',
      contract_start_date: '2026-03-22',
      project_end_date: null,
      project_start_date: null,
    }),
    {
      windowEnd: '2026-05-31',
      windowStart: '2026-03-22',
    },
  );
});

test('resolveContractWindow falls back to schedule rows when a cached site has no contract dates', () => {
  const fallback = buildContractWindowFromScheduleRows([
    schedule({ id: 'schedule-1', roundNo: 1, windowEnd: '2026-05-31', windowStart: '2026-03-22' }),
    schedule({ id: 'schedule-2', roundNo: 2, windowEnd: '2026-05-31', windowStart: '2026-03-22' }),
  ]);

  assert.deepEqual(
    resolveContractWindow({ windowEnd: '', windowStart: '' }, fallback),
    {
      windowEnd: '2026-05-31',
      windowStart: '2026-03-22',
    },
  );
});

test('buildScheduleReportSyncPlan reorders schedules and reports by visit date', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    contractWindow,
    reports: [
      report({ reportKey: 'report-2', scheduleId: 'schedule-2', visitDate: '2026-04-20', visitRound: 2 }),
      report({ reportKey: 'report-3', scheduleId: 'schedule-3', visitDate: '2026-04-13', visitRound: 3 }),
    ],
    schedules: [
      schedule({ id: 'schedule-1', roundNo: 1 }),
      schedule({ id: 'schedule-2', linkedReportKey: 'report-2', plannedDate: '2026-04-20', roundNo: 2 }),
      schedule({ id: 'schedule-3', linkedReportKey: 'report-3', plannedDate: '2026-04-13', roundNo: 3 }),
    ],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.deepEqual(
    plan.scheduleUpdates.map((item) => [item.scheduleId, item.plannedDate, item.linkedReportKey]),
    [
      ['schedule-1', '2026-04-13', 'report-3'],
      ['schedule-2', '2026-04-20', 'report-2'],
      ['schedule-3', '', ''],
    ],
  );
  assert.deepEqual(
    plan.reportUpdates.map((item) => [item.reportKey, item.visitRound, item.scheduleId, item.reportTitle]),
    [
      ['report-3', 1, 'schedule-1', '2026-04-13 report 1'],
      ['report-2', 2, 'schedule-2', '2026-04-20 report 2'],
    ],
  );
});

test('buildScheduleReportSyncPlan keeps capacity when full site schedule rows are supplied', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    contractWindow,
    reports: [
      report({ reportKey: 'report-1', scheduleId: 'schedule-1', visitDate: '2026-04-10', visitRound: 1 }),
      report({ reportKey: 'report-2', scheduleId: 'schedule-2', visitDate: '2026-04-12', visitRound: 2 }),
      report({ reportKey: 'report-3', scheduleId: 'schedule-3', visitDate: '2026-04-14', visitRound: 3 }),
      report({ reportKey: 'report-4', scheduleId: 'schedule-4', visitDate: '2026-04-16', visitRound: 4 }),
    ],
    schedules: [
      schedule({ actualVisitDate: '2026-04-10', id: 'schedule-1', linkedReportKey: 'report-1', plannedDate: '2026-04-10', roundNo: 1 }),
      schedule({ actualVisitDate: '2026-04-12', id: 'schedule-2', linkedReportKey: 'report-2', plannedDate: '2026-04-12', roundNo: 2 }),
      schedule({ actualVisitDate: '2026-04-14', id: 'schedule-3', linkedReportKey: 'report-3', plannedDate: '2026-04-14', roundNo: 3 }),
      schedule({ actualVisitDate: '2026-04-16', id: 'schedule-4', linkedReportKey: 'report-4', plannedDate: '2026-04-16', roundNo: 4 }),
      schedule({ id: 'schedule-5', roundNo: 5 }),
    ],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.scheduleUpdates.length, 0);
});

test('buildScheduleReportSyncPlan syncs a changed schedule date into the linked report', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    changedSchedule: {
      linkedReportKey: 'report-1',
      plannedDate: '2026-04-22',
      scheduleId: 'schedule-1',
    },
    contractWindow,
    reports: [report({ reportKey: 'report-1', scheduleId: 'schedule-1', visitDate: '2026-04-10', visitRound: 1 })],
    schedules: [schedule({ id: 'schedule-1', linkedReportKey: 'report-1', plannedDate: '2026-04-10', roundNo: 1 })],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.deepEqual(plan.scheduleUpdates[0], {
    actualVisitDate: '',
    linkedReportKey: 'report-1',
    plannedDate: '2026-04-22',
    roundNo: 1,
    scheduleId: 'schedule-1',
  });
  assert.deepEqual(plan.reportUpdates[0], {
    reportKey: 'report-1',
    reportTitle: '2026-04-22 report 1',
    scheduleId: 'schedule-1',
    scheduleRoundNo: 1,
    visitDate: '2026-04-22',
    visitRound: 1,
  });
});

test('buildScheduleReportSyncPlan does not reorder other rounds for a manual schedule date change', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    changedSchedule: {
      plannedDate: '2026-05-02',
      scheduleId: 'schedule-8',
    },
    contractWindow: {
      windowEnd: '2026-05-31',
      windowStart: '2026-03-22',
    },
    reports: [
      report({ reportKey: 'report-1', scheduleId: 'schedule-1', visitDate: '2026-04-08', visitRound: 1 }),
      report({ reportKey: 'report-2', scheduleId: 'schedule-2', visitDate: '2026-04-09', visitRound: 2 }),
      report({ reportKey: 'report-3', scheduleId: 'schedule-3', visitDate: '2026-04-13', visitRound: 3 }),
      report({ reportKey: 'report-4', scheduleId: 'schedule-4', visitDate: '2026-04-17', visitRound: 4 }),
      report({ reportKey: 'report-5a', scheduleId: 'schedule-5', visitDate: '2026-04-24', visitRound: 5 }),
      report({ reportKey: 'report-5b', visitDate: '2026-04-26', visitRound: 5 }),
      report({ reportKey: 'report-6', scheduleId: 'schedule-6', visitDate: '2026-04-29', visitRound: 6 }),
      report({ reportKey: 'report-7', scheduleId: 'schedule-7', visitDate: '2026-04-30', visitRound: 7 }),
    ],
    schedules: [
      schedule({ id: 'schedule-1', linkedReportKey: 'report-1', plannedDate: '2026-04-08', roundNo: 1 }),
      schedule({ id: 'schedule-2', linkedReportKey: 'report-2', plannedDate: '2026-04-09', roundNo: 2 }),
      schedule({ id: 'schedule-3', linkedReportKey: 'report-3', plannedDate: '2026-04-13', roundNo: 3 }),
      schedule({ id: 'schedule-4', linkedReportKey: 'report-4', plannedDate: '2026-04-17', roundNo: 4 }),
      schedule({ id: 'schedule-5', plannedDate: '2026-04-24', roundNo: 5 }),
      schedule({ id: 'schedule-6', linkedReportKey: 'report-6', plannedDate: '2026-04-26', roundNo: 6 }),
      schedule({ id: 'schedule-7', linkedReportKey: 'report-7', plannedDate: '2026-04-30', roundNo: 7 }),
      schedule({ id: 'schedule-8', plannedDate: '2026-04-30', roundNo: 8 }),
      schedule({ id: 'schedule-9', roundNo: 9 }),
    ],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.deepEqual(plan.scheduleUpdates, [
    {
      actualVisitDate: '',
      linkedReportKey: '',
      plannedDate: '2026-05-02',
      roundNo: 8,
      scheduleId: 'schedule-8',
    },
  ]);
  assert.deepEqual(plan.reportUpdates, []);
});

test('buildScheduleReportSyncPlan does not clear unlinked schedule-only rows', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    contractWindow,
    reports: [],
    schedules: [
      schedule({ id: 'schedule-1', roundNo: 1 }),
      schedule({ id: 'schedule-2', plannedDate: '2026-04-13', roundNo: 2 }),
    ],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.deepEqual(
    plan.scheduleUpdates.map((item) => [item.scheduleId, item.plannedDate, item.linkedReportKey]),
    [['schedule-1', '2026-04-13', '']],
  );
});

test('buildScheduleReportSyncPlan syncs a changed report date into the schedule', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    changedReport: {
      reportKey: 'report-1',
      visitDate: '2026-04-24',
    },
    contractWindow,
    reports: [report({ reportKey: 'report-1', scheduleId: 'schedule-1', visitDate: '2026-04-10', visitRound: 1 })],
    schedules: [schedule({ id: 'schedule-1', linkedReportKey: 'report-1', plannedDate: '2026-04-10', roundNo: 1 })],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.scheduleUpdates[0]?.plannedDate, '2026-04-24');
  assert.equal(plan.reportUpdates[0]?.visitDate, '2026-04-24');
});

test('buildScheduleReportSyncPlan leaves dispatched reports out of report update payloads', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    contractWindow,
    reports: [
      report({
        dispatchCompleted: true,
        reportKey: 'report-1',
        scheduleId: 'schedule-1',
        visitDate: '2026-04-10',
        visitRound: 1,
      }),
    ],
    schedules: [
      schedule({ id: 'schedule-1', linkedReportKey: 'report-1', plannedDate: '2026-04-10', roundNo: 1 }),
    ],
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.deepEqual(plan.reportUpdates, []);
});

test('buildScheduleReportSyncPlan blocks out-of-contract dates', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    changedSchedule: {
      plannedDate: '2026-06-01',
      scheduleId: 'schedule-1',
    },
    contractWindow,
    reports: [],
    schedules: [schedule({ id: 'schedule-1', plannedDate: '2026-04-10', roundNo: 1 })],
  });

  assert.equal(plan.ok, false);
  if (plan.ok) return;
  assert.equal(plan.code, 'contract-window-out-of-range');
});

test('buildScheduleReportSyncPlan blocks moves for dispatched reports', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    contractWindow,
    reports: [
      report({
        dispatchCompleted: true,
        reportKey: 'report-2',
        scheduleId: 'schedule-2',
        visitDate: '2026-04-10',
        visitRound: 2,
      }),
    ],
    schedules: [
      schedule({ id: 'schedule-1', roundNo: 1 }),
      schedule({ id: 'schedule-2', linkedReportKey: 'report-2', plannedDate: '2026-04-10', roundNo: 2 }),
    ],
  });

  assert.equal(plan.ok, false);
  if (plan.ok) return;
  assert.equal(plan.code, 'dispatch-completed-locked');
});

test('buildScheduleReportSyncPlan blocks date changes for dispatched reports', () => {
  const plan = buildScheduleReportSyncPlan({
    buildReportTitle: title,
    changedReport: {
      reportKey: 'report-1',
      visitDate: '2026-04-11',
    },
    contractWindow,
    reports: [
      report({
        dispatchCompleted: true,
        reportKey: 'report-1',
        scheduleId: 'schedule-1',
        visitDate: '2026-04-10',
        visitRound: 1,
      }),
    ],
    schedules: [
      schedule({ id: 'schedule-1', linkedReportKey: 'report-1', plannedDate: '2026-04-10', roundNo: 1 }),
    ],
  });

  assert.equal(plan.ok, false);
  if (plan.ok) return;
  assert.equal(plan.code, 'dispatch-completed-locked');
});
