import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSafetyProxyUpstreamUrl,
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
