import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSafetyProxyUpstreamUrl,
  proxySafetyApiRequest,
  resolveSafetyProxyUpstreamBaseUrl,
} from './proxy';

const SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY = 'SAFETY_API_UPSTREAM_BASE_URL';
const ORIGINAL_SAFETY_API_UPSTREAM_BASE_URL = process.env[SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY];

function withSafetyApiUpstreamBaseUrl(
  value: string | undefined,
  callback: () => void,
): void {
  if (value === undefined) {
    delete process.env[SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY];
  } else {
    process.env[SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY] = value;
  }

  try {
    callback();
  } finally {
    if (ORIGINAL_SAFETY_API_UPSTREAM_BASE_URL === undefined) {
      delete process.env[SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY];
    } else {
      process.env[SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY] = ORIGINAL_SAFETY_API_UPSTREAM_BASE_URL;
    }
  }
}

test('keeps the API upstream base for ordinary safety API requests', () => {
  withSafetyApiUpstreamBaseUrl('http://52.64.85.49:8011/api/v1', () => {
    assert.equal(
      resolveSafetyProxyUpstreamBaseUrl(['reports']),
      'http://52.64.85.49:8011/api/v1',
    );
  });
});

test('uses the upstream origin root for uploaded asset requests', () => {
  withSafetyApiUpstreamBaseUrl('http://52.64.85.49:8011/api/v1', () => {
    assert.equal(
      resolveSafetyProxyUpstreamBaseUrl(['uploads', 'photos', 'example.jpg']),
      'http://52.64.85.49:8011',
    );
  });
});

test('builds upload proxy URLs against the upstream origin root', () => {
  withSafetyApiUpstreamBaseUrl('http://52.64.85.49:8011/api/v1', () => {
    const request = new Request('https://app.example.com/api/safety/uploads/photos/example.jpg?download=1');

    assert.equal(
      buildSafetyProxyUpstreamUrl(request, ['uploads', 'photos', 'example.jpg']),
      'http://52.64.85.49:8011/uploads/photos/example.jpg?download=1',
    );
  });
});

test('preserves upstream cache validators for proxied photo asset files', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('image-bytes', {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: '"thumb-123"',
        'Last-Modified': 'Wed, 01 Jan 2026 00:00:00 GMT',
      },
    })) as typeof fetch;

  try {
    const response = await proxySafetyApiRequest(
      new Request('https://app.example.com/api/safety/photo-assets/files/thumbnails/thumb.jpg'),
      ['photo-assets', 'files', 'thumbnails', 'thumb.jpg'],
    );

    assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal(response.headers.get('etag'), '"thumb-123"');
    assert.equal(response.headers.get('last-modified'), 'Wed, 01 Jan 2026 00:00:00 GMT');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
