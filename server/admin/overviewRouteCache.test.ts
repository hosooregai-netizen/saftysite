import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidateAdminOverviewRouteCache,
  readOrCreateAdminOverviewRouteResponse,
} from './overviewRouteCache';
import type { SafetyAdminOverviewResponse } from '@/types/admin';

function buildRequest() {
  return new Request('https://example.com/api/admin/dashboard/overview', {
    headers: {
      authorization: 'Bearer overview-token',
    },
  });
}

function buildOverviewPayload(): SafetyAdminOverviewResponse {
  return {
    alerts: [],
    completionRows: [],
    coverageRows: [],
    deadlineSignalSummary: { entries: [], totalReportCount: 0 },
    dispatchQueueRows: [],
    deadlineRows: [],
    endingSoonRows: [],
    endingSoonSummary: { entries: [], totalSiteCount: 0 },
    metricCards: [],
    overdueSiteRows: [],
    pendingReviewRows: [],
    priorityQuarterlyManagementRows: [],
    priorityTargetSiteRows: [],
    quarterlyMaterialSummary: {
      entries: [],
      missingSiteRows: [],
      quarterKey: '',
      quarterLabel: '',
      totalSiteCount: 0,
    },
    recipientMissingSiteRows: [],
    scheduleRows: [],
    siteStatusSummary: { entries: [], totalSiteCount: 0 },
    summaryRows: [],
    unsentReportRows: [],
    workerLoadRows: [],
  };
}

test('dedupes concurrent overview route requests by authorization key', async () => {
  invalidateAdminOverviewRouteCache();
  let callCount = 0;
  const request = buildRequest();

  const loader = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return buildOverviewPayload();
  };

  const [first, second] = await Promise.all([
    readOrCreateAdminOverviewRouteResponse(request, loader),
    readOrCreateAdminOverviewRouteResponse(request, loader),
  ]);

  assert.equal(callCount, 1);
  assert.deepEqual(first, second);
});
