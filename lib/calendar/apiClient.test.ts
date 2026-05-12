import assert from 'node:assert/strict';
import test from 'node:test';

import { SAFETY_AUTH_TOKEN_KEY } from '@/lib/safetyApi/config';
import { buildFetchMySchedulesPath, buildUpdateMyScheduleBody, fetchAllMySchedules, fetchMySchedules } from './apiClient';

test('buildUpdateMyScheduleBody omits undefined fields for partial schedule updates', () => {
  assert.deepEqual(buildUpdateMyScheduleBody({ plannedDate: '2026-04-09' }), {
    planned_date: '2026-04-09',
  });
});

test('buildUpdateMyScheduleBody preserves explicit empty strings for clearable fields', () => {
  assert.deepEqual(
    buildUpdateMyScheduleBody({
      linkedReportKey: '',
      selectionReasonLabel: '',
    }),
    {
      linked_report_key: '',
      selection_reason_label: '',
    },
  );
});

test('buildUpdateMyScheduleBody never sends actual visit dates through schedule PATCH', () => {
  assert.deepEqual(
    buildUpdateMyScheduleBody({
      actualVisitDate: '2026-05-02',
      linkedReportKey: 'report-1',
      plannedDate: '2026-05-02',
    } as Parameters<typeof buildUpdateMyScheduleBody>[0] & { actualVisitDate: string }),
    {
      linked_report_key: 'report-1',
      planned_date: '2026-05-02',
    },
  );
});

test('buildFetchMySchedulesPath includes include_all for full-site sync loads', () => {
  assert.equal(
    buildFetchMySchedulesPath({
      includeAll: true,
      limit: 300,
      siteId: 'site-1',
    }),
    '/schedules?include_all=true&limit=300&siteId=site-1',
  );
});

test('fetchAllMySchedules collects every schedule page and keeps query filters', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = new Map<string, string>([[SAFETY_AUTH_TOKEN_KEY, 'token-1']]);
  const fetchedPaths: string[] = [];

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });
  globalThis.fetch = async (input) => {
    const path = String(input);
    fetchedPaths.push(path);
    const offset = path.includes('offset=300') ? 300 : 0;
    const rows = Array.from(
      { length: offset === 0 ? 300 : 1 },
      (_, index) => ({ id: `schedule-${offset + index + 1}` }),
    );

    return new Response(
      JSON.stringify({
        limit: 300,
        month: '2026-05',
        offset,
        rows,
        total: 301,
      }),
      { status: 200 },
    );
  };

  try {
    const response = await fetchAllMySchedules({
      includeAll: true,
      month: '2026-05',
      siteId: 'site-1',
    });

    assert.equal(response.rows.length, 301);
    assert.equal(response.offset, 0);
    assert.equal(response.total, 301);
    assert.deepEqual(fetchedPaths, [
      '/api/me/schedules?include_all=true&limit=300&month=2026-05&offset=0&siteId=site-1',
      '/api/me/schedules?include_all=true&limit=300&month=2026-05&offset=300&siteId=site-1',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  }
});

test('fetchMySchedules shares an in-flight GET for the same query', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = new Map<string, string>([[SAFETY_AUTH_TOKEN_KEY, 'token-1']]);
  let fetchCount = 0;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });
  globalThis.fetch = async () => {
    fetchCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return new Response(
      JSON.stringify({
        limit: 300,
        month: '2026-05',
        offset: 0,
        rows: [{ id: 'schedule-1' }],
        total: 1,
      }),
      { status: 200 },
    );
  };

  try {
    const [first, second] = await Promise.all([
      fetchMySchedules({ limit: 300, month: '2026-05' }),
      fetchMySchedules({ limit: 300, month: '2026-05' }),
    ]);

    assert.equal(fetchCount, 1);
    assert.equal(first.rows.length, 1);
    assert.equal(second.rows.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  }
});
