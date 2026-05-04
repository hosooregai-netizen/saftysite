import assert from 'node:assert/strict';
import test from 'node:test';

import type { SafetyInspectionSchedule } from '@/types/admin';
import type { InspectionReportListItem } from '@/types/inspectionSession';
import {
  buildWorkerCalendarReportLookup,
  buildWorkerCalendarRowsWithReportDates,
  findDuplicateUnlinkedScheduleReservations,
  mergeWorkerCalendarReportItems,
  resolveWorkerCalendarReportForSchedule,
} from './workerCalendarReportMatching';

function buildReport(
  input: Partial<InspectionReportListItem> & Pick<InspectionReportListItem, 'reportKey'>,
): InspectionReportListItem {
  return {
    assignedUserId: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    dispatchCompleted: false,
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
    reportTitle: input.reportTitle ?? input.reportKey,
    scheduleId: input.scheduleId ?? null,
    siteId: input.siteId ?? 'site-1',
    status: input.status ?? 'draft',
    submittedAt: null,
    totalRound: null,
    updatedAt: input.updatedAt ?? '2026-04-01T00:00:00.000Z',
    visitDate: input.visitDate ?? null,
    visitRound: input.visitRound ?? null,
  };
}

function buildSchedule(input: Partial<SafetyInspectionSchedule> & Pick<SafetyInspectionSchedule, 'id' | 'roundNo'>): SafetyInspectionSchedule {
  return {
    actualVisitDate: input.actualVisitDate ?? '',
    assigneeName: '',
    assigneeUserId: '',
    exceptionMemo: input.exceptionMemo ?? '',
    exceptionReasonCode: input.exceptionReasonCode ?? '',
    headquarterId: '',
    headquarterName: '',
    id: input.id,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: input.linkedReportKey ?? '',
    plannedDate: input.plannedDate ?? '',
    roundNo: input.roundNo,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: input.selectionReasonLabel ?? '',
    selectionReasonMemo: input.selectionReasonMemo ?? '',
    siteId: input.siteId ?? 'site-1',
    siteName: input.siteName ?? 'Site 1',
    status: input.status ?? 'planned',
    totalRounds: input.totalRounds ?? 8,
    windowEnd: input.windowEnd ?? '2026-05-30',
    windowStart: input.windowStart ?? '2026-04-09',
  };
}

test('worker calendar report lookup prefers an explicit linked report key over round fallback', () => {
  const linked = buildReport({ reportKey: 'report-linked', visitDate: '2026-04-25', visitRound: 5 });
  const roundFallback = buildReport({ reportKey: 'report-round', visitDate: '2026-04-23', visitRound: 5 });
  const lookup = buildWorkerCalendarReportLookup([roundFallback, linked]);

  const matched = resolveWorkerCalendarReportForSchedule(
    { id: 'schedule-5', linkedReportKey: 'report-linked', roundNo: 5 },
    lookup,
  );

  assert.equal(matched?.reportKey, 'report-linked');
});

test('worker calendar report lookup can match by schedule id before using round', () => {
  const scheduled = buildReport({
    reportKey: 'report-scheduled',
    scheduleId: 'schedule-6',
    visitDate: '2026-04-30',
    visitRound: 6,
  });
  const roundFallback = buildReport({ reportKey: 'report-round', visitDate: '2026-04-28', visitRound: 6 });
  const lookup = buildWorkerCalendarReportLookup([roundFallback, scheduled]);

  const matched = resolveWorkerCalendarReportForSchedule(
    { id: 'schedule-6', linkedReportKey: '', roundNo: 6 },
    lookup,
  );

  assert.equal(matched?.reportKey, 'report-scheduled');
});

test('worker calendar report merge keeps local draft sessions when the remote index is stale', () => {
  const remote = buildReport({
    reportKey: 'report-remote',
    scheduleId: 'schedule-1',
    visitDate: '2026-04-08',
    visitRound: 1,
  });
  const localDraft = buildReport({
    reportKey: 'report-local',
    scheduleId: 'schedule-2',
    visitDate: '2026-04-15',
    visitRound: 2,
  });

  const merged = mergeWorkerCalendarReportItems([remote], [localDraft]);

  assert.deepEqual(
    merged.map((row) => row.reportKey),
    ['report-remote', 'report-local'],
  );
});

test('worker calendar rows do not let report cache overwrite an existing schedule row', () => {
  const rows = buildWorkerCalendarRowsWithReportDates({
    reportsBySiteId: new Map([
      [
        'site-1',
        [
          buildReport({
            reportKey: 'report-1',
            scheduleId: 'schedule-1',
            visitDate: '2026-04-08',
            visitRound: 1,
          }),
        ],
      ],
    ]),
    rows: [buildSchedule({ id: 'schedule-1', roundNo: 1 })],
    sites: [{ id: 'site-1', siteName: 'Site 1', totalRounds: 8 }],
  });

  assert.equal(rows[0]?.plannedDate, '');
  assert.equal(rows[0]?.actualVisitDate, '');
  assert.equal(rows[0]?.linkedReportKey, '');
});

test('worker calendar rows can show report-backed schedules omitted from the month response', () => {
  const rows = buildWorkerCalendarRowsWithReportDates({
    contractWindowsBySiteId: {
      'site-1': {
        windowEnd: '2026-05-30',
        windowStart: '2026-04-09',
      },
    },
    reportsBySiteId: new Map([
      [
        'site-1',
        [
          buildReport({
            reportKey: 'report-2',
            scheduleId: 'schedule-2',
            visitDate: '2026-04-10',
            visitRound: 2,
          }),
        ],
      ],
    ]),
    rows: [],
    sites: [{ id: 'site-1', siteName: 'Site 1', totalRounds: 10 }],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, 'schedule-2');
  assert.equal(rows[0]?.roundNo, 2);
  assert.equal(rows[0]?.plannedDate, '2026-04-10');
  assert.equal(rows[0]?.windowStart, '2026-04-09');
});

test('worker calendar rows keep DB schedule dates when report cache has a different date', () => {
  const rows = buildWorkerCalendarRowsWithReportDates({
    reportsBySiteId: new Map([
      [
        'site-1',
        [
          buildReport({
            reportKey: 'report-5',
            scheduleId: 'schedule-5',
            visitDate: '2026-04-24',
            visitRound: 5,
          }),
        ],
      ],
    ]),
    rows: [
      buildSchedule({ id: 'schedule-5', plannedDate: '2026-04-22', roundNo: 5 }),
      buildSchedule({ id: 'schedule-10', plannedDate: '2026-04-24', roundNo: 10 }),
    ],
    sites: [{ id: 'site-1', siteName: 'Site 1', totalRounds: 10 }],
  });

  assert.deepEqual(
    rows.map((row) => row.id),
    ['schedule-5', 'schedule-10'],
  );
  assert.equal(rows[0]?.plannedDate, '2026-04-22');
  assert.equal(rows[0]?.linkedReportKey, '');
});

test('duplicate reservation finder only targets blank unlinked planned rows', () => {
  const duplicate = buildSchedule({ id: 'schedule-10', plannedDate: '2026-04-24', roundNo: 10 });
  const duplicates = findDuplicateUnlinkedScheduleReservations([
    buildSchedule({
      actualVisitDate: '2026-04-24',
      id: 'schedule-5',
      linkedReportKey: 'report-5',
      plannedDate: '2026-04-24',
      roundNo: 5,
    }),
    duplicate,
    buildSchedule({
      id: 'schedule-9',
      plannedDate: '2026-04-24',
      roundNo: 9,
      selectionReasonMemo: 'manual extra visit',
    }),
  ]);

  assert.deepEqual(
    duplicates.map((row) => row.id),
    ['schedule-10'],
  );
});
