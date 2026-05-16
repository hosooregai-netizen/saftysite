import assert from 'node:assert/strict';
import test from 'node:test';

import { handlePhotoAlbumUploadPost } from './routeHandlers';
import type { SafetyBackendPhotoAsset } from '@/types/backend';

function buildUploadRequest() {
  const formData = new FormData();
  formData.set('site_id', 'site-1');
  formData.set('round_no', '2');
  formData.set('file', new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));
  formData.set('thumbnail', new File(['thumb'], 'thumb.jpg', { type: 'image/jpeg' }));
  return new Request('https://example.com/api/photos/upload', {
    body: formData,
    method: 'POST',
  });
}

function buildBackendAsset(): SafetyBackendPhotoAsset {
  return {
    captured_at: '2026-04-22T10:00:00Z',
    content_type: 'image/jpeg',
    created_at: '2026-04-22T10:00:00Z',
    exif_json: {},
    file_name: 'photo.jpg',
    gps_latitude: null,
    gps_longitude: null,
    headquarter_id: 'hq-1',
    headquarter_name: 'HQ',
    id: 'asset-1',
    original_path: '/photo-assets/files/originals/photo.jpg',
    round_no: 2,
    size_bytes: 1024,
    site_id: 'site-1',
    site_name: 'Site 1',
    source_document_key: '',
    source_kind: 'album_upload',
    source_report_key: '',
    source_report_title: '',
    source_slot_key: '',
    thumbnail_path: '/photo-assets/files/thumbnails/photo.jpg',
    updated_at: '2026-04-22T10:00:00Z',
    uploaded_by_name: 'Uploader',
    uploaded_by_user_id: 'user-1',
  };
}

test('POST /api/photos/upload invalidates photo album route cache after a successful upload', async () => {
  let invalidateCount = 0;
  const request = buildUploadRequest();

  const response = await handlePhotoAlbumUploadPost(request, {
    invalidatePhotoAlbumRouteCache: () => {
      invalidateCount += 1;
    },
    readRequiredAdminToken: () => 'upload-token',
    uploadSafetyPhotoAssetServer: async (token, formData) => {
      assert.equal(token, 'upload-token');
      assert.equal(formData.get('site_id'), 'site-1');
      assert.equal(formData.get('round_no'), '2');
      assert.ok(formData.get('file') instanceof File);
      assert.ok(formData.get('thumbnail') instanceof File);
      return buildBackendAsset();
    },
  });

  const payload = (await response.json()) as {
    item?: { id?: string; originalUrl?: string; previewUrl?: string; thumbnailUrl?: string };
    ok?: boolean;
  };

  assert.equal(invalidateCount, 1);
  assert.equal(payload.ok, true);
  assert.equal(payload.item?.id, 'asset-1');
  assert.match(payload.item?.originalUrl ?? '', /\/photo-assets\/files\/originals\/photo\.jpg$/);
  assert.match(payload.item?.previewUrl ?? '', /\/photo-assets\/files\/thumbnails\/photo\.jpg$/);
  assert.equal(payload.item?.thumbnailUrl, payload.item?.previewUrl);
});
