import 'server-only';

import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  fetchSafetyPhotoAssetMutationCapabilitiesServer,
  fetchSafetyPhotoAssetsServer,
  fetchSafetyReportsBySiteFullServer,
  fetchSafetySitesServer,
} from '@/server/admin/safetyApiServer';
import {
  buildPhotoAlbumItemFromAsset,
  mapBackendPhotoAsset,
} from '@/server/admin/upstreamMappers';
import type { SafetyReport, SafetySite } from '@/types/backend';
import type { PhotoAlbumItem, PhotoAlbumListResponse } from '@/types/photos';
import {
  buildLegacyPhotoAlbumItemsFromReports,
  filterAccessibleSites,
  isAdminPhotoViewer,
  mergePhotoAlbumItems,
  parseLegacyPhotoAlbumItemId,
  queryPhotoAlbumItems,
  type PhotoAlbumQuery,
} from './album';

const PHOTO_ASSET_PAGE_SIZE = 200;
const LEGACY_REPORT_FETCH_CONCURRENCY = 6;

function normalizePageLimit(value: number | undefined) {
  return Math.max(1, Math.min(200, value ?? 60));
}

function normalizePageOffset(value: number | undefined) {
  return Math.max(0, value ?? 0);
}

function normalizeSource(value: PhotoAlbumQuery['source']) {
  return value && value !== 'all' ? value : '';
}

function normalizeSortKey(value: PhotoAlbumQuery['sortBy']) {
  return value || 'capturedAt';
}

function normalizeSortDir(value: PhotoAlbumQuery['sortDir']) {
  return value === 'asc' ? 'asc' : 'desc';
}

interface PhotoAlbumSnapshot {
  accessibleSites: SafetySite[];
  items: PhotoAlbumItem[];
  reportsBySiteId: Map<string, SafetyReport[]>;
}

export interface ResolvedPhotoAlbumSelection extends PhotoAlbumSnapshot {
  items: PhotoAlbumItem[];
}

async function loadAccessibleSites(
  token: string,
  request: Request,
  query: Pick<PhotoAlbumQuery, 'headquarterId' | 'siteId'>,
) {
  const currentUser = await fetchCurrentSafetyUserServer(token, request);
  const sites = isAdminPhotoViewer(currentUser)
    ? await fetchSafetySitesServer(token, request)
    : await fetchAssignedSafetySitesServer(token, request);

  return filterAccessibleSites(sites, query);
}

async function fetchAllAlbumUploadItems(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
  sitesById: Map<string, SafetySite>,
): Promise<PhotoAlbumItem[]> {
  if (normalizeSource(query.source) === 'legacy_import') {
    return [];
  }

  const rows: PhotoAlbumItem[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const response = await fetchSafetyPhotoAssetsServer(
      token,
      {
        all: true,
        headquarter_id: query.headquarterId || '',
        limit: PHOTO_ASSET_PAGE_SIZE,
        offset,
        query: query.query || '',
        report_key: query.reportKey || '',
        site_id: query.siteId || '',
        sort_by: normalizeSortKey(query.sortBy),
        sort_dir: normalizeSortDir(query.sortDir),
        source_kind: 'album_upload',
      },
      request,
    );

    total = response.total;
    if (response.rows.length === 0) {
      break;
    }

    rows.push(
      ...response.rows
        .map((asset) => mapBackendPhotoAsset(asset))
        .map((asset) => buildPhotoAlbumItemFromAsset(asset, sitesById.get(asset.siteId))),
    );
    offset += response.rows.length;
  }

  return rows;
}

async function loadPagedAlbumUploadList(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumListResponse | null> {
  if (query.all || normalizeSource(query.source) !== 'album_upload') {
    return null;
  }

  const accessibleSites = await loadAccessibleSites(token, request, query);
  const sitesById = new Map(accessibleSites.map((site) => [site.id, site] as const));
  const limit = normalizePageLimit(query.limit);
  const offset = normalizePageOffset(query.offset);

  const [response, capabilities] = await Promise.all([
    fetchSafetyPhotoAssetsServer(
      token,
      {
        headquarter_id: query.headquarterId || '',
        limit,
        offset,
        query: query.query || '',
        report_key: query.reportKey || '',
        site_id: query.siteId || '',
        sort_by: normalizeSortKey(query.sortBy),
        sort_dir: normalizeSortDir(query.sortDir),
        source_kind: 'album_upload',
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
    limit,
    offset,
    rows: response.rows
      .map((asset) => mapBackendPhotoAsset(asset))
      .map((asset) => buildPhotoAlbumItemFromAsset(asset, sitesById.get(asset.siteId))),
    total: response.total,
  };
}

async function fetchReportsBySiteId(
  token: string,
  request: Request,
  accessibleSites: SafetySite[],
  options?: {
    legacyItemIds?: string[];
    query?: PhotoAlbumQuery;
  },
): Promise<Map<string, SafetyReport[]>> {
  const source = normalizeSource(options?.query?.source);
  const legacyItemIds = options?.legacyItemIds ?? [];
  if (source === 'album_upload' || (!options?.query && legacyItemIds.length === 0)) {
    return new Map();
  }

  const targetReportKeys = new Set(
    legacyItemIds
      .map((itemId) => parseLegacyPhotoAlbumItemId(itemId)?.reportKey || '')
      .filter(Boolean),
  );
  const reportKeyFilter = options?.query?.reportKey?.trim() || '';
  const reportsBySiteId = new Map<string, SafetyReport[]>();
  const failedSiteIds: string[] = [];

  for (let index = 0; index < accessibleSites.length; index += LEGACY_REPORT_FETCH_CONCURRENCY) {
    const chunk = accessibleSites.slice(index, index + LEGACY_REPORT_FETCH_CONCURRENCY);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (site) => {
        const reports = await fetchSafetyReportsBySiteFullServer(token, site.id, request);
        const filteredReports = reports.filter((report) => {
          if (reportKeyFilter && report.report_key !== reportKeyFilter) {
            return false;
          }
          if (targetReportKeys.size > 0 && !targetReportKeys.has(report.report_key)) {
            return false;
          }
          return true;
        });
        return [site.id, filteredReports] as const;
      }),
    );

    chunkResults.forEach((result, resultIndex) => {
      const siteId = chunk[resultIndex]?.id || '';
      if (result.status === 'fulfilled') {
        const [resolvedSiteId, reports] = result.value;
        reportsBySiteId.set(resolvedSiteId, reports);
        return;
      }

      if (siteId) {
        failedSiteIds.push(siteId);
      }
    });
  }

  if (failedSiteIds.length > 0) {
    console.warn(
      `[photo-album] skipped legacy report fetch for ${failedSiteIds.length} site(s): ${failedSiteIds
        .slice(0, 10)
        .join(', ')}${failedSiteIds.length > 10 ? ', ...' : ''}`,
    );
  }

  return reportsBySiteId;
}

function buildLegacyItems(
  accessibleSites: SafetySite[],
  reportsBySiteId: Map<string, SafetyReport[]>,
): PhotoAlbumItem[] {
  return accessibleSites.flatMap((site) =>
    buildLegacyPhotoAlbumItemsFromReports(site, reportsBySiteId.get(site.id) ?? []),
  );
}

async function loadPhotoAlbumSnapshot(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumSnapshot> {
  const accessibleSites = await loadAccessibleSites(token, request, query);
  const sitesById = new Map(accessibleSites.map((site) => [site.id, site] as const));

  const [albumUploadItems, reportsBySiteId] = await Promise.all([
    fetchAllAlbumUploadItems(token, request, query, sitesById),
    fetchReportsBySiteId(token, request, accessibleSites, { query }),
  ]);

  return {
    accessibleSites,
    items: mergePhotoAlbumItems(albumUploadItems, buildLegacyItems(accessibleSites, reportsBySiteId)),
    reportsBySiteId,
  };
}

export async function loadPhotoAlbumList(
  token: string,
  request: Request,
  query: PhotoAlbumQuery,
): Promise<PhotoAlbumListResponse> {
  const pagedAlbumUploadList = await loadPagedAlbumUploadList(token, request, query);
  if (pagedAlbumUploadList) {
    return pagedAlbumUploadList;
  }

  const [snapshot, capabilities] = await Promise.all([
    loadPhotoAlbumSnapshot(token, request, query),
    fetchSafetyPhotoAssetMutationCapabilitiesServer(),
  ]);
  const response = queryPhotoAlbumItems(snapshot.items, query);

  return {
    ...response,
    capabilities: {
      deleteSupported: capabilities.deleteSupported,
      roundUpdateSupported: capabilities.roundUpdateSupported,
    },
  };
}

export async function loadResolvedPhotoAlbumSelection(
  token: string,
  request: Request,
  itemIds: string[],
): Promise<ResolvedPhotoAlbumSelection> {
  if (itemIds.length === 0) {
    return {
      accessibleSites: [],
      items: [],
      reportsBySiteId: new Map(),
    };
  }

  const accessibleSites = await loadAccessibleSites(token, request, {});
  const sitesById = new Map(accessibleSites.map((site) => [site.id, site] as const));
  const legacyItemIds = itemIds.filter((itemId) => itemId.startsWith('legacy:'));
  const albumUploadItemIds = itemIds.filter((itemId) => !itemId.startsWith('legacy:'));

  const [albumUploadItems, reportsBySiteId] = await Promise.all([
    albumUploadItemIds.length === 0
      ? Promise.resolve([] as PhotoAlbumItem[])
      : fetchSafetyPhotoAssetsServer(
          token,
          {
            item_ids: albumUploadItemIds,
            limit: albumUploadItemIds.length,
            offset: 0,
          },
          request,
        ).then((response) =>
          response.rows
            .map((asset) => mapBackendPhotoAsset(asset))
            .map((asset) => buildPhotoAlbumItemFromAsset(asset, sitesById.get(asset.siteId))),
        ),
    fetchReportsBySiteId(token, request, accessibleSites, { legacyItemIds }),
  ]);

  const legacyItems =
    legacyItemIds.length === 0 ? [] : buildLegacyItems(accessibleSites, reportsBySiteId);
  const byId = new Map(
    mergePhotoAlbumItems(albumUploadItems, legacyItems).map((item) => [item.id, item] as const),
  );

  return {
    accessibleSites,
    items: itemIds
      .map((itemId) => byId.get(itemId) || null)
      .filter((item): item is PhotoAlbumItem => Boolean(item)),
    reportsBySiteId,
  };
}

export async function loadPhotoAlbumItemsByIds(
  token: string,
  request: Request,
  itemIds: string[],
): Promise<PhotoAlbumItem[]> {
  const selection = await loadResolvedPhotoAlbumSelection(token, request, itemIds);
  return selection.items;
}
