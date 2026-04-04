'use client';

import { saveBlobAsFile } from '@/lib/api';
import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { TableSortDirection } from '@/types/admin';
import type { PhotoAlbumItem, PhotoAlbumListResponse, PhotoAlbumSourceFilter } from '@/types/photos';

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
  siteId: string;
  thumbnail?: File | null;
}) {
  const headers = createAuthorizedHeaders();
  const body = new FormData();
  body.set('file', input.file, input.file.name);
  body.set('site_id', input.siteId);
  if (input.thumbnail) {
    body.set('thumbnail', input.thumbnail, input.thumbnail.name);
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
  saveBlobAsFile(blob, getDownloadFilenameFromDisposition(response.headers.get('content-disposition')));
}
