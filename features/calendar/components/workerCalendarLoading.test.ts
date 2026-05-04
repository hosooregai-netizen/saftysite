import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildWorkerCalendarReportIndexSiteIds,
  shouldUseWorkerCalendarReportItems,
} from './workerCalendarLoading';

test('worker calendar report index loading targets the selected site only', () => {
  const siteIds = buildWorkerCalendarReportIndexSiteIds({
    rows: [{ siteId: 'site-1' }, { siteId: 'site-2' }],
    selectedSiteId: 'site-2',
    sites: [{ id: 'site-1' }, { id: 'site-2' }],
  });

  assert.deepEqual(siteIds, ['site-2']);
});

test('worker calendar report index loading uses current schedule sites for all-site view', () => {
  const siteIds = buildWorkerCalendarReportIndexSiteIds({
    rows: [{ siteId: 'site-2' }, { siteId: 'site-1' }, { siteId: 'site-2' }, { siteId: 'unknown' }],
    sites: [{ id: 'site-1' }, { id: 'site-2' }, { id: 'site-3' }],
  });

  assert.deepEqual(siteIds, ['site-2', 'site-1']);
});

test('worker calendar hides cached report items until the current load marks the site ready', () => {
  assert.equal(
    shouldUseWorkerCalendarReportItems({
      readySiteIds: new Set(),
      siteId: 'site-1',
      status: 'loaded',
    }),
    false,
  );
  assert.equal(
    shouldUseWorkerCalendarReportItems({
      readySiteIds: new Set(['site-1']),
      siteId: 'site-1',
      status: 'loaded',
    }),
    true,
  );
  assert.equal(
    shouldUseWorkerCalendarReportItems({
      fetchedAt: '2026-05-01T00:00:00.000Z',
      loadedAfterMs: new Date('2026-05-01T00:00:01.000Z').getTime(),
      readySiteIds: new Set(['site-1']),
      siteId: 'site-1',
      status: 'loaded',
    }),
    false,
  );
  assert.equal(
    shouldUseWorkerCalendarReportItems({
      fetchedAt: '2026-05-01T00:00:02.000Z',
      loadedAfterMs: new Date('2026-05-01T00:00:01.000Z').getTime(),
      readySiteIds: new Set(['site-1']),
      siteId: 'site-1',
      status: 'loaded',
    }),
    true,
  );
  assert.equal(
    shouldUseWorkerCalendarReportItems({
      fetchedAt: '2026-05-01T00:00:02.000Z',
      loadedAfterMs: new Date('2026-05-01T00:00:01.000Z').getTime(),
      readySiteIds: new Set(['site-1']),
      siteId: 'site-1',
      status: 'error',
    }),
    false,
  );
});
