import assert from 'node:assert/strict';
import test from 'node:test';

import JSZip from 'jszip';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { PhotoAlbumItem } from '@/types/photos';
import {
  handlePhotoAlbumDownloadPost,
  type PhotoAlbumDownloadRouteDeps,
} from './routeHandlers';

function buildPostRequest(itemIds: string[]) {
  return new Request('https://example.com/api/photos/download', {
    body: JSON.stringify({ item_ids: itemIds }),
    headers: {
      authorization: 'Bearer download-token',
      'content-type': 'application/json',
    },
    method: 'POST',
  });
}

function buildAlbumUploadItem(id: string, fileName: string): PhotoAlbumItem {
  return {
    capturedAt: '2026-04-22T10:00:00Z',
    contentType: 'image/jpeg',
    createdAt: '2026-04-22T10:00:00Z',
    downloadUrl: `/api/photos/download?item_id=${encodeURIComponent(id)}`,
    fileName,
    gpsLatitude: null,
    gpsLongitude: null,
    headquarterId: 'hq-1',
    headquarterName: 'HQ',
    id,
    originalUrl: `/photo-assets/${id}/original`,
    previewUrl: `/photo-assets/${id}/thumbnail`,
    roundNo: 1,
    siteId: 'site-1',
    siteName: 'Site One',
    sizeBytes: 10,
    sourceDocumentKey: '',
    sourceKind: 'album_upload',
    sourceReportKey: '',
    sourceReportTitle: '',
    sourceSlotKey: '',
    thumbnailUrl: `/photo-assets/${id}/thumbnail`,
    uploadedByName: 'Uploader',
    uploadedByUserId: 'user-1',
  };
}

function buildDeps(
  resolvedItems: PhotoAlbumItem[],
  overrides: Partial<PhotoAlbumDownloadRouteDeps> = {},
): PhotoAlbumDownloadRouteDeps {
  return {
    assertDownloadItemLimit: (itemIds) => {
      if (itemIds.length === 0) {
        throw new Error('select photos');
      }
      if (itemIds.length > 200) {
        throw new Error('too many photos');
      }
    },
    buildDownloadZipEntryName: (item) => `${item.siteName}/${item.fileName}`,
    downloadSafetyPhotoAssetServer: async (_token, assetId) =>
      new Response(`binary-${assetId}`, {
        headers: {
          'content-type': assetId === 'asset-1' ? 'image/png' : 'image/jpeg',
        },
      }),
    loadResolvedPhotoAlbumSelection: async () => ({
      accessibleSites: [],
      items: resolvedItems,
      reportsBySiteId: new Map(),
    }),
    readRequiredAdminToken: () => 'download-token',
    resolvePhotoAlbumItemBinary: async () => {
      throw new Error('legacy resolver should not be used for album uploads');
    },
    ...overrides,
  };
}

test('POST /api/photos/download returns a ZIP for multiple album upload selections', async () => {
  const items = [
    buildAlbumUploadItem('asset-1', 'alpha.jpg'),
    buildAlbumUploadItem('asset-2', 'beta.jpg'),
  ];

  const response = await handlePhotoAlbumDownloadPost(
    buildPostRequest(['asset-1', 'asset-2']),
    buildDeps(items),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/zip');
  assert.match(
    response.headers.get('content-disposition') || '',
    /photo-album-\d{12}\.zip/,
  );

  const zip = await JSZip.loadAsync(Buffer.from(await response.arrayBuffer()));
  const fileNames = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(fileNames, ['Site One/alpha.jpg', 'Site One/beta.jpg']);
  assert.equal(await zip.file('Site One/alpha.jpg')?.async('string'), 'binary-asset-1');
  assert.equal(await zip.file('Site One/beta.jpg')?.async('string'), 'binary-asset-2');
});

test('POST /api/photos/download returns 404 when a selected item is not resolved', async () => {
  let downloadCount = 0;
  const response = await handlePhotoAlbumDownloadPost(
    buildPostRequest(['asset-1', 'missing-asset']),
    buildDeps([buildAlbumUploadItem('asset-1', 'alpha.jpg')], {
      downloadSafetyPhotoAssetServer: async () => {
        downloadCount += 1;
        throw new Error('download should not run for unresolved selections');
      },
    }),
  );
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 404);
  assert.equal(downloadCount, 0);
  assert.equal(payload.error, 'Some selected photos were not found or are not accessible.');
});

test('POST /api/photos/download includes item context when one ZIP source download fails', async () => {
  const items = [
    buildAlbumUploadItem('asset-1', 'alpha.jpg'),
    buildAlbumUploadItem('asset-2', 'beta.jpg'),
  ];

  const response = await handlePhotoAlbumDownloadPost(
    buildPostRequest(['asset-1', 'asset-2']),
    buildDeps(items, {
      downloadSafetyPhotoAssetServer: async (_token, assetId) => {
        if (assetId === 'asset-2') {
          throw new SafetyServerApiError('upstream timeout', 504);
        }
        return new Response(`binary-${assetId}`, {
          headers: {
            'content-type': 'image/jpeg',
          },
        });
      },
    }),
  );
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 504);
  assert.match(payload.error || '', /asset-2/);
  assert.match(payload.error || '', /beta\.jpg/);
  assert.match(payload.error || '', /upstream timeout/);
});

test('POST /api/photos/download returns the original binary for a single item', async () => {
  const response = await handlePhotoAlbumDownloadPost(
    buildPostRequest(['asset-1']),
    buildDeps([buildAlbumUploadItem('asset-1', 'alpha.jpg')]),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.notEqual(response.headers.get('content-type'), 'application/zip');
  assert.match(response.headers.get('content-disposition') || '', /alpha\.jpg/);
  assert.equal(await response.text(), 'binary-asset-1');
});
