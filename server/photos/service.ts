import 'server-only';

import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  fetchSafetyPhotoAssetsServer,
  fetchSafetySitesServer,
} from '@/server/admin/safetyApiServer';
import {
  buildPhotoAlbumItemFromAsset,
  mapBackendPhotoAsset,
} from '@/server/admin/upstreamMappers';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { PhotoAlbumItem, PhotoAlbumListResponse } from '@/types/photos';
import {
  filterAccessibleSites,
  isAdminPhotoViewer,
  queryPhotoAlbumItems,
  type PhotoAlbumQuery,
} from './album';

export interface PhotoAlbumAccessContext {
  accessibleSites: SafetySite[];
  currentUser: SafetyUser;
  isAdmin: boolean;
}

export interface PhotoAlbumCollectionResult {
  context: PhotoAlbumAccessContext;
  items: PhotoAlbumItem[];
  sites: SafetySite[];
}

export async function resolvePhotoAlbumAccessContext(
  token: string,
  request: Request,
): Promise<PhotoAlbumAccessContext> {
  const currentUser = await fetchCurrentSafetyUserServer(token, request);
  const isAdmin = isAdminPhotoViewer(currentUser);
  const accessibleSites = isAdmin
    ? await fetchSafetySitesServer(token, request)
    : await fetchAssignedSafetySitesServer(token, request);

  return {
    accessibleSites,
    currentUser,
    isAdmin,
  };
}

export async function loadPhotoAlbumCollection(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumCollectionResult> {
  const context = await resolvePhotoAlbumAccessContext(token, request);
  const sites = filterAccessibleSites(context.accessibleSites, query);
  const assetRows = (
    await fetchSafetyPhotoAssetsServer(
      token,
      {
        headquarter_id: query.headquarterId || '',
        limit: 5000,
        offset: 0,
        site_id: query.siteId || '',
        source_kind: query.source && query.source !== 'all' ? query.source : '',
      },
      request,
    )
  ).rows;

  return {
    context,
    items: assetRows
      .map((asset) => mapBackendPhotoAsset(asset))
      .map((asset) =>
        buildPhotoAlbumItemFromAsset(asset, sites.find((site) => site.id === asset.siteId)),
      )
      .filter((item) => {
        if (query.siteId && item.siteId !== query.siteId) return false;
        if (query.headquarterId && item.headquarterId !== query.headquarterId) return false;
        return true;
      }),
    sites,
  };
}

export async function loadPhotoAlbumList(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumListResponse> {
  const collection = await loadPhotoAlbumCollection(token, request, query);
  return queryPhotoAlbumItems(collection.items, query);
}
