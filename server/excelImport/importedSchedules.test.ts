import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSiteMemoWithContractProfile } from '@/lib/admin/siteContractProfile';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import { mergeImportedSchedules } from './importedSchedules';

function buildCompletedSchedule(): SafetyInspectionSchedule {
  return {
    actualVisitDate: '2026-04-19',
    assigneeName: 'Agent',
    assigneeUserId: 'user-1',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: 'hq-1',
    headquarterName: 'HQ',
    id: 'schedule:site-1:1',
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: 'report-1',
    plannedDate: '2026-04-19',
    roundNo: 1,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: 'site-1',
    siteName: 'Site 1',
    status: 'completed',
    windowEnd: '2026-04-19',
    windowStart: '2026-04-19',
  };
}

function buildSite(schedule: SafetyInspectionSchedule): SafetySite {
  return {
    created_at: '2026-04-01T00:00:00+00:00',
    headquarter: null,
    headquarter_detail: null,
    headquarter_id: 'hq-1',
    id: 'site-1',
    memo: buildSiteMemoWithContractProfile('', null, { schedules: [schedule] }),
    site_name: 'Site 1',
    status: 'active',
    updated_at: '2026-04-01T00:00:00+00:00',
  } as SafetySite;
}

test('mergeImportedSchedules does not reopen completed schedules', () => {
  const rows = mergeImportedSchedules(
    buildSite(buildCompletedSchedule()),
    [
      {
        assigneeName: '',
        assigneeUserId: '',
        completionStatus: 'planned',
        roundNo: 1,
        visitDate: '2026-05-10',
      },
    ],
    new Date('2026-04-30T00:00:00+09:00'),
  );

  assert.equal(rows[0]?.status, 'completed');
  assert.equal(rows[0]?.actualVisitDate, '2026-04-19');
});
