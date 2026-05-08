import assert from 'node:assert/strict';
import test from 'node:test';

import type { SafetyInspectionSchedule } from '@/types/admin';
import {
  buildAdminScheduleCalendarSnapshotResponse,
  buildAdminScheduleQueueSnapshotResponse,
  invalidateAdminScheduleSnapshot,
  mergeAdminScheduleSnapshotRows,
} from './scheduleSnapshot';

function schedule(
  input: Partial<SafetyInspectionSchedule> & Pick<SafetyInspectionSchedule, 'id' | 'roundNo'>,
): SafetyInspectionSchedule {
  return {
    actualVisitDate: input.actualVisitDate ?? '',
    assigneeName: input.assigneeName ?? 'Agent',
    assigneeUserId: input.assigneeUserId ?? 'agent-1',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: input.headquarterId ?? 'hq-1',
    headquarterName: input.headquarterName ?? 'HQ',
    id: input.id,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: input.linkedReportKey ?? '',
    plannedDate: input.plannedDate ?? '',
    roundNo: input.roundNo,
    selectionConfirmedAt: input.selectionConfirmedAt ?? '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: input.siteId ?? 'site-1',
    siteName: input.siteName ?? 'Site',
    status: input.status ?? 'planned',
    totalRounds: input.totalRounds ?? 10,
    windowEnd: input.windowEnd ?? '2026-05-31',
    windowStart: input.windowStart ?? '2026-03-22',
  };
}

function installScheduleSnapshot(rows: SafetyInspectionSchedule[] = []) {
  const globalRecord = globalThis as typeof globalThis & {
    __SAFETY_ADMIN_SCHEDULE_SOURCE_SNAPSHOT__?: {
      promise: Promise<unknown> | null;
      snapshot: unknown;
    };
  };
  globalRecord.__SAFETY_ADMIN_SCHEDULE_SOURCE_SNAPSHOT__ = {
    promise: null,
    snapshot: {
      data: {
        sites: [],
        users: [],
      },
      refreshedAt: new Date().toISOString(),
      rows,
    },
  };
}

function backendCalendarResponse(rows: SafetyInspectionSchedule[] = []) {
  return {
    all_selected_total: rows.length,
    available_months: [],
    month: '2026-05',
    month_total: rows.length,
    refreshed_at: new Date().toISOString(),
    rows: rows.map((row) => ({
      actual_visit_date: row.actualVisitDate,
      assignee_name: row.assigneeName,
      assignee_user_id: row.assigneeUserId,
      exception_memo: row.exceptionMemo,
      exception_reason_code: row.exceptionReasonCode,
      headquarter_id: row.headquarterId,
      headquarter_name: row.headquarterName,
      id: row.id,
      is_conflicted: row.isConflicted,
      is_out_of_window: row.isOutOfWindow,
      is_overdue: row.isOverdue,
      linked_report_key: row.linkedReportKey,
      planned_date: row.plannedDate,
      round_no: row.roundNo,
      selection_confirmed_at: row.selectionConfirmedAt,
      selection_confirmed_by_name: row.selectionConfirmedByName,
      selection_confirmed_by_user_id: row.selectionConfirmedByUserId,
      selection_reason_label: row.selectionReasonLabel,
      selection_reason_memo: row.selectionReasonMemo,
      site_id: row.siteId,
      site_name: row.siteName,
      status: row.status,
      total_rounds: row.totalRounds,
      window_end: row.windowEnd,
      window_start: row.windowStart,
    })),
    unselected_total: 0,
  };
}

function backendQueueResponse(rows: SafetyInspectionSchedule[] = [], total = rows.length) {
  return {
    limit: 25,
    month: '2026-05',
    offset: 0,
    refreshed_at: new Date().toISOString(),
    rows: backendCalendarResponse(rows).rows,
    total,
  };
}

test('calendar snapshot response fetches backend calendar rows without backend queue rows', async () => {
  installScheduleSnapshot();
  let calendarCalls = 0;
  let queueCalls = 0;

  const response = await buildAdminScheduleCalendarSnapshotResponse(
    'token-1',
    { month: '2026-05' },
    null,
    new Date('2026-05-08T00:00:00.000Z'),
    {
      calendar: async () => {
        calendarCalls += 1;
        return backendCalendarResponse();
      },
      queue: async () => {
        queueCalls += 1;
        throw new Error('calendar response must not fetch backend queue rows');
      },
    },
  );

  assert.equal(calendarCalls, 1);
  assert.equal(queueCalls, 0);
  assert.equal(response.monthTotal, 0);
  invalidateAdminScheduleSnapshot();
});

test('queue snapshot response fetches backend queue rows without backend calendar rows', async () => {
  installScheduleSnapshot();
  let calendarCalls = 0;
  let queueCalls = 0;
  let observedLimit = 0;
  let observedOffset = -1;

  const response = await buildAdminScheduleQueueSnapshotResponse(
    'token-1',
    {
      limit: 25,
      month: '2026-05',
      offset: 25,
      sortBy: 'windowStart',
      sortDir: 'asc',
    },
    null,
    new Date('2026-05-08T00:00:00.000Z'),
    {
      calendar: async () => {
        calendarCalls += 1;
        throw new Error('queue response must not fetch backend calendar rows');
      },
      queue: async (_token, params) => {
        queueCalls += 1;
        observedLimit = Number(params.limit);
        observedOffset = Number(params.offset);
        return backendQueueResponse([], 72);
      },
    },
  );

  assert.equal(calendarCalls, 0);
  assert.equal(queueCalls, 1);
  assert.equal(observedLimit, 25);
  assert.equal(observedOffset, 25);
  assert.equal(response.limit, 25);
  assert.equal(response.offset, 25);
  assert.equal(response.total, 72);
  invalidateAdminScheduleSnapshot();
});

test('admin schedule snapshot merge includes backend worker-entered selected rows', () => {
  const rows = mergeAdminScheduleSnapshotRows({
    backendRows: [
      schedule({
        id: 'schedule:site-1:2',
        plannedDate: '2026-04-10',
        roundNo: 2,
        selectionConfirmedAt: '2026-05-04T09:00:00.000Z',
      }),
    ],
    memoRows: [
      schedule({
        id: 'schedule:site-1:2',
        plannedDate: '',
        roundNo: 2,
      }),
    ],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.plannedDate, '2026-04-10');
});

test('admin schedule snapshot merge keeps newer memo-backed admin repairs over stale backend rows', () => {
  const rows = mergeAdminScheduleSnapshotRows({
    backendRows: [
      schedule({
        id: 'schedule:site-1:2',
        plannedDate: '2026-04-10',
        roundNo: 2,
        selectionConfirmedAt: '2026-05-04T09:00:00.000Z',
      }),
    ],
    memoRows: [
      schedule({
        id: 'schedule:site-1:2',
        plannedDate: '2026-04-12',
        roundNo: 2,
        selectionConfirmedAt: '2026-05-04T10:00:00.000Z',
      }),
    ],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.plannedDate, '2026-04-12');
});

test('admin schedule snapshot merge preserves backend-only rows', () => {
  const rows = mergeAdminScheduleSnapshotRows({
    backendRows: [
      schedule({
        id: 'backend-only',
        plannedDate: '2026-04-24',
        roundNo: 5,
        siteId: 'site-2',
      }),
    ],
    memoRows: [],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, 'backend-only');
  assert.equal(rows[0]?.plannedDate, '2026-04-24');
});

test('admin schedule snapshot merge matches backend rows by site and round when ids differ', () => {
  const rows = mergeAdminScheduleSnapshotRows({
    backendRows: [
      schedule({
        id: 'backend-schedule-uuid',
        plannedDate: '2026-04-29',
        roundNo: 6,
        selectionConfirmedAt: '2026-05-04T09:00:00.000Z',
        siteId: 'site-2',
      }),
    ],
    memoRows: [
      schedule({
        id: 'schedule:site-2:6',
        plannedDate: '',
        roundNo: 6,
        siteId: 'site-2',
      }),
    ],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, 'backend-schedule-uuid');
  assert.equal(rows[0]?.plannedDate, '2026-04-29');
  assert.equal(rows[0]?.siteName, 'Site');
});
