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
