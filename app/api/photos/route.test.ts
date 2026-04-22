import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handlePhotoAlbumDelete,
  handlePhotoAlbumGet,
  handlePhotoAlbumPatch,
} from './routeHandlers';
import type { PhotoAlbumListResponse } from '@/types/photos';

function buildListPayload(): PhotoAlbumListResponse {
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

test('GET /api/photos reads list responses through the photo album route cache helper', async () => {
  let cacheReadCount = 0;
  let loaderCount = 0;
  const request = new Request(
    'https://example.com/api/photos?all=true&headquarter_id=hq-1&site_id=site-1&sort_by=capturedAt&sort_dir=desc',
    {
      headers: {
        authorization: 'Bearer route-token',
      },
    },
  );

  const response = await handlePhotoAlbumGet(request, {
    deleteSafetyPhotoAssetsServer: async () => ({ affected_count: 0 }),
    invalidatePhotoAlbumRouteCache: () => {},
    loadPhotoAlbumList: async (token, currentRequest, query) => {
      loaderCount += 1;
      assert.equal(token, 'route-token');
      assert.equal(currentRequest, request);
      assert.equal(query.siteId, 'site-1');
      assert.equal(query.headquarterId, 'hq-1');
      assert.equal(query.sortBy, 'capturedAt');
      return buildListPayload();
    },
    readOrCreatePhotoAlbumRouteResponse: async (currentRequest, loader) => {
      cacheReadCount += 1;
      assert.equal(currentRequest, request);
      return loader();
    },
    readRequiredAdminToken: () => 'route-token',
    updateSafetyPhotoAssetsRoundServer: async () => ({ affected_count: 0 }),
  });

  assert.equal(cacheReadCount, 1);
  assert.equal(loaderCount, 1);
  assert.deepEqual(await response.json(), buildListPayload());
});

test('PATCH /api/photos invalidates photo album route cache after a successful mutation', async () => {
  let invalidateCount = 0;
  const request = new Request('https://example.com/api/photos', {
    body: JSON.stringify({ item_ids: ['asset-1'], round_no: 3 }),
    method: 'PATCH',
  });

  const response = await handlePhotoAlbumPatch(request, {
    deleteSafetyPhotoAssetsServer: async () => ({ affected_count: 0 }),
    invalidatePhotoAlbumRouteCache: () => {
      invalidateCount += 1;
    },
    loadPhotoAlbumList: async () => buildListPayload(),
    readOrCreatePhotoAlbumRouteResponse: async (_request, loader) => loader(),
    readRequiredAdminToken: () => 'patch-token',
    updateSafetyPhotoAssetsRoundServer: async (_token, payload) => {
      assert.deepEqual(payload, {
        item_ids: ['asset-1'],
        round_no: 3,
      });
      return { affected_count: 1 };
    },
  });

  assert.equal(invalidateCount, 1);
  assert.deepEqual(await response.json(), { affectedCount: 1 });
});

test('DELETE /api/photos invalidates photo album route cache after a successful mutation', async () => {
  let invalidateCount = 0;
  const request = new Request('https://example.com/api/photos', {
    body: JSON.stringify({ item_ids: ['asset-1', 'asset-2'] }),
    method: 'DELETE',
  });

  const response = await handlePhotoAlbumDelete(request, {
    deleteSafetyPhotoAssetsServer: async (_token, payload) => {
      assert.deepEqual(payload, {
        item_ids: ['asset-1', 'asset-2'],
      });
      return { affected_count: 2 };
    },
    invalidatePhotoAlbumRouteCache: () => {
      invalidateCount += 1;
    },
    loadPhotoAlbumList: async () => buildListPayload(),
    readOrCreatePhotoAlbumRouteResponse: async (_request, loader) => loader(),
    readRequiredAdminToken: () => 'delete-token',
    updateSafetyPhotoAssetsRoundServer: async () => ({ affected_count: 0 }),
  });

  assert.equal(invalidateCount, 1);
  assert.deepEqual(await response.json(), { affectedCount: 2 });
});
