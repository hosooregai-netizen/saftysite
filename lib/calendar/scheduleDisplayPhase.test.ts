import assert from 'node:assert/strict';
import test from 'node:test';

import { getScheduleDisplayPhase, getScheduleStatusLabel } from './scheduleDisplayPhase';

function row(input: {
  actualVisitDate?: string;
  linkedReportKey?: string;
  status?: 'planned' | 'completed' | 'postponed' | 'canceled';
}) {
  return {
    actualVisitDate: input.actualVisitDate ?? '',
    linkedReportKey: input.linkedReportKey ?? '',
    status: input.status ?? 'planned',
  };
}

test('linked report rows without visit completion stay in progress', () => {
  const schedule = row({ linkedReportKey: 'report-tech-1' });

  assert.equal(getScheduleDisplayPhase(schedule), 'in_progress');
  assert.equal(getScheduleStatusLabel(schedule), '기술지도 진행중');
});

test('legacy linked report rows without visit completion stay in progress', () => {
  const schedule = row({ linkedReportKey: 'legacy:technical_guidance:1001' });

  assert.equal(getScheduleDisplayPhase(schedule), 'in_progress');
  assert.equal(getScheduleStatusLabel(schedule), '기술지도 진행중');
});

test('actual visit date promotes planned rows to completed', () => {
  const schedule = row({ actualVisitDate: '2026-04-15' });

  assert.equal(getScheduleDisplayPhase(schedule), 'completed');
  assert.equal(getScheduleStatusLabel(schedule), '완료');
});

test('explicit schedule statuses keep their phase labels', () => {
  assert.equal(getScheduleDisplayPhase(row({ status: 'planned' })), 'planned');
  assert.equal(getScheduleStatusLabel(row({ status: 'planned' })), '예정');
  assert.equal(getScheduleDisplayPhase(row({ status: 'postponed' })), 'postponed');
  assert.equal(getScheduleStatusLabel(row({ status: 'postponed' })), '연기');
  assert.equal(getScheduleDisplayPhase(row({ status: 'canceled' })), 'canceled');
  assert.equal(getScheduleStatusLabel(row({ status: 'canceled' })), '취소');
});
