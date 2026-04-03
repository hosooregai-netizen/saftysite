import 'server-only';

import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  fetchSafetyReportsBySiteFullServer,
  fetchSafetySitesServer,
} from '@/server/admin/safetyApiServer';
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
  const albumItems = buildPhotoAlbumItemsFromSites(sites);

  if (query.source === 'album_upload') {
    return {
      context,
      items: albumItems,
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
    items: mergePhotoAlbumItems(albumItems, legacyItems),
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
