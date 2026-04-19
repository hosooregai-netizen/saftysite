import assert from 'node:assert/strict';
import test from 'node:test';

import { requestSafetyAdminServer } from './safetyApiServer';

const UPSTREAM_BASE_URL_ENV_KEY = 'SAFETY_API_UPSTREAM_BASE_URL';
const ORIGINAL_UPSTREAM_BASE_URL = process.env[UPSTREAM_BASE_URL_ENV_KEY];

function withUpstreamBaseUrl(value: string, callback: () => Promise<void>) {
  process.env[UPSTREAM_BASE_URL_ENV_KEY] = value;

  return callback().finally(() => {
    if (ORIGINAL_UPSTREAM_BASE_URL === undefined) {
      delete process.env[UPSTREAM_BASE_URL_ENV_KEY];
    } else {
      process.env[UPSTREAM_BASE_URL_ENV_KEY] = ORIGINAL_UPSTREAM_BASE_URL;
    }
  });
}

test('requestSafetyAdminServer tolerates empty JSON bodies on successful write responses', async () => {
  const originalFetch = globalThis.fetch;

  await withUpstreamBaseUrl('https://example.com/api/v1', async () => {
    globalThis.fetch = async () =>
      new Response('', {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });

    try {
      const result = await requestSafetyAdminServer(
        '/headquarters',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'mock' }),
          headers: { 'Content-Type': 'application/json' },
        },
        'token',
      );

      assert.equal(result, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
