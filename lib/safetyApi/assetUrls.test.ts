import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSafetyAssetTransportWarning,
  buildSafetyAssetUrl,
  normalizeSafetyAssetUrl,
  shouldOpenSafetyAssetInNewTab,
  shouldUseSafetyAssetDownloadAttribute,
} from './assetUrls';

const SAFETY_ASSET_BASE_URL_ENV_KEY = 'NEXT_PUBLIC_SAFETY_ASSET_BASE_URL';
const SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY = 'NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL';
const ORIGINAL_SAFETY_ASSET_BASE_URL = process.env[SAFETY_ASSET_BASE_URL_ENV_KEY];
const ORIGINAL_SAFETY_API_UPSTREAM_BASE_URL =
  process.env[SAFETY_API_UPSTREAM_BASE_URL_ENV_KEY];

function withSafetyAssetBaseUrl(
  value: string | undefined,
  callback: () => void,
): void {
  if (value === undefined) {
    delete process.env[SAFETY_ASSET_BASE_URL_ENV_KEY];
  } else {
    process.env[SAFETY_ASSET_BASE_URL_ENV_KEY] = value;
  }

  try {
    callback();
  } finally {
    if (ORIGINAL_SAFETY_ASSET_BASE_URL === undefined) {
      delete process.env[SAFETY_ASSET_BASE_URL_ENV_KEY];
    } else {
      process.env[SAFETY_ASSET_BASE_URL_ENV_KEY] = ORIGINAL_SAFETY_ASSET_BASE_URL;
    }
  }
}

function withSafetyPublicUpstreamBaseUrl(
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

test('builds direct safety asset URLs when an asset base is configured', () => {
  withSafetyAssetBaseUrl('https://assets.example.com/', () => {
    assert.equal(
      buildSafetyAssetUrl('/uploads/mock-guide.pdf'),
      'https://assets.example.com/uploads/mock-guide.pdf',
    );
  });
});

test('normalizes proxied and relative upload URLs to the configured asset base', () => {
  withSafetyAssetBaseUrl('https://assets.example.com', () => {
    assert.equal(
      normalizeSafetyAssetUrl('/uploads/mock-guide.pdf'),
      'https://assets.example.com/uploads/mock-guide.pdf',
    );
    assert.equal(
      normalizeSafetyAssetUrl('/api/safety/uploads/mock-guide.pdf'),
      'https://assets.example.com/uploads/mock-guide.pdf',
    );
    assert.equal(
      normalizeSafetyAssetUrl(
        'https://app.example.com/api/safety/uploads/mock-guide.pdf?download=1#page=2',
      ),
      'https://assets.example.com/uploads/mock-guide.pdf?download=1#page=2',
    );
  });
});

test('preserves already-direct asset URLs and unrelated URLs', () => {
  withSafetyAssetBaseUrl('https://assets.example.com', () => {
    assert.equal(
      normalizeSafetyAssetUrl('https://assets.example.com/uploads/mock-guide.pdf'),
      'https://assets.example.com/uploads/mock-guide.pdf',
    );
    assert.equal(
      normalizeSafetyAssetUrl('data:application/pdf;base64,abc123'),
      'data:application/pdf;base64,abc123',
    );
    assert.equal(
      normalizeSafetyAssetUrl('https://example.com/files/mock-guide.pdf'),
      'https://example.com/files/mock-guide.pdf',
    );
  });
});

test('falls back to the proxy download path when no asset base is configured', () => {
  withSafetyAssetBaseUrl(undefined, () => {
    assert.equal(
      buildSafetyAssetUrl('/uploads/mock-guide.pdf'),
      'http://127.0.0.1:8011/uploads/mock-guide.pdf',
    );
    assert.equal(
      normalizeSafetyAssetUrl('/api/safety/uploads/mock-guide.pdf'),
      'http://127.0.0.1:8011/uploads/mock-guide.pdf',
    );
  });
});

test('uses the public upstream origin when no dedicated asset base is configured', () => {
  withSafetyAssetBaseUrl(undefined, () => {
    withSafetyPublicUpstreamBaseUrl('https://api.example.com/api/v1', () => {
      assert.equal(
        buildSafetyAssetUrl('/uploads/mock-guide.pdf'),
        'https://api.example.com/uploads/mock-guide.pdf',
      );
      assert.equal(
        normalizeSafetyAssetUrl('/api/safety/uploads/mock-guide.pdf'),
        'https://api.example.com/uploads/mock-guide.pdf',
      );
    });
  });
});

test('prefers new-tab navigation for absolute asset URLs and download attribute for local URLs', () => {
  assert.equal(shouldUseSafetyAssetDownloadAttribute('/uploads/mock-guide.pdf'), true);
  assert.equal(shouldUseSafetyAssetDownloadAttribute('blob:https://app.example.com/123'), true);
  assert.equal(
    shouldUseSafetyAssetDownloadAttribute('https://assets.example.com/uploads/mock-guide.pdf'),
    false,
  );
  assert.equal(
    shouldOpenSafetyAssetInNewTab('https://assets.example.com/uploads/mock-guide.pdf'),
    true,
  );
  assert.equal(shouldOpenSafetyAssetInNewTab('/uploads/mock-guide.pdf'), false);
});

test('warns when a secure page points to an insecure asset URL', () => {
  assert.equal(
    getSafetyAssetTransportWarning(
      'http://127.0.0.1:8011/uploads/mock-guide.pdf',
      'https:',
    ),
    'HTTPS 배포에서는 이 파일이 브라우저에서 차단될 수 있습니다. HTTPS 자산 도메인을 연결하면 가장 안정적입니다.',
  );
  assert.equal(
    getSafetyAssetTransportWarning(
      'https://assets.example.com/uploads/mock-guide.pdf',
      'https:',
    ),
    null,
  );
});
