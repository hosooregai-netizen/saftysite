'use client';

import { saveBlobAsFile } from '@/lib/api';
import { resolveSafetyAssetUrl } from '@/lib/safetyApi/assetUrls';
import { getSafetyApiBaseUrl } from '@/lib/safetyApi/config';
import { buildPublicSafetyApiUpstreamUrl } from '@/lib/safetyApi/upstream';
import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { TableSortDirection } from '@/types/admin';
import type { SafetyBackendPhotoAsset } from '@/types/backend';
import type {
  PhotoAlbumItem,
  PhotoAlbumListResponse,
  PhotoAlbumMutationResponse,
  PhotoAlbumSourceFilter,
} from '@/types/photos';

const MAX_PHOTO_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_PHOTO_PROXY_FILE_BYTES = Math.floor(4.5 * 1024 * 1024);
const PHOTO_UPLOAD_TIMEOUT_MS = 45000;

function buildQueryString(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  } catch {
    // ignore
  }

  return response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

function getDownloadFilenameFromDisposition(header: string | null) {
  if (!header) return 'download.bin';

  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      // fall through
    }
  }

  const basicMatch = header.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1]?.trim() || 'download.bin';
}

function ensurePhotoDownloadFilename(filename: string, contentType: string | null) {
  const normalizedName = filename.trim() || 'photo';
  if (/\.[A-Za-z0-9]{2,8}$/.test(normalizedName)) {
    return normalizedName;
  }

  const normalizedType = (contentType || '').split(';', 1)[0]?.trim().toLowerCase();
  const extension =
    normalizedType === 'image/jpeg'
      ? '.jpg'
      : normalizedType === 'image/png'
        ? '.png'
        : normalizedType === 'image/webp'
          ? '.webp'
          : normalizedType === 'image/gif'
            ? '.gif'
            : normalizedType === 'image/heic'
              ? '.heic'
              : normalizedType === 'application/zip'
                ? '.zip'
                : '';

  return extension ? `${normalizedName}${extension}` : normalizedName;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeFileName(value: string, fallback: string) {
  const normalized = value.replace(/[\\/:*?"<>|]+/g, '-').trim();
  return normalized || fallback;
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|bmp|webp|heic|heif)$/i.test(file.name);
}

function getDirectPhotoAssetUploadUrl(): string | null {
  return buildPublicSafetyApiUpstreamUrl('/photo-assets/upload');
}

function usesPhotoProxyUpload() {
  if (getDirectPhotoAssetUploadUrl()) {
    return false;
  }

  return getSafetyApiBaseUrl().startsWith('/');
}

function validatePhotoUploadInput(input: {
  file: File;
  thumbnail?: File | null;
}) {
  if (!input.file.name) {
    return '업로드할 사진 파일이 없습니다.';
  }

  if (!isImageFile(input.file)) {
    return '이미지 파일만 업로드할 수 있습니다.';
  }

  if (input.file.size <= 0 || input.file.size > MAX_PHOTO_UPLOAD_BYTES) {
    return '50MB 이하의 사진 파일만 업로드할 수 있습니다.';
  }

  if (
    input.thumbnail instanceof File &&
    input.thumbnail.size > MAX_PHOTO_UPLOAD_BYTES
  ) {
    return '썸네일 파일 크기가 너무 큽니다.';
  }

  const uploadBytes =
    input.file.size + (input.thumbnail instanceof File ? input.thumbnail.size : 0);
  if (usesPhotoProxyUpload() && uploadBytes > MAX_PHOTO_PROXY_FILE_BYTES) {
    return '4.5MB를 초과하는 사진은 현재 Vercel 프록시 업로드 경로로는 저장할 수 없습니다. 직접 업로드 origin 설정을 확인해 주세요.';
  }

  return null;
}

function mapUploadedPhotoAsset(asset: SafetyBackendPhotoAsset): PhotoAlbumItem {
  const sourceKind = normalizeText(asset.source_kind) === 'legacy_import'
    ? 'legacy_import'
    : 'album_upload';

  return {
    capturedAt: normalizeText(asset.captured_at),
    contentType: normalizeText(asset.content_type),
    createdAt: normalizeText(asset.created_at),
    downloadUrl: `/api/photos/download?item_id=${encodeURIComponent(normalizeText(asset.id))}`,
    fileName: normalizeText(asset.file_name),
    gpsLatitude:
      typeof asset.gps_latitude === 'number' && Number.isFinite(asset.gps_latitude)
        ? asset.gps_latitude
        : null,
    gpsLongitude:
      typeof asset.gps_longitude === 'number' && Number.isFinite(asset.gps_longitude)
        ? asset.gps_longitude
        : null,
    headquarterId: normalizeText(asset.headquarter_id),
    headquarterName: normalizeText(asset.headquarter_name),
    id: normalizeText(asset.id),
    previewUrl: resolveSafetyAssetUrl(
      normalizeText(asset.thumbnail_path || asset.original_path),
    ),
    roundNo: typeof asset.round_no === 'number' ? asset.round_no : 0,
    siteId: normalizeText(asset.site_id),
    siteName: normalizeText(asset.site_name),
    sizeBytes: typeof asset.size_bytes === 'number' ? asset.size_bytes : 0,
    sourceDocumentKey: normalizeText(asset.source_document_key),
    sourceKind,
    sourceReportKey: normalizeText(asset.source_report_key),
    sourceReportTitle: normalizeText(asset.source_report_title),
    sourceSlotKey: normalizeText(asset.source_slot_key),
    uploadedByName: normalizeText(asset.uploaded_by_name),
    uploadedByUserId: normalizeText(asset.uploaded_by_user_id),
  };
}

async function invalidatePhotoAlbumRouteCacheClient(headers: Headers) {
  try {
    await fetch('/api/photos/cache', {
      cache: 'no-store',
      headers,
      method: 'POST',
    });
  } catch {
    // Ignore cache-invalidation failures after a successful direct upload.
  }
}

async function uploadPhotoAlbumAssetDirect(
  headers: Headers,
  input: {
    file: File;
    roundNo: number;
    siteId: string;
    thumbnail?: File | null;
  },
) {
  const uploadUrl = getDirectPhotoAssetUploadUrl();
  if (!uploadUrl) {
    throw new Error('직접 업로드용 사진 API 주소를 확인하지 못했습니다.');
  }

  const body = new FormData();
  body.set(
    'file',
    input.file,
    sanitizeFileName(input.file.name || 'photo-original.jpg', 'photo-original.jpg'),
  );
  body.set('round_no', String(input.roundNo));
  body.set('site_id', input.siteId);
  if (input.thumbnail instanceof File && input.thumbnail.size > 0) {
    body.set(
      'thumbnail',
      input.thumbnail,
      sanitizeFileName(
        input.thumbnail.name || 'photo-thumbnail.jpg',
        'photo-thumbnail.jpg',
      ),
    );
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`사진 업로드가 ${PHOTO_UPLOAD_TIMEOUT_MS}ms 안에 완료되지 않았습니다.`),
    );
  }, PHOTO_UPLOAD_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(uploadUrl, {
      body,
      cache: 'no-store',
      headers,
      method: 'POST',
      signal: abortController.signal,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `사진 업로드 중 네트워크 오류가 발생했습니다. ${error.message}`
        : '사진 업로드 중 Safety API 서버에 연결하지 못했습니다.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  const payload = (await response.json()) as SafetyBackendPhotoAsset;
  const item = mapUploadedPhotoAsset(payload);
  void invalidatePhotoAlbumRouteCacheClient(headers);
  return item;
}

function createAuthorizedHeaders(options?: { json?: boolean }) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  if (options?.json) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export async function fetchPhotoAlbum(input: {
  all?: boolean;
  headquarterId?: string;
  limit?: number;
  offset?: number;
  query?: string;
  reportKey?: string;
  siteId?: string;
  sortBy?: 'capturedAt' | 'createdAt' | 'fileName' | 'siteName';
  sortDir?: TableSortDirection;
  source?: PhotoAlbumSourceFilter;
}) {
  const headers = createAuthorizedHeaders();
  const response = await fetch(
    `/api/photos${buildQueryString({
      all: input.all ? 'true' : '',
      headquarter_id: input.headquarterId,
      limit: input.limit,
      offset: input.offset,
      query: input.query,
      report_key: input.reportKey,
      site_id: input.siteId,
      sort_by: input.sortBy,
      sort_dir: input.sortDir,
      source: input.source,
    })}`,
    {
      cache: 'no-store',
      headers,
    },
  );

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PhotoAlbumListResponse;
}

export async function uploadPhotoAlbumAsset(input: {
  file: File;
  roundNo: number;
  siteId: string;
  thumbnail?: File | null;
}) {
  const validationMessage = validatePhotoUploadInput(input);
  if (validationMessage) {
    throw new SafetyApiError(validationMessage, 400);
  }

  const headers = createAuthorizedHeaders();
  const directUploadUrl = getDirectPhotoAssetUploadUrl();
  if (directUploadUrl) {
    return uploadPhotoAlbumAssetDirect(headers, input);
  }

  const body = new FormData();
  body.set(
    'file',
    input.file,
    sanitizeFileName(input.file.name || 'photo-original.jpg', 'photo-original.jpg'),
  );
  body.set('round_no', String(input.roundNo));
  body.set('site_id', input.siteId);
  if (input.thumbnail instanceof File && input.thumbnail.size > 0) {
    body.set(
      'thumbnail',
      input.thumbnail,
      sanitizeFileName(
        input.thumbnail.name || 'photo-thumbnail.jpg',
        'photo-thumbnail.jpg',
      ),
    );
  }

  const response = await fetch('/api/photos/upload', {
    body,
    headers,
    method: 'POST',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  const payload = (await response.json()) as { item?: PhotoAlbumItem | null };
  if (!payload.item) {
    throw new Error('업로드 결과 사진 정보를 확인하지 못했습니다.');
  }

  return payload.item;
}

export async function downloadPhotoAlbumSelection(itemIds: string[]) {
  const headers = createAuthorizedHeaders({ json: true });
  const response = await fetch('/api/photos/download', {
    body: JSON.stringify({ item_ids: itemIds }),
    headers,
    method: 'POST',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  const blob = await response.blob();
  saveBlobAsFile(
    blob,
    ensurePhotoDownloadFilename(
      getDownloadFilenameFromDisposition(response.headers.get('content-disposition')),
      response.headers.get('content-type'),
    ),
  );
}

export async function updatePhotoAlbumRounds(itemIds: string[], roundNo: number) {
  const headers = createAuthorizedHeaders({ json: true });
  const response = await fetch('/api/photos', {
    body: JSON.stringify({ item_ids: itemIds, round_no: roundNo }),
    headers,
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PhotoAlbumMutationResponse;
}

export async function deletePhotoAlbumSelection(itemIds: string[]) {
  const headers = createAuthorizedHeaders({ json: true });
  const response = await fetch('/api/photos', {
    body: JSON.stringify({ item_ids: itemIds }),
    headers,
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PhotoAlbumMutationResponse;
}
