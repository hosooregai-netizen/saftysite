import assert from 'node:assert/strict';
import test from 'node:test';

import { clearWorkerScheduleMirrorRowsForTests, getWorkerScheduleMirrorRows } from '@/server/admin/workerScheduleMirror';
import { GET } from './route';

test('GET /api/me/schedules returns worker schedules without waiting for site memo mirroring', async () => {
  const originalFetch = globalThis.fetch;
  const upstreamCalls: string[] = [];
  clearWorkerScheduleMirrorRowsForTests();

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    upstreamCalls.push(`${url.pathname}${url.search}`);

    if (url.pathname.endsWith('/me/schedules')) {
      return new Response(
        JSON.stringify({
          limit: 200,
          month: '2026-05',
          offset: 0,
          rows: [
            {
              id: 'schedule-1',
              planned_date: '2026-05-02',
              round_no: 1,
              site_id: 'site-1',
              site_name: 'Site 1',
              status: 'planned',
              window_end: '2026-05-31',
              window_start: '2026-05-01',
            },
          ],
          total: 1,
        }),
        { status: 200 },
      );
    }

    throw new Error(`unexpected upstream call: ${url.pathname}`);
  };

  try {
    const response = await GET(
      new Request('http://localhost/api/me/schedules?month=2026-05', {
        headers: { Authorization: 'Bearer token-1' },
      }),
    );
    const payload = (await response.json()) as { rows: Array<{ id: string }> };

    assert.equal(response.status, 200);
    assert.deepEqual(payload.rows.map((row) => row.id), ['schedule-1']);
    assert.deepEqual(upstreamCalls, ['/api/v1/me/schedules?include_all=false&limit=200&month=2026-05&offset=0']);
    assert.deepEqual(
      getWorkerScheduleMirrorRows().map((row) => row.id),
      ['schedule-1'],
    );
  } finally {
    clearWorkerScheduleMirrorRowsForTests();
    globalThis.fetch = originalFetch;
  }
});
