import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidateAdminReportsRouteCache,
  readOrCreateAdminReportsRowsSnapshot,
  readOrCreateAdminReportsRouteResponse,
} from './reportsRouteCache';
import type { ControllerReportRow, SafetyAdminReportsResponse } from '@/types/admin';

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

function buildRowsSnapshot(): ControllerReportRow[] {
  return [];
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

test('reuses the base rows snapshot cache across different pagination requests', async () => {
  invalidateAdminReportsRouteCache();
  let callCount = 0;
  const firstRequest = buildRequest();
  const secondRequest = new Request('https://example.com/api/admin/reports?limit=20&offset=20', {
    headers: {
      authorization: 'Bearer reports-token',
    },
  });

  const loader = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return buildRowsSnapshot();
  };

  const [first, second] = await Promise.all([
    readOrCreateAdminReportsRowsSnapshot(firstRequest, loader),
    readOrCreateAdminReportsRowsSnapshot(secondRequest, loader),
  ]);
  const third = await readOrCreateAdminReportsRowsSnapshot(secondRequest, loader);

  assert.equal(callCount, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});
