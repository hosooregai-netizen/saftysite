import assert from 'node:assert/strict';
import test from 'node:test';

import type { InspectionReportListItem } from '@/types/inspectionSession';
import { mergeReportIndexItems } from './helpers';

function buildItem(
  overrides: Partial<InspectionReportListItem> = {},
): InspectionReportListItem {
  return {
    id: 'report-1',
    reportKey: 'report-1',
    reportTitle: 'Remote title',
    reportOpenHref: null,
    reportOpenMode: 'session',
    readOnly: false,
    originalPdfAvailable: false,
    siteId: 'site-1',
    headquarterId: null,
    scheduleId: null,
    assignedUserId: null,
    visitDate: '2026-04-01',
    visitRound: 1,
    totalRound: 10,
    progressRate: 100,
    status: 'draft',
    dispatchCompleted: false,
    dispatchStatus: null,
    reportIndexSource: 'remote',
    payloadVersion: 1,
    latestRevisionNo: 0,
    submittedAt: null,
    publishedAt: null,
    lastAutosavedAt: '2026-04-01T00:00:00.000Z',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    meta: {},
    ...overrides,
  };
}

test('mergeReportIndexItems keeps remote manual dispatch over stale local pending state', () => {
  const [merged] = mergeReportIndexItems(
    [
      buildItem({
        dispatchCompleted: true,
        dispatchStatus: 'manual_checked',
        progressRate: 100,
        reportIndexSource: 'remote',
        reportTitle: 'Remote title',
      }),
    ],
    [
      buildItem({
        dispatchCompleted: false,
        dispatchStatus: null,
        progressRate: 20,
        reportIndexSource: 'local',
        reportTitle: 'Local draft title',
        updatedAt: '2026-04-02T00:00:00.000Z',
      }),
    ],
  );

  assert.equal(merged.reportTitle, 'Local draft title');
  assert.equal(merged.progressRate, 20);
  assert.equal(merged.dispatchCompleted, true);
  assert.equal(merged.dispatchStatus, 'manual_checked');
});

test('mergeReportIndexItems lets explicit remote none clear completed dispatch', () => {
  const [merged] = mergeReportIndexItems(
    [
      buildItem({
        dispatchCompleted: true,
        dispatchStatus: null,
        reportIndexSource: undefined,
      }),
    ],
    [
      buildItem({
        dispatchCompleted: false,
        dispatchStatus: 'none',
        reportIndexSource: 'remote',
      }),
    ],
  );

  assert.equal(merged.dispatchCompleted, false);
  assert.equal(merged.dispatchStatus, 'none');
});

test('mergeReportIndexItems preserves old completed cache against stale local items', () => {
  const [merged] = mergeReportIndexItems(
    [
      buildItem({
        dispatchCompleted: true,
        dispatchStatus: null,
        reportIndexSource: undefined,
      }),
    ],
    [
      buildItem({
        dispatchCompleted: false,
        dispatchStatus: null,
        reportIndexSource: 'local',
      }),
    ],
  );

  assert.equal(merged.dispatchCompleted, true);
  assert.equal(merged.dispatchStatus, null);
});

test('mergeReportIndexItems does not let legacy read-only rows replace regular rows', () => {
  const [merged] = mergeReportIndexItems(
    [
      buildItem({
        dispatchCompleted: false,
        dispatchStatus: 'none',
        reportIndexSource: 'remote',
        reportTitle: 'Regular row',
      }),
    ],
    [
      buildItem({
        dispatchCompleted: true,
        dispatchStatus: 'manual_checked',
        readOnly: true,
        reportIndexSource: 'legacy',
        reportOpenMode: 'original_pdf',
        reportTitle: 'Legacy row',
      }),
    ],
  );

  assert.equal(merged.reportTitle, 'Regular row');
  assert.equal(merged.dispatchCompleted, false);
  assert.equal(merged.dispatchStatus, 'none');
});

test('mergeReportIndexItems hides PDF-less legacy placeholder after generated report exists', () => {
  const legacyKey = 'legacy:technical_guidance:1001';
  const merged = mergeReportIndexItems(
    [
      buildItem({
        id: 'report-generated',
        meta: { sourceLegacyReportKey: legacyKey },
        reportIndexSource: 'remote',
        reportKey: 'report-generated',
        reportTitle: 'Generated report',
        visitDate: '2026-04-15',
        visitRound: 5,
      }),
    ],
    [
      buildItem({
        id: legacyKey,
        originalPdfAvailable: false,
        readOnly: true,
        reportIndexSource: 'legacy',
        reportKey: legacyKey,
        reportOpenHref: null,
        reportOpenMode: 'legacy_create',
        reportTitle: 'Legacy placeholder',
        visitDate: '2026-04-15',
        visitRound: 5,
      }),
    ],
  );

  assert.deepEqual(
    merged.map((item) => item.reportKey),
    ['report-generated'],
  );
});

test('mergeReportIndexItems keeps PDF-backed legacy rows even when a generated report exists', () => {
  const legacyKey = 'legacy:technical_guidance:1001';
  const merged = mergeReportIndexItems(
    [
      buildItem({
        id: 'report-generated',
        meta: { sourceLegacyReportKey: legacyKey },
        reportIndexSource: 'remote',
        reportKey: 'report-generated',
        reportTitle: 'Generated report',
        visitDate: '2026-04-15',
        visitRound: 5,
      }),
    ],
    [
      buildItem({
        id: legacyKey,
        originalPdfAvailable: true,
        readOnly: true,
        reportIndexSource: 'legacy',
        reportKey: legacyKey,
        reportOpenHref: `/admin/report-open?reportKey=${encodeURIComponent(legacyKey)}`,
        reportOpenMode: 'original_pdf',
        reportTitle: 'Legacy PDF',
        visitDate: '2026-04-15',
        visitRound: 5,
      }),
    ],
  );

  assert.equal(merged.length, 2);
  assert.equal(merged.some((item) => item.reportKey === legacyKey), true);
  assert.equal(merged.some((item) => item.reportKey === 'report-generated'), true);
});
