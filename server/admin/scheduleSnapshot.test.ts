import assert from 'node:assert/strict';
import test from 'node:test';

import type { SafetyInspectionSchedule } from '@/types/admin';
import { mergeAdminScheduleSnapshotRows } from './scheduleSnapshot';

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
