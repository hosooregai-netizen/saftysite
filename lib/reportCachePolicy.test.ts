import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REPORT_INDEX_HARD_TTL_MS,
  REPORT_INDEX_SOFT_TTL_MS,
  getReportCacheFreshness,
  shouldSurfaceCacheError,
  shouldUseBlockingReload,
} from './reportCachePolicy';

test('classifies fresh, stale, and expired cache entries by fetched timestamp', () => {
  const now = Date.UTC(2026, 3, 9, 0, 0, 0);

  assert.equal(getReportCacheFreshness(null, now), 'missing');
  assert.equal(
    getReportCacheFreshness(new Date(now - REPORT_INDEX_SOFT_TTL_MS + 1000).toISOString(), now),
    'fresh',
  );
  assert.equal(
    getReportCacheFreshness(new Date(now - REPORT_INDEX_SOFT_TTL_MS - 1000).toISOString(), now),
    'stale',
  );
  assert.equal(
    getReportCacheFreshness(new Date(now - REPORT_INDEX_HARD_TTL_MS - 1000).toISOString(), now),
    'expired',
  );
});

test('keeps stale cached data in loaded state during background refresh', () => {
  assert.equal(
    shouldUseBlockingReload({
      freshness: 'stale',
      hasVisibleData: true,
    }),
    false,
  );
  assert.equal(
    shouldUseBlockingReload({
      freshness: 'expired',
      hasVisibleData: true,
    }),
    true,
  );
});

test('surfaces fetch errors only when no usable cache exists or reload is forced', () => {
  assert.equal(
    shouldSurfaceCacheError({
      hasVisibleData: true,
    }),
    false,
  );
  assert.equal(
    shouldSurfaceCacheError({
      hasVisibleData: false,
    }),
    true,
  );
  assert.equal(
    shouldSurfaceCacheError({
      force: true,
      hasVisibleData: true,
    }),
    true,
  );
});
