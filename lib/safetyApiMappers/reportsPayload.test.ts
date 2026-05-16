import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionSession, createInspectionSite } from '@/constants/inspectionSession';
import type { SafetyMasterData, SafetyReportListItem } from '@/types/backend';
import {
  buildPreviousRoundAccidentOverviewSeed,
  buildSafetyReportUpsertInput,
  createNewSafetySession,
  mapSafetyReportListItem,
} from './reports';

function buildEmptyMasterData(): SafetyMasterData {
  return {
    caseFeed: [],
    safetyInfos: [],
    legalReferences: [],
    correctionResultOptions: [],
    measurementTemplates: [],
    doc7ReferenceMaterials: [],
    hazardCountermeasureCatalog: [],
  };
}

function buildReportListItem(
  overrides: Partial<SafetyReportListItem> & Record<string, unknown> = {},
): SafetyReportListItem {
  return {
    id: 'report-1',
    report_key: 'report-1',
    report_title: 'Report 1',
    site_id: 'site-1',
    headquarter_id: null,
    assigned_user_id: null,
    visit_date: '2026-04-01',
    visit_round: 1,
    total_round: 10,
    progress_rate: 20,
    status: 'draft',
    payload_version: 1,
    latest_revision_no: 0,
    submitted_at: null,
    published_at: null,
    last_autosaved_at: null,
    dispatch_completed: false,
    meta: {},
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  } as SafetyReportListItem;
}

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

test('buildPreviousRoundAccidentOverviewSeed maps yes seed into doc2 accident fields', () => {
  const overview = buildPreviousRoundAccidentOverviewSeed({
    previous_round_accident: {
      source_report_key: 'round-10',
      source_visit_round: 10,
      accident_occurred: 'yes',
      accident_summary: '직전회차 사고 요약',
      accident_photo_url: 'https://example.test/accident.jpg',
    },
  });

  assert.deepEqual(overview, {
    accidentOccurred: 'yes',
    accidentSummary: '직전회차 사고 요약',
    accidentPhotoUrl: 'https://example.test/accident.jpg',
  });
});

test('createNewSafetySession applies previous-round accident overview only as initial doc2 values', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createNewSafetySession(site, 11, buildEmptyMasterData(), {
    document2Overview: buildPreviousRoundAccidentOverviewSeed({
      previous_round_accident: {
        source_report_key: 'round-10',
        source_visit_round: 10,
        accident_occurred: 'yes',
        accident_summary: '직전회차 사고 요약',
        accident_photo_url: '',
      },
    }),
  });

  assert.equal(session.document2Overview.accidentOccurred, 'yes');
  assert.equal(session.document2Overview.accidentSummary, '직전회차 사고 요약');
  assert.equal(session.document2Overview.accidentPhotoUrl, '');
});

test('createNewSafetySession keeps default no when previous-round accident seed is null', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createNewSafetySession(site, 11, buildEmptyMasterData(), {
    document2Overview: buildPreviousRoundAccidentOverviewSeed({
      previous_round_accident: null,
    }),
  });

  assert.equal(session.document2Overview.accidentOccurred, 'no');
  assert.equal(session.document2Overview.accidentSummary, '');
  assert.equal(session.document2Overview.accidentPhotoUrl, '');
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

test('mapSafetyReportListItem treats snake_case manual dispatch as completed', () => {
  const item = mapSafetyReportListItem(
    buildReportListItem({
      dispatch_completed: undefined,
      dispatch: { dispatch_status: 'manual_checked' } as unknown as SafetyReportListItem['dispatch'],
    }),
  );

  assert.equal(item.dispatchCompleted, true);
  assert.equal(item.dispatchStatus, 'manual_checked');
});

test('mapSafetyReportListItem treats camelCase sent dispatch as completed', () => {
  const item = mapSafetyReportListItem(
    buildReportListItem({
      dispatch_completed: undefined,
      dispatch: { dispatchStatus: 'sent' } as unknown as SafetyReportListItem['dispatch'],
    }),
  );

  assert.equal(item.dispatchCompleted, true);
  assert.equal(item.dispatchStatus, 'sent');
});

test('mapSafetyReportListItem treats explicit none dispatch as pending', () => {
  const item = mapSafetyReportListItem(
    buildReportListItem({
      dispatch_completed: true,
      dispatch: { dispatch_status: 'none' } as unknown as SafetyReportListItem['dispatch'],
    }),
  );

  assert.equal(item.dispatchCompleted, false);
  assert.equal(item.dispatchStatus, 'none');
});

test('mapSafetyReportListItem falls back to dispatch_completed when no status exists', () => {
  const item = mapSafetyReportListItem(
    buildReportListItem({
      dispatch_completed: true,
      dispatch: {} as unknown as SafetyReportListItem['dispatch'],
    }),
  );

  assert.equal(item.dispatchCompleted, true);
  assert.equal(item.dispatchStatus, null);
});
