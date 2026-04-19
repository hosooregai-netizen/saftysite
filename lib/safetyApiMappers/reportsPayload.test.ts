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
});
