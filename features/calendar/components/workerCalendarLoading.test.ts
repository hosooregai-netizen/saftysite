import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkerCalendarReportIndexSiteIds } from './workerCalendarLoading';

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
