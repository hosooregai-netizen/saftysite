import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createActivityRecord,
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession';
import type { SafetyMasterData, SafetyReport, SafetyReportListItem } from '@/types/backend';
import {
  buildPreviousRoundAccidentOverviewSeed,
  buildSafetyReportUpsertInput,
  createNewSafetySession,
  mapSafetyReportToInspectionSession,
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

function buildSafetyReport(
  overrides: Partial<SafetyReport> & Record<string, unknown> = {},
): SafetyReport {
  return {
    id: 'report-1',
    report_key: 'report-1',
    report_title: 'Report 1',
    site_id: 'site-1',
    headquarter_id: null,
    schedule_id: null,
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
    payload: {},
    ...overrides,
  } as SafetyReport;
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

test('buildSafetyReportUpsertInput persists document 12 activity title image and content', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createInspectionSession({}, site.id, 1);
  session.document12Activities = [
    createActivityRecord({
      activityTitle: '정기 안전교육',
      photoUrl: 'https://example.test/activity-1.jpg',
      content: '작업 전 안전교육을 실시함',
    }),
  ];

  const payload = buildSafetyReportUpsertInput(session, site);
  const activities = (payload.payload as { document12Activities?: Array<Record<string, unknown>> })
    .document12Activities;

  assert.ok(activities);
  assert.equal(activities?.[0]?.activityTitle, '정기 안전교육');
  assert.equal(activities?.[0]?.photoUrl, 'https://example.test/activity-1.jpg');
  assert.equal(activities?.[0]?.content, '작업 전 안전교육을 실시함');
  assert.equal(activities?.[0]?.activityType, '');
});

test('buildSafetyReportUpsertInput splits legacy document 12 second photo slot', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = createInspectionSession({}, site.id, 1);
  session.document12Activities = [
    createActivityRecord({
      photoUrl: 'https://example.test/activity-1.jpg',
      photoUrl2: 'https://example.test/activity-2.jpg',
      activityType: '활동 1 내용',
      content: '활동 2 내용',
    }),
  ];

  const payload = buildSafetyReportUpsertInput(session, site);
  const activities = (payload.payload as { document12Activities?: Array<Record<string, unknown>> })
    .document12Activities;

  assert.ok(activities);
  assert.equal(activities?.[0]?.activityTitle, '');
  assert.equal(activities?.[0]?.photoUrl, 'https://example.test/activity-1.jpg');
  assert.equal(activities?.[0]?.content, '활동 1 내용');
  assert.equal(activities?.[1]?.activityTitle, '');
  assert.equal(activities?.[1]?.photoUrl, 'https://example.test/activity-2.jpg');
  assert.equal(activities?.[1]?.content, '활동 2 내용');
});

test('mapSafetyReportToInspectionSession preserves legacy document 12 content without using it as title', () => {
  const site = createInspectionSite({ siteName: 'Site Alpha' });
  const session = mapSafetyReportToInspectionSession(
    buildSafetyReport({
      payload: {
        document12Activities: [
          {
            id: 'legacy-activity',
            photoUrl: 'https://example.test/activity-1.jpg',
            photoUrl2: 'https://example.test/activity-2.jpg',
            activityType: '활동 1 내용',
            content: '활동 2 내용',
          },
        ],
      },
      site_id: site.id,
    }),
    site,
    buildEmptyMasterData(),
  );

  assert.equal(session.document12Activities[0]?.activityTitle, '');
  assert.equal(session.document12Activities[0]?.content, '활동 1 내용');
  assert.equal(session.document12Activities[0]?.photoUrl, 'https://example.test/activity-1.jpg');
  assert.equal(session.document12Activities[1]?.activityTitle, '');
  assert.equal(session.document12Activities[1]?.content, '활동 2 내용');
  assert.equal(session.document12Activities[1]?.photoUrl, 'https://example.test/activity-2.jpg');
});

test('buildPreviousRoundAccidentOverviewSeed maps yes seed into doc2 accident fields', () => {
  const overview = buildPreviousRoundAccidentOverviewSeed({
    previous_round_accident: {
      source_report_key: 'round-10',
      source_visit_round: 10,
      accident_occurred: 'yes',
      recent_accident_date: '2026-05-14',
      accident_type: 'fall',
      accident_summary: '직전회차 사고 요약',
      accident_photo_url: 'https://example.test/accident.jpg',
      accident_photo_url_2: 'https://example.test/status.jpg',
      accident_occurrence_part: 'roof edge',
      accident_implementation_status: 'in progress',
    },
  });

  assert.deepEqual(overview, {
    accidentOccurred: 'yes',
    recentAccidentDate: '2026-05-14',
    accidentType: 'fall',
    accidentSummary: '직전회차 사고 요약',
    accidentPhotoUrl: 'https://example.test/accident.jpg',
    accidentPhotoUrl2: 'https://example.test/status.jpg',
    accidentOccurrencePart: 'roof edge',
    accidentImplementationStatus: 'in progress',
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
        recent_accident_date: '2026-05-14',
        accident_type: 'fall',
        accident_summary: '직전회차 사고 요약',
        accident_photo_url: '',
        accident_photo_url_2: 'https://example.test/status.jpg',
        accident_occurrence_part: 'roof edge',
        accident_implementation_status: 'in progress',
      },
    }),
  });

  assert.equal(session.document2Overview.accidentOccurred, 'yes');
  assert.equal(session.document2Overview.recentAccidentDate, '2026-05-14');
  assert.equal(session.document2Overview.accidentType, 'fall');
  assert.equal(session.document2Overview.accidentSummary, '직전회차 사고 요약');
  assert.equal(session.document2Overview.accidentPhotoUrl, '');
  assert.equal(session.document2Overview.accidentPhotoUrl2, 'https://example.test/status.jpg');
  assert.equal(session.document2Overview.accidentOccurrencePart, 'roof edge');
  assert.equal(session.document2Overview.accidentImplementationStatus, 'in progress');
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
