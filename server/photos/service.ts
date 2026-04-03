import 'server-only';

import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  fetchSafetyPhotoAssetsServer,
  fetchSafetyReportsBySiteFullServer,
  fetchSafetySitesServer,
} from '@/server/admin/safetyApiServer';
import {
  buildPhotoAlbumItemFromAsset,
  mapBackendPhotoAsset,
} from '@/server/admin/upstreamMappers';
import type { SafetyReport, SafetySite, SafetyUser } from '@/types/backend';
import type { PhotoAlbumItem, PhotoAlbumListResponse } from '@/types/photos';
import {
  buildLegacyPhotoAlbumItemsFromReports,
  buildPhotoAlbumItemsFromSites,
  filterAccessibleSites,
  isAdminPhotoViewer,
  mergePhotoAlbumItems,
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
  reportsBySiteId: Map<string, SafetyReport[]>;
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

async function buildReportsBySiteId(
  token: string,
  request: Request,
  sites: SafetySite[],
) {
  const entries = await Promise.all(
    sites.map(async (site) => [
      site.id,
      await fetchSafetyReportsBySiteFullServer(token, site.id, request),
    ] as const),
  );

  return new Map<string, SafetyReport[]>(entries);
}

export async function loadPhotoAlbumCollection(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumCollectionResult> {
  const context = await resolvePhotoAlbumAccessContext(token, request);
  const sites = filterAccessibleSites(context.accessibleSites, query);
  const fallbackAlbumItems = buildPhotoAlbumItemsFromSites(sites);

  const albumItems =
    query.source === 'report_legacy'
      ? []
      : (
          await fetchSafetyPhotoAssetsServer(
            token,
            {
              headquarter_id: query.headquarterId || '',
              limit: 5000,
              offset: 0,
              site_id: query.siteId || '',
            },
            request,
          )
        ).rows
          .map((asset) => mapBackendPhotoAsset(asset))
          .map((asset) => buildPhotoAlbumItemFromAsset(asset, sites.find((site) => site.id === asset.siteId)))
          .filter((item) => {
            if (query.siteId && item.siteId !== query.siteId) return false;
            if (query.headquarterId && item.headquarterId !== query.headquarterId) return false;
            return true;
          });

  const mergedAlbumItems = [...albumItems];
  const knownIds = new Set(albumItems.map((item) => item.id));
  fallbackAlbumItems.forEach((item) => {
    if (!knownIds.has(item.id)) {
      mergedAlbumItems.push(item);
      knownIds.add(item.id);
    }
  });

  if (query.source === 'album_upload') {
    return {
      context,
      items: mergedAlbumItems,
      reportsBySiteId: new Map<string, SafetyReport[]>(),
      sites,
    };
  }

  const reportsBySiteId = await buildReportsBySiteId(token, request, sites);
  const legacyItems = sites.flatMap((site) =>
    buildLegacyPhotoAlbumItemsFromReports(site, reportsBySiteId.get(site.id) ?? []),
  );

  return {
    context,
    items: mergePhotoAlbumItems(mergedAlbumItems, legacyItems),
    reportsBySiteId,
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
