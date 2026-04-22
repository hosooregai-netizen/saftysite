import assert from 'node:assert/strict';
import test from 'node:test';

import { handlePhotoAlbumCachePost } from './routeHandlers';

test('POST /api/photos/cache invalidates the photo album route cache', async () => {
  let invalidateCount = 0;
  const request = new Request('https://example.com/api/photos/cache', {
    method: 'POST',
  });

  const response = await handlePhotoAlbumCachePost(request, {
    invalidatePhotoAlbumRouteCache: () => {
      invalidateCount += 1;
    },
    readRequiredAdminToken: () => 'cache-token',
  });

  const payload = (await response.json()) as { ok?: boolean };

  assert.equal(invalidateCount, 1);
  assert.equal(payload.ok, true);
});
