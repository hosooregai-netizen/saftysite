import assert from 'node:assert/strict';
import test from 'node:test';

import { requestSafetyApi } from './client';

const PROXY_BASE_URL_ENV_KEY = 'NEXT_PUBLIC_SAFETY_API_PROXY_BASE_URL';
const ORIGINAL_PROXY_BASE_URL = process.env[PROXY_BASE_URL_ENV_KEY];

function withProxyBaseUrl(value: string, callback: () => Promise<void>) {
  process.env[PROXY_BASE_URL_ENV_KEY] = value;

  return callback().finally(() => {
    if (ORIGINAL_PROXY_BASE_URL === undefined) {
      delete process.env[PROXY_BASE_URL_ENV_KEY];
    } else {
      process.env[PROXY_BASE_URL_ENV_KEY] = ORIGINAL_PROXY_BASE_URL;
    }
  });
}

test('requestSafetyApi tolerates empty JSON bodies on successful write responses', async () => {
  const originalFetch = globalThis.fetch;

  await withProxyBaseUrl('https://example.com/api/safety', async () => {
    globalThis.fetch = async () =>
      new Response('', {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });

    try {
      const result = await requestSafetyApi('/headquarters', {
        method: 'POST',
        body: JSON.stringify({ name: 'mock' }),
      });

      assert.equal(result, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('requestSafetyApi adds save guidance when a write request times out', async () => {
  const originalFetch = globalThis.fetch;

  await withProxyBaseUrl('https://example.com/api/safety', async () => {
    globalThis.fetch = async () => {
      throw new DOMException('POST /sites 요청이 30000ms 안에 완료되지 않았습니다.', 'AbortError');
    };

    try {
      await assert.rejects(
        () =>
          requestSafetyApi('/sites', {
            method: 'POST',
            body: JSON.stringify({ site_name: 'mocked' }),
          }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(error.message, /저장 요청이 지연되고 있습니다/);
          assert.match(error.message, /반영 여부를 먼저 확인/);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
