import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFetchMySchedulesPath, buildUpdateMyScheduleBody } from './apiClient';

test('buildUpdateMyScheduleBody omits undefined fields for partial schedule updates', () => {
  assert.deepEqual(buildUpdateMyScheduleBody({ plannedDate: '2026-04-09' }), {
    planned_date: '2026-04-09',
  });
});

test('buildUpdateMyScheduleBody preserves explicit empty strings for clearing fields', () => {
  assert.deepEqual(
    buildUpdateMyScheduleBody({
      actualVisitDate: '',
      linkedReportKey: '',
      selectionReasonLabel: '',
    }),
    {
      actual_visit_date: '',
      linked_report_key: '',
      selection_reason_label: '',
    },
  );
});

test('buildFetchMySchedulesPath includes include_all for full-site sync loads', () => {
  assert.equal(
    buildFetchMySchedulesPath({
      includeAll: true,
      limit: 300,
      siteId: 'site-1',
    }),
    '/schedules?include_all=true&limit=300&siteId=site-1',
  );
});
