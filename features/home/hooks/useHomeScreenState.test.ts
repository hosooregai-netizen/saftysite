import assert from 'node:assert/strict';
import test from 'node:test';

import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import { getPendingHomeReportIndexSiteIds } from './useHomeScreenState';

test('getPendingHomeReportIndexSiteIds queues every assigned site that has not been prefetched yet', () => {
  const siteSummaries = [
    { site: { id: 'site-1' } },
    { site: { id: 'site-2' } },
    { site: { id: 'site-3' } },
  ] as Array<Pick<HomeSiteSummary, 'site'>>;

  assert.deepEqual(
    getPendingHomeReportIndexSiteIds(siteSummaries as HomeSiteSummary[], new Set(['site-2'])),
    ['site-1', 'site-3'],
  );
});
