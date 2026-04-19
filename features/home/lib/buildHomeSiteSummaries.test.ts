import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionSite } from '@/constants/inspectionSession/sessionFactory';
import type { SiteReportIndexState } from '@/types/inspectionSession';
import { buildHomeSiteSummaries } from './buildHomeSiteSummaries';

function buildLoadedState(
  items: SiteReportIndexState['items'],
): SiteReportIndexState {
  return {
    status: 'loaded',
    items,
    fetchedAt: '2026-04-20T09:00:00.000Z',
    error: null,
  };
}

test('buildHomeSiteSummaries uses loaded report indexes as the authoritative summary source', () => {
  const siteA = createInspectionSite({
    customerName: '고객사 A',
    siteName: '현장 A',
  });
  const siteB = createInspectionSite({
    customerName: '고객사 B',
    siteName: '현장 B',
  });

  const summaries = buildHomeSiteSummaries(
    [siteA, siteB],
    {
      [siteA.id]: buildLoadedState([
        {
          id: 'report-1',
          reportKey: 'report-1',
          reportTitle: '1차 보고서',
          siteId: siteA.id,
          headquarterId: null,
          assignedUserId: null,
          visitDate: '2026-03-25',
          visitRound: 1,
          totalRound: 8,
          progressRate: 100,
          status: 'published',
          dispatchCompleted: true,
          payloadVersion: 1,
          latestRevisionNo: 1,
          submittedAt: null,
          publishedAt: null,
          lastAutosavedAt: '2026-04-19T11:00:00.000Z',
          createdAt: '2026-03-25T00:00:00.000Z',
          updatedAt: '2026-04-19T11:00:00.000Z',
          meta: {},
        },
        {
          id: 'report-2',
          reportKey: 'report-2',
          reportTitle: '2차 보고서',
          siteId: siteA.id,
          headquarterId: null,
          assignedUserId: null,
          visitDate: '2026-04-01',
          visitRound: 2,
          totalRound: 8,
          progressRate: 55,
          status: 'draft',
          dispatchCompleted: false,
          payloadVersion: 1,
          latestRevisionNo: 2,
          submittedAt: null,
          publishedAt: null,
          lastAutosavedAt: '2026-04-20T08:30:00.000Z',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-20T08:00:00.000Z',
          meta: {},
        },
      ]),
      [siteB.id]: buildLoadedState([]),
    },
  );

  assert.equal(summaries.length, 2);
  assert.equal(summaries[0]?.site.id, siteA.id);
  assert.equal(summaries[0]?.reportSyncStatus, 'loaded');
  assert.equal(summaries[0]?.reportCount, 2);
  assert.equal(summaries[0]?.latestReportVisitDate, '2026-04-01');
  assert.equal(summaries[0]?.latestReportProgressRate, 55);
  assert.equal(summaries[0]?.latestReportLastSavedAt, '2026-04-20T08:30:00.000Z');

  assert.equal(summaries[1]?.site.id, siteB.id);
  assert.equal(summaries[1]?.reportSyncStatus, 'loaded');
  assert.equal(summaries[1]?.reportCount, 0);
  assert.equal(summaries[1]?.latestReportVisitDate, null);
  assert.equal(summaries[1]?.latestReportProgressRate, null);
  assert.equal(summaries[1]?.latestReportLastSavedAt, null);
});

test('buildHomeSiteSummaries preserves non-loaded sync state without inventing report data', () => {
  const site = createInspectionSite({
    customerName: '고객사',
    siteName: '현장',
  });

  const summaries = buildHomeSiteSummaries([site], {
    [site.id]: {
      status: 'loading',
      items: [],
      fetchedAt: null,
      error: null,
    },
  });

  assert.equal(summaries[0]?.reportSyncStatus, 'loading');
  assert.equal(summaries[0]?.reportCount, 0);
  assert.equal(summaries[0]?.latestReportVisitDate, null);
  assert.equal(summaries[0]?.latestReportProgressRate, null);
  assert.equal(summaries[0]?.latestReportLastSavedAt, null);
});
