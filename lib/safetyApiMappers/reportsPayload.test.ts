import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionSession, createInspectionSite } from '@/constants/inspectionSession';
import { buildSafetyReportUpsertInput } from './reports';

test('buildSafetyReportUpsertInput persists session adminSiteSnapshot', () => {
  const site = createInspectionSite({
    siteName: 'Site Alpha',
  });
  const session = createInspectionSession(
    {
      scheduleId: 'schedule-9',
      adminSiteSnapshot: {
        siteName: 'Site Alpha',
        siteManagementNumber: 'MG-009',
        companyName: 'Acme Construction',
        headquartersAddress: '1 Test-ro, Seoul',
      },
      meta: {
        siteName: 'Site Alpha',
        reportDate: '2026-04-19',
        reportTitle: 'Report 9',
        drafter: 'Inspector',
      },
    },
    site.id,
    9,
  );

  const payload = buildSafetyReportUpsertInput(session, site);
  const snapshot = (payload.payload as { adminSiteSnapshot?: Record<string, unknown> })
    .adminSiteSnapshot;

  assert.ok(snapshot);
  assert.equal(snapshot?.siteName, 'Site Alpha');
  assert.equal(snapshot?.siteManagementNumber, 'MG-009');
  assert.equal(snapshot?.companyName, 'Acme Construction');
  assert.equal(snapshot?.headquartersAddress, '1 Test-ro, Seoul');
  assert.equal(payload.schedule_id, 'schedule-9');
});

test('buildSafetyReportUpsertInput omits unknown first-round schedule links', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createInspectionSession(
    {
      scheduleId: 'schedule-stale',
      meta: {
        siteName: 'Site Alpha',
        reportDate: '2026-04-01',
        reportTitle: 'Report 1',
        drafter: 'Inspector',
      },
    },
    site.id,
    1,
  );

  const payload = buildSafetyReportUpsertInput(session, site);

  assert.equal(payload.visit_round, 1);
  assert.equal(payload.schedule_id, null);
});

test('buildSafetyReportUpsertInput keeps schedule links when the schedule round matches', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createInspectionSession(
    {
      scheduleId: 'schedule-1',
      scheduleRoundNo: 1,
      meta: {
        siteName: 'Site Alpha',
        reportDate: '2026-04-01',
        reportTitle: 'Report 1',
        drafter: 'Inspector',
      },
    },
    site.id,
    1,
  );

  const payload = buildSafetyReportUpsertInput(session, site);

  assert.equal(payload.visit_round, 1);
  assert.equal(payload.schedule_id, 'schedule-1');
});

test('buildSafetyReportUpsertInput drops schedule links when the schedule round changed', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createInspectionSession(
    {
      scheduleId: 'schedule-2',
      scheduleRoundNo: 2,
      meta: {
        siteName: 'Site Alpha',
        reportDate: '2026-04-01',
        reportTitle: 'Report 1',
        drafter: 'Inspector',
      },
    },
    site.id,
    1,
  );

  const payload = buildSafetyReportUpsertInput(session, site);

  assert.equal(payload.visit_round, 1);
  assert.equal(payload.schedule_id, null);
});
