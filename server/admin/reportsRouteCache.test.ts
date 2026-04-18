import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidateAdminReportsRouteCache,
  readOrCreateAdminReportsRouteResponse,
} from './reportsRouteCache';
import type { SafetyAdminReportsResponse } from '@/types/admin';

function buildRequest() {
  return new Request('https://example.com/api/admin/reports?limit=100&offset=0', {
    headers: {
      authorization: 'Bearer reports-token',
    },
  });
}

function buildReportsPayload(): SafetyAdminReportsResponse {
  return {
    limit: 100,
    offset: 0,
    rows: [],
    total: 0,
  };
}

test('dedupes concurrent reports route requests and reuses cached payloads', async () => {
  invalidateAdminReportsRouteCache();
  let callCount = 0;
  const request = buildRequest();

  const loader = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return buildReportsPayload();
  };

  const [first, second] = await Promise.all([
    readOrCreateAdminReportsRouteResponse(request, loader),
    readOrCreateAdminReportsRouteResponse(request, loader),
  ]);
  const third = await readOrCreateAdminReportsRouteResponse(request, loader);

  assert.equal(callCount, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test('forces fresh reports route load after explicit invalidation', async () => {
  invalidateAdminReportsRouteCache();
  let callCount = 0;
  const request = buildRequest();

  const loader = async () => {
    callCount += 1;
    return buildReportsPayload();
  };

  await readOrCreateAdminReportsRouteResponse(request, loader);
  invalidateAdminReportsRouteCache();
  await readOrCreateAdminReportsRouteResponse(request, loader);

  assert.equal(callCount, 2);
});
