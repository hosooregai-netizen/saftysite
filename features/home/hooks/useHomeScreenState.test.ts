import assert from 'node:assert/strict';
import test from 'node:test';

import type { HomeSiteSummary } from '@/features/home/lib/buildHomeSiteSummaries';
import { getPendingHomeReportIndexSiteIds, resolveHomePostAuthRedirect } from './useHomeScreenState';

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

test('resolveHomePostAuthRedirect keeps authenticated workers on the site list after direct navigation', () => {
  assert.equal(
    resolveHomePostAuthRedirect({
      isControllerView: false,
      pendingRedirect: null,
    }),
    null,
  );
});

test('resolveHomePostAuthRedirect still honors the one-time worker login redirect', () => {
  assert.equal(
    resolveHomePostAuthRedirect({
      isControllerView: false,
      pendingRedirect: '/calendar',
    }),
    '/calendar',
  );
});

test('resolveHomePostAuthRedirect sends admins from the shared root to overview', () => {
  assert.equal(
    resolveHomePostAuthRedirect({
      isControllerView: true,
      pendingRedirect: null,
    }),
    '/admin?section=overview',
  );
});
