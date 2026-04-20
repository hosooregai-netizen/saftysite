import 'server-only';

import {
  fetchSafetyPhotoAssetMutationCapabilitiesServer,
  fetchSafetyPhotoAssetsServer,
} from '@/server/admin/safetyApiServer';
import {
  buildPhotoAlbumItemFromAsset,
  mapBackendPhotoAsset,
} from '@/server/admin/upstreamMappers';
import type { PhotoAlbumItem, PhotoAlbumListResponse } from '@/types/photos';
import type { PhotoAlbumQuery } from './album';

function normalizeSource(value: PhotoAlbumQuery['source']) {
  return value && value !== 'all' ? value : '';
}

function normalizeSortKey(value: PhotoAlbumQuery['sortBy']) {
  return value || 'capturedAt';
}

function normalizeSortDir(value: PhotoAlbumQuery['sortDir']) {
  return value === 'asc' ? 'asc' : 'desc';
}

export async function loadPhotoAlbumList(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumListResponse> {
  const [response, capabilities] = await Promise.all([
    fetchSafetyPhotoAssetsServer(
      token,
      {
        all: Boolean(query.all),
        headquarter_id: query.headquarterId || '',
        limit: Math.max(1, Math.min(200, query.limit ?? 60)),
        offset: Math.max(0, query.offset ?? 0),
        query: query.query || '',
        report_key: query.reportKey || '',
        site_id: query.siteId || '',
        sort_by: normalizeSortKey(query.sortBy),
        sort_dir: normalizeSortDir(query.sortDir),
        source_kind: normalizeSource(query.source),
      },
      request,
    ),
    fetchSafetyPhotoAssetMutationCapabilitiesServer(),
  ]);

  return {
    capabilities: {
      deleteSupported: capabilities.deleteSupported,
      roundUpdateSupported: capabilities.roundUpdateSupported,
    },
    limit: response.limit,
    offset: response.offset,
    rows: response.rows
      .map((asset) => mapBackendPhotoAsset(asset))
      .map((asset) => buildPhotoAlbumItemFromAsset(asset, null)),
    total: response.total,
  };
}

export async function loadPhotoAlbumItemsByIds(
  token: string,
  request: Request,
  itemIds: string[],
): Promise<PhotoAlbumItem[]> {
  if (itemIds.length === 0) {
    return [];
  }

  const response = await fetchSafetyPhotoAssetsServer(
    token,
    {
      item_ids: itemIds,
      limit: itemIds.length,
      offset: 0,
    },
    request,
  );
  const byId = new Map(
    response.rows
      .map((asset) => mapBackendPhotoAsset(asset))
      .map((asset) => buildPhotoAlbumItemFromAsset(asset, null))
      .map((item) => [item.id, item] as const),
  );

  return itemIds
    .map((itemId) => byId.get(itemId) || null)
    .filter((item): item is PhotoAlbumItem => Boolean(item));
}
