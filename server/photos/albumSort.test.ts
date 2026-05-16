import assert from 'node:assert/strict';
import test from 'node:test';

import { comparePhotoAlbumItems } from './albumSort';
import type { PhotoAlbumItem } from '@/types/photos';

function buildItem(input: Partial<PhotoAlbumItem> & Pick<PhotoAlbumItem, 'id' | 'roundNo'>): PhotoAlbumItem {
  return {
    capturedAt: input.capturedAt ?? '',
    contentType: 'image/jpeg',
    createdAt: input.createdAt ?? '2026-01-01T00:00:00.000Z',
    downloadUrl: '',
    fileName: input.fileName ?? `${input.id}.jpg`,
    gpsLatitude: null,
    gpsLongitude: null,
    headquarterId: 'hq-1',
    headquarterName: 'HQ',
    id: input.id,
    originalUrl: '',
    previewUrl: '',
    roundNo: input.roundNo,
    siteId: input.siteId ?? 'site-1',
    siteName: input.siteName ?? 'Site',
    sizeBytes: 0,
    sourceDocumentKey: '',
    sourceKind: 'album_upload',
    sourceReportKey: '',
    sourceReportTitle: '',
    sourceSlotKey: '',
    thumbnailUrl: '',
    uploadedByName: '',
    uploadedByUserId: '',
  };
}

test('capturedAt desc keeps site album pages ordered from round 1 while dates stay newest-first inside a round', () => {
  const rows = [
    buildItem({ id: 'round-3', roundNo: 3, capturedAt: '2026-01-03T00:00:00.000Z' }),
    buildItem({ id: 'round-1-old', roundNo: 1, capturedAt: '2026-01-01T00:00:00.000Z' }),
    buildItem({ id: 'round-1-new', roundNo: 1, capturedAt: '2026-01-02T00:00:00.000Z' }),
    buildItem({ id: 'unassigned', roundNo: 0, capturedAt: '2026-01-04T00:00:00.000Z' }),
    buildItem({ id: 'round-2', roundNo: 2, capturedAt: '2026-01-04T00:00:00.000Z' }),
  ];

  rows.sort((left, right) =>
    comparePhotoAlbumItems(left, right, { sortBy: 'capturedAt', sortDir: 'desc' }),
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ['round-1-new', 'round-1-old', 'round-2', 'round-3', 'unassigned'],
  );
});
