import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeInspectionSession } from './normalizeSession';
import {
  isMeaningfulSnapshotText,
  mergeAdminSiteSnapshots,
  normalizeAdminSiteSnapshot,
  normalizeInspectionSite,
} from './normalizeSite';

test('isMeaningfulSnapshotText treats placeholder dashes as empty', () => {
  assert.equal(isMeaningfulSnapshotText('-'), false);
  assert.equal(isMeaningfulSnapshotText('\u2013'), false);
  assert.equal(isMeaningfulSnapshotText('\u2014'), false);
  assert.equal(isMeaningfulSnapshotText('  '), false);
  assert.equal(isMeaningfulSnapshotText('Site Alpha'), true);
});

test('normalizeAdminSiteSnapshot supports snake_case fields', () => {
  const snapshot = normalizeAdminSiteSnapshot({
    site_name: 'Site Alpha',
    management_number: 'MG-001',
    company_name: 'Acme Construction',
    contact_phone: '02-1111-2222',
    address: '1 Test-ro, Seoul',
  });

  assert.equal(snapshot.siteName, 'Site Alpha');
  assert.equal(snapshot.siteManagementNumber, 'MG-001');
  assert.equal(snapshot.companyName, 'Acme Construction');
  assert.equal(snapshot.headquartersContact, '02-1111-2222');
  assert.equal(snapshot.headquartersAddress, '1 Test-ro, Seoul');
});

test('mergeAdminSiteSnapshots backfills placeholder values from fallback', () => {
  const snapshot = mergeAdminSiteSnapshots(
    {
      siteName: 'Site Alpha',
      companyName: '-',
      constructionAmount: '\u2014',
      headquartersAddress: ' ',
    },
    {
      companyName: 'Acme Construction',
      constructionAmount: '1000000',
      headquartersAddress: '1 Test-ro, Seoul',
    },
  );

  assert.equal(snapshot.siteName, 'Site Alpha');
  assert.equal(snapshot.companyName, 'Acme Construction');
  assert.equal(snapshot.constructionAmount, '1000000');
  assert.equal(snapshot.headquartersAddress, '1 Test-ro, Seoul');
});

test('normalizeInspectionSession clears placeholder values in adminSiteSnapshot', () => {
  const session = normalizeInspectionSession({
    meta: {
      siteName: 'Site Alpha',
      reportDate: '2026-04-19',
      reportTitle: 'Report 9',
      drafter: 'Inspector',
    },
    adminSiteSnapshot: {
      siteName: 'Site Alpha',
      companyName: '-',
      headquartersAddress: '\u2014',
      siteManagementNumber: 'MG-009',
    },
    reportNumber: 9,
  });

  assert.equal(session.adminSiteSnapshot.siteName, 'Site Alpha');
  assert.equal(session.adminSiteSnapshot.siteManagementNumber, 'MG-009');
  assert.equal(session.adminSiteSnapshot.companyName, '');
  assert.equal(session.adminSiteSnapshot.headquartersAddress, '');
});

test('normalizeInspectionSite preserves totalRounds from camelCase and snake_case inputs', () => {
  const camelCaseSite = normalizeInspectionSite({
    id: 'site-1',
    siteName: 'Site Alpha',
    totalRounds: 8,
  });
  const snakeCaseSite = normalizeInspectionSite({
    id: 'site-2',
    site_name: 'Site Beta',
    total_rounds: 12,
  });

  assert.equal(camelCaseSite.totalRounds, 8);
  assert.equal(snakeCaseSite.totalRounds, 12);
});
