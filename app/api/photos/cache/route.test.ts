import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { handlePhotoAlbumCachePost } from './routeHandlers';

test('POST /api/photos/cache invalidates photo album route cache after authentication', async () => {
  let invalidateCount = 0;
  const request = new Request('https://example.com/api/photos/cache', {
    headers: {
      authorization: 'Bearer cache-token',
    },
    method: 'POST',
  });

  const response = await handlePhotoAlbumCachePost(request, {
    invalidatePhotoAlbumRouteCache: () => {
      invalidateCount += 1;
    },
    readRequiredAdminToken: (currentRequest) => {
      assert.equal(currentRequest, request);
      return 'cache-token';
    },
  });

  assert.equal(invalidateCount, 1);
  assert.deepEqual(await response.json(), { ok: true });
});

test('POST /api/photos/cache returns the auth helper 401 response when authorization is missing', async () => {
  const request = new Request('https://example.com/api/photos/cache', {
    method: 'POST',
  });

  let expectedMessage = '';
  try {
    readRequiredAdminToken(request);
    assert.fail('expected auth helper to throw');
  } catch (error) {
    assert.ok(error instanceof SafetyServerApiError);
    expectedMessage = error.message;
  }

  const response = await handlePhotoAlbumCachePost(request, {
    invalidatePhotoAlbumRouteCache: () => {
      assert.fail('cache invalidation should not run without auth');
    },
    readRequiredAdminToken,
  });
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 401);
  assert.equal(payload.error, expectedMessage);
});

test('POST /api/photos/cache returns 500 JSON errors for unexpected failures', async () => {
  const response = await handlePhotoAlbumCachePost(
    new Request('https://example.com/api/photos/cache', {
      headers: {
        authorization: 'Bearer cache-token',
      },
      method: 'POST',
    }),
    {
      invalidatePhotoAlbumRouteCache: () => {
        throw new Error('cache exploded');
      },
      readRequiredAdminToken: () => 'cache-token',
    },
  );
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 500);
  assert.equal(payload.error, 'cache exploded');
});
