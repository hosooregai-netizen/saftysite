import 'server-only';

import { normalizeInspectionSession } from '@/constants/inspectionSession/normalizeSession';
import {
  buildSiteMemoWithPhotoAssets,
  parseSitePhotoAssets,
} from '@/lib/admin/siteContractProfile';
import { normalizeControllerReportType } from '@/lib/admin/reportMeta';
import {
  buildSafetyAssetUrl,
  normalizeSafetyAssetUrl,
} from '@/lib/safetyApi/assetUrls';
import { asMapperRecord } from '@/lib/safetyApiMappers/utils';
import type { SafetyReport, SafetySite, SafetyUser } from '@/types/backend';
import type {
  PhotoAlbumItem,
  PhotoAlbumListResponse,
  PhotoAlbumSourceFilter,
  SafetyPhotoAsset,
} from '@/types/photos';

const DOWNLOAD_ROUTE_PREFIX = '/api/photos/download?item_id=';
const MAX_DOWNLOAD_ITEMS = 200;

export interface PhotoAlbumQuery {
  all?: boolean;
  headquarterId?: string;
  limit?: number;
  offset?: number;
  query?: string;
  reportKey?: string;
  siteId?: string;
  sortBy?: 'capturedAt' | 'createdAt' | 'fileName' | 'siteName';
  sortDir?: 'asc' | 'desc';
  source?: PhotoAlbumSourceFilter;
}

interface AlbumAccessContext {
  accessibleSites: SafetySite[];
  currentUser: SafetyUser;
  isAdmin: boolean;
}

export interface ResolvedPhotoBinary {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function toPhotoDownloadUrl(itemId: string) {
  return `${DOWNLOAD_ROUTE_PREFIX}${encodeURIComponent(itemId)}`;
}

function sanitizeFileName(value: string, fallback: string) {
  const normalized = value.replace(/[\\/:*?"<>|]+/g, '-').trim();
  return normalized || fallback;
}

function slugifySegment(value: string, fallback: string) {
  const normalized = value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]+/g, '-');
  return normalized || fallback;
}

function getSiteName(site: SafetySite) {
  return normalizeText(site.site_name) || '현장';
}

function getHeadquarterName(site: SafetySite) {
  return (
    normalizeText(site.headquarter_detail?.name) ||
    normalizeText(site.headquarter?.name) ||
    '사업장'
  );
}

function isImageLikeSource(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (/^data:image\//i.test(normalized)) return true;
  if (/^blob:/i.test(normalized)) return false;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('/uploads/')) {
    if (/\.(pdf|docx?|xlsx?|pptx?|zip|hwpx)(?:$|[?#])/i.test(normalized)) {
      return false;
    }
    return true;
  }
  return /\.(png|jpe?g|gif|bmp|webp|heic|heif)(?:$|[?#])/i.test(normalized);
}

function inferContentType(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized.startsWith('data:image/')) {
    return normalized.slice(5, normalized.indexOf(';')) || 'image/jpeg';
  }
  if (normalized.includes('.png')) return 'image/png';
  if (normalized.includes('.webp')) return 'image/webp';
  if (normalized.includes('.gif')) return 'image/gif';
  if (normalized.includes('.bmp')) return 'image/bmp';
  return 'image/jpeg';
}

function inferLegacyFileName(
  reportTitle: string,
  siteName: string,
  documentKey: string,
  slotKey: string,
  source: string,
) {
  const matchedName = normalizeText(source).match(/\/([^/?#]+)(?:[?#].*)?$/);
  const fallbackBase = sanitizeFileName(
    `${siteName}-${reportTitle}-${documentKey}-${slotKey}`,
    'photo',
  );
  return matchedName?.[1]
    ? sanitizeFileName(decodeURIComponent(matchedName[1]), `${fallbackBase}.jpg`)
    : `${fallbackBase}.${inferContentType(source).split('/')[1] || 'jpg'}`;
}

function buildAlbumUploadItem(asset: SafetyPhotoAsset, site: SafetySite): PhotoAlbumItem {
  return {
    capturedAt: asset.capturedAt,
    contentType: asset.contentType,
    createdAt: asset.createdAt,
    downloadUrl: toPhotoDownloadUrl(asset.id),
    fileName: asset.fileName,
    gpsLatitude: asset.gpsLatitude,
    gpsLongitude: asset.gpsLongitude,
    headquarterId: asset.headquarterId,
    headquarterName: getHeadquarterName(site),
    id: asset.id,
    previewUrl: normalizeSafetyAssetUrl(asset.thumbnailPath || asset.originalPath),
    siteId: asset.siteId,
    siteName: getSiteName(site),
    sizeBytes: asset.sizeBytes,
    sourceDocumentKey: '',
    sourceKind: 'album_upload',
    sourceReportKey: '',
    sourceReportTitle: '',
    sourceSlotKey: '',
    uploadedByName: asset.uploadedByName,
    uploadedByUserId: asset.uploadedByUserId,
  };
}

function buildLegacyItem(input: {
  createdAt: string;
  fileName: string;
  reportKey: string;
  reportTitle: string;
  site: SafetySite;
  slotKey: string;
  source: string;
  uploadedByName: string;
  documentKey: string;
}): PhotoAlbumItem {
  const id = `legacy:${input.reportKey}:${input.documentKey}:${input.slotKey}`;
  return {
    capturedAt: '',
    contentType: inferContentType(input.source),
    createdAt: input.createdAt,
    downloadUrl: toPhotoDownloadUrl(id),
    fileName: input.fileName,
    gpsLatitude: null,
    gpsLongitude: null,
    headquarterId: input.site.headquarter_id,
    headquarterName: getHeadquarterName(input.site),
    id,
    previewUrl: normalizeSafetyAssetUrl(input.source),
    siteId: input.site.id,
    siteName: getSiteName(input.site),
    sizeBytes: 0,
    sourceDocumentKey: input.documentKey,
    sourceKind: 'legacy_import',
    sourceReportKey: input.reportKey,
    sourceReportTitle: input.reportTitle,
    sourceSlotKey: input.slotKey,
    uploadedByName: input.uploadedByName,
    uploadedByUserId: '',
  };
}

function buildDoc3Items(report: SafetyReport, site: SafetySite) {
  const session = normalizeInspectionSession(report.payload);
  return session.document3Scenes
    .map((item, index) => {
      const source = normalizeText(item.photoUrl);
      if (!isImageLikeSource(source)) return null;
      const slotKey = `scene-${index + 1}`;
      const reportTitle = normalizeText(report.report_title) || normalizeText(session.meta.reportTitle) || '지도보고서';
      return buildLegacyItem({
        createdAt: report.updated_at,
        documentKey: 'doc3',
        fileName: inferLegacyFileName(reportTitle, getSiteName(site), 'doc3', slotKey, source),
        reportKey: report.report_key,
        reportTitle,
        site,
        slotKey,
        source,
        uploadedByName: normalizeText(session.meta.drafter),
      });
    })
    .filter((item): item is PhotoAlbumItem => Boolean(item));
}

function buildDoc4Items(report: SafetyReport, site: SafetySite) {
  const session = normalizeInspectionSession(report.payload);
  const reportTitle = normalizeText(report.report_title) || normalizeText(session.meta.reportTitle) || '지도보고서';

  return session.document4FollowUps.flatMap((item, index) => {
    const pairs: Array<[string, string]> = [
      ['before', normalizeText(item.beforePhotoUrl)],
      ['after', normalizeText(item.afterPhotoUrl)],
    ];

    return pairs
      .map(([kind, source]) => {
        if (!isImageLikeSource(source)) return null;
        const slotKey = `${kind}-${index + 1}`;
        return buildLegacyItem({
          createdAt: report.updated_at,
          documentKey: 'doc4',
          fileName: inferLegacyFileName(reportTitle, getSiteName(site), 'doc4', slotKey, source),
          reportKey: report.report_key,
          reportTitle,
          site,
          slotKey,
          source,
          uploadedByName: normalizeText(session.meta.drafter),
        });
      })
      .filter((legacyItem): legacyItem is PhotoAlbumItem => Boolean(legacyItem));
  });
}

function buildDoc7Items(report: SafetyReport, site: SafetySite) {
  const session = normalizeInspectionSession(report.payload);
  const reportTitle = normalizeText(report.report_title) || normalizeText(session.meta.reportTitle) || '지도보고서';

  return session.document7Findings.flatMap((item, index) => {
    const pairs: Array<[string, string]> = [
      ['photo-1', normalizeText(item.photoUrl)],
      ['photo-2', normalizeText(item.photoUrl2)],
    ];

    return pairs
      .map(([slotKey, source]) => {
        if (!isImageLikeSource(source)) return null;
        return buildLegacyItem({
          createdAt: report.updated_at,
          documentKey: 'doc7',
          fileName: inferLegacyFileName(reportTitle, getSiteName(site), 'doc7', `${slotKey}-${index + 1}`, source),
          reportKey: report.report_key,
          reportTitle,
          site,
          slotKey: `${slotKey}-${index + 1}`,
          source,
          uploadedByName: normalizeText(session.meta.drafter),
        });
      })
      .filter((legacyItem): legacyItem is PhotoAlbumItem => Boolean(legacyItem));
  });
}

function buildDoc10Items(report: SafetyReport, site: SafetySite) {
  const session = normalizeInspectionSession(report.payload);
  const reportTitle = normalizeText(report.report_title) || normalizeText(session.meta.reportTitle) || '지도보고서';

  return session.document10Measurements
    .map((item, index) => {
      const source = normalizeText(item.photoUrl);
      if (!isImageLikeSource(source)) return null;
      const slotKey = `measurement-${index + 1}`;
      return buildLegacyItem({
        createdAt: report.updated_at,
        documentKey: 'doc10',
        fileName: inferLegacyFileName(reportTitle, getSiteName(site), 'doc10', slotKey, source),
        reportKey: report.report_key,
        reportTitle,
        site,
        slotKey,
        source,
        uploadedByName: normalizeText(session.meta.drafter),
      });
    })
    .filter((item): item is PhotoAlbumItem => Boolean(item));
}

function buildDoc11Items(report: SafetyReport, site: SafetySite) {
  const session = normalizeInspectionSession(report.payload);
  const reportTitle = normalizeText(report.report_title) || normalizeText(session.meta.reportTitle) || '지도보고서';

  return session.document11EducationRecords
    .map((item, index) => {
      const source = normalizeText(item.photoUrl);
      if (!isImageLikeSource(source)) return null;
      const slotKey = `education-photo-${index + 1}`;
      return buildLegacyItem({
        createdAt: report.updated_at,
        documentKey: 'doc11',
        fileName: inferLegacyFileName(reportTitle, getSiteName(site), 'doc11', slotKey, source),
        reportKey: report.report_key,
        reportTitle,
        site,
        slotKey,
        source,
        uploadedByName: normalizeText(session.meta.drafter),
      });
    })
    .filter((item): item is PhotoAlbumItem => Boolean(item));
}

function buildDoc12Items(report: SafetyReport, site: SafetySite) {
  const session = normalizeInspectionSession(report.payload);
  const reportTitle = normalizeText(report.report_title) || normalizeText(session.meta.reportTitle) || '지도보고서';

  return session.document12Activities.flatMap((item, index) => {
    const pairs: Array<[string, string]> = [
      ['activity-photo-1', normalizeText(item.photoUrl)],
      ['activity-photo-2', normalizeText(item.photoUrl2)],
    ];

    return pairs
      .map(([slotKey, source]) => {
        if (!isImageLikeSource(source)) return null;
        return buildLegacyItem({
          createdAt: report.updated_at,
          documentKey: 'doc12',
          fileName: inferLegacyFileName(reportTitle, getSiteName(site), 'doc12', `${slotKey}-${index + 1}`, source),
          reportKey: report.report_key,
          reportTitle,
          site,
          slotKey: `${slotKey}-${index + 1}`,
          source,
          uploadedByName: normalizeText(session.meta.drafter),
        });
      })
      .filter((legacyItem): legacyItem is PhotoAlbumItem => Boolean(legacyItem));
  });
}

export function buildLegacyPhotoAlbumItemsForReport(
  report: SafetyReport,
  site: SafetySite,
): PhotoAlbumItem[] {
  const meta = asMapperRecord(report.meta);
  const reportType = normalizeControllerReportType(report.report_type || meta.reportKind);
  if (reportType !== 'technical_guidance') {
    return [];
  }

  return [
    ...buildDoc3Items(report, site),
    ...buildDoc4Items(report, site),
    ...buildDoc7Items(report, site),
    ...buildDoc10Items(report, site),
    ...buildDoc11Items(report, site),
    ...buildDoc12Items(report, site),
  ];
}

export function buildPhotoAlbumItemsFromSites(
  sites: SafetySite[],
): PhotoAlbumItem[] {
  return sites.flatMap((site) =>
    parseSitePhotoAssets(site).map((asset) => buildAlbumUploadItem(asset, site)),
  );
}

export function buildLegacyPhotoAlbumItemsFromReports(
  site: SafetySite,
  reports: SafetyReport[],
): PhotoAlbumItem[] {
  return reports.flatMap((report) => buildLegacyPhotoAlbumItemsForReport(report, site));
}

export function queryPhotoAlbumItems(
  items: PhotoAlbumItem[],
  query: PhotoAlbumQuery,
): PhotoAlbumListResponse {
  const normalizedQuery = normalizeText(query.query).toLowerCase();
  const sortBy = query.sortBy || 'capturedAt';
  const sortDir = query.sortDir === 'asc' ? 1 : -1;
  const filtered = items
    .filter((item) => {
      if (query.siteId && item.siteId !== query.siteId) return false;
      if (query.headquarterId && item.headquarterId !== query.headquarterId) return false;
      if (query.source && query.source !== 'all' && item.sourceKind !== query.source) return false;
      if (query.reportKey && item.sourceReportKey && item.sourceReportKey !== query.reportKey) {
        return false;
      }
      if (!normalizedQuery) return true;

      return [
        item.fileName,
        item.siteName,
        item.headquarterName,
        item.sourceReportKey,
        item.sourceReportTitle,
        item.uploadedByName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => {
      if (sortBy === 'fileName') {
        return left.fileName.localeCompare(right.fileName, 'ko') * sortDir;
      }

      if (sortBy === 'siteName') {
        return (
          left.siteName.localeCompare(right.siteName, 'ko') * sortDir ||
          left.createdAt.localeCompare(right.createdAt) * sortDir
        );
      }

      const leftDate = sortBy === 'createdAt' ? left.createdAt : left.capturedAt || left.createdAt;
      const rightDate = sortBy === 'createdAt' ? right.createdAt : right.capturedAt || right.createdAt;

      return (
        leftDate.localeCompare(rightDate) * sortDir ||
        left.createdAt.localeCompare(right.createdAt) * sortDir ||
        left.fileName.localeCompare(right.fileName, 'ko')
      );
    });

  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.max(1, Math.min(200, query.limit ?? 60));

  return {
    limit,
    offset,
    rows: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export function getPhotoAlbumItemById(
  items: PhotoAlbumItem[],
  itemId: string,
) {
  return items.find((item) => item.id === itemId) ?? null;
}

export function assertDownloadItemLimit(itemIds: string[]) {
  if (itemIds.length === 0) {
    throw new Error('다운로드할 사진을 선택해 주세요.');
  }

  if (itemIds.length > MAX_DOWNLOAD_ITEMS) {
    throw new Error(`한 번에 ${MAX_DOWNLOAD_ITEMS}건까지만 다운로드할 수 있습니다.`);
  }
}

function decodeDataUrl(source: string): ResolvedPhotoBinary {
  const matched = source.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i);
  if (!matched) {
    throw new Error('지원하지 않는 data URL 형식입니다.');
  }

  const contentType = matched[1] || 'application/octet-stream';
  return {
    buffer: Buffer.from(matched[2], 'base64'),
    contentType,
    fileName: `photo.${contentType.split('/')[1] || 'bin'}`,
  };
}

async function fetchRemoteBinary(url: string, fallbackFileName: string): Promise<ResolvedPhotoBinary> {
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`사진 파일을 가져오지 못했습니다. (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || inferContentType(url);
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    fileName: fallbackFileName,
  };
}

function resolveAlbumAssetById(
  accessibleSites: SafetySite[],
  itemId: string,
) {
  for (const site of accessibleSites) {
    const asset = parseSitePhotoAssets(site).find((candidate) => candidate.id === itemId);
    if (asset) {
      return { asset, site };
    }
  }

  return null;
}

export function findAccessibleSite(
  accessibleSites: SafetySite[],
  siteId: string,
) {
  return accessibleSites.find((site) => site.id === siteId) ?? null;
}

export function buildPhotoAssetsForSiteMemo(
  site: SafetySite,
  nextAsset: SafetyPhotoAsset,
) {
  const currentAssets = parseSitePhotoAssets(site);
  return buildSiteMemoWithPhotoAssets(site, [nextAsset, ...currentAssets]);
}

export async function resolvePhotoAlbumItemBinary(
  item: PhotoAlbumItem,
  accessibleSites: SafetySite[],
  reportsBySiteId: Map<string, SafetyReport[]>,
): Promise<ResolvedPhotoBinary> {
  if (item.sourceKind === 'album_upload') {
    const resolved = resolveAlbumAssetById(accessibleSites, item.id);
    if (!resolved) {
      throw new Error('다운로드할 사진 자산을 찾지 못했습니다.');
    }

    return fetchRemoteBinary(
      buildSafetyAssetUrl(resolved.asset.originalPath),
      sanitizeFileName(resolved.asset.fileName, 'photo.jpg'),
    );
  }

  const siteReports = reportsBySiteId.get(item.siteId) ?? [];
  const report = siteReports.find((candidate) => candidate.report_key === item.sourceReportKey);
  if (!report) {
    throw new Error('원본 보고서를 찾지 못했습니다.');
  }

  const legacyItem = buildLegacyPhotoAlbumItemsForReport(
    report,
    accessibleSites.find((site) => site.id === item.siteId) ?? {
      ...accessibleSites[0],
      id: item.siteId,
      headquarter_id: item.headquarterId,
      site_name: item.siteName,
    },
  ).find((candidate) => candidate.id === item.id);

  if (!legacyItem) {
    throw new Error('원본 사진을 찾지 못했습니다.');
  }

  if (legacyItem.previewUrl.startsWith('data:image/')) {
    const binary = decodeDataUrl(legacyItem.previewUrl);
    return {
      ...binary,
      fileName: sanitizeFileName(item.fileName, binary.fileName),
    };
  }

  return fetchRemoteBinary(
    buildSafetyAssetUrl(legacyItem.previewUrl),
    sanitizeFileName(item.fileName, 'legacy-photo.jpg'),
  );
}

export function buildDownloadZipEntryName(item: PhotoAlbumItem) {
  const siteSegment = slugifySegment(item.siteName, 'site');
  const reportSegment = item.sourceReportTitle
    ? slugifySegment(item.sourceReportTitle, 'report')
    : item.sourceKind;
  return `${siteSegment}/${reportSegment}/${sanitizeFileName(item.fileName, `${item.id}.jpg`)}`;
}

export function filterAccessibleSites(
  sites: SafetySite[],
  query: Pick<PhotoAlbumQuery, 'headquarterId' | 'siteId'>,
) {
  return sites.filter((site) => {
    if (query.siteId && site.id !== query.siteId) return false;
    if (query.headquarterId && site.headquarter_id !== query.headquarterId) return false;
    return true;
  });
}

export function isAdminPhotoViewer(user: Pick<SafetyUser, 'role'>) {
  return user.role === 'super_admin' || user.role === 'admin' || user.role === 'controller';
}

export function mergePhotoAlbumItems(
  albumItems: PhotoAlbumItem[],
  legacyItems: PhotoAlbumItem[],
) {
  return [...albumItems, ...legacyItems];
}

export type { AlbumAccessContext };
