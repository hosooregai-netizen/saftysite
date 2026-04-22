import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidatePhotoAlbumRouteCache,
  readOrCreatePhotoAlbumRouteResponse,
} from './routeCache';
import type { PhotoAlbumListResponse } from '@/types/photos';

function buildRequest(search = 'site_id=site-1', token = 'Bearer photo-token') {
  return new Request(`https://example.com/api/photos?${search}`, {
    headers: {
      authorization: token,
    },
  });
}

function buildPayload(): PhotoAlbumListResponse {
  return {
    capabilities: {
      deleteSupported: true,
      roundUpdateSupported: true,
    },
    limit: 60,
    offset: 0,
    rows: [],
    total: 0,
  };
}

test('dedupes concurrent photo album route requests and reuses cached payloads', async () => {
  invalidatePhotoAlbumRouteCache();
  let callCount = 0;
  const request = buildRequest();

  const loader = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return buildPayload();
  };

  const [first, second] = await Promise.all([
    readOrCreatePhotoAlbumRouteResponse(request, loader),
    readOrCreatePhotoAlbumRouteResponse(request, loader),
  ]);
  const third = await readOrCreatePhotoAlbumRouteResponse(request, loader);

  assert.equal(callCount, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test('separates photo album cache entries by query string and authorization header', async () => {
  invalidatePhotoAlbumRouteCache();
  let callCount = 0;
  const loader = async () => {
    callCount += 1;
    return buildPayload();
  };

  await readOrCreatePhotoAlbumRouteResponse(buildRequest('site_id=site-1', 'Bearer one'), loader);
  await readOrCreatePhotoAlbumRouteResponse(buildRequest('site_id=site-2', 'Bearer one'), loader);
  await readOrCreatePhotoAlbumRouteResponse(buildRequest('site_id=site-1', 'Bearer two'), loader);

  assert.equal(callCount, 3);
});

test('expires cached photo album payloads after ttl', async () => {
  invalidatePhotoAlbumRouteCache();
  let callCount = 0;
  const request = buildRequest();
  const loader = async () => {
    callCount += 1;
    return buildPayload();
  };

  await readOrCreatePhotoAlbumRouteResponse(request, loader, { now: 1_000, ttlMs: 15_000 });
  await readOrCreatePhotoAlbumRouteResponse(request, loader, { now: 15_999, ttlMs: 15_000 });
  await readOrCreatePhotoAlbumRouteResponse(request, loader, { now: 16_001, ttlMs: 15_000 });

  assert.equal(callCount, 2);
});

test('forces fresh photo album load after explicit invalidation', async () => {
  invalidatePhotoAlbumRouteCache();
  let callCount = 0;
  const request = buildRequest();
  const loader = async () => {
    callCount += 1;
    return buildPayload();
  };

  await readOrCreatePhotoAlbumRouteResponse(request, loader);
  invalidatePhotoAlbumRouteCache();
  await readOrCreatePhotoAlbumRouteResponse(request, loader);

  assert.equal(callCount, 2);
});

