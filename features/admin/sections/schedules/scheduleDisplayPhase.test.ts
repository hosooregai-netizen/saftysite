import assert from 'node:assert/strict';
import test from 'node:test';

import { getScheduleDisplayPhase, getScheduleStatusLabel } from './scheduleDisplayPhase';

test('non-legacy linked report rows stay in progress', () => {
  const row = {
    actualVisitDate: '',
    linkedReportKey: 'report-tech-1',
    status: 'planned' as const,
  };

  assert.equal(getScheduleDisplayPhase(row), 'in_progress');
  assert.equal(getScheduleStatusLabel(row), '기술지도 진행중');
});

test('legacy linked report rows without visit completion stay in progress', () => {
  const row = {
    actualVisitDate: '',
    linkedReportKey: 'legacy:technical_guidance:1001',
    status: 'planned' as const,
  };

  assert.equal(getScheduleDisplayPhase(row), 'in_progress');
  assert.equal(getScheduleStatusLabel(row), '기술지도 진행중');
});

test('actual visit date promotes planned rows to completed', () => {
  const row = {
    actualVisitDate: '2026-04-15',
    linkedReportKey: '',
    status: 'planned' as const,
  };

  assert.equal(getScheduleDisplayPhase(row), 'completed');
  assert.equal(getScheduleStatusLabel(row), '완료');
});
