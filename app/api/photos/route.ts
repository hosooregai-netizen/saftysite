import { NextResponse } from 'next/server';

import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { loadPhotoAlbumList } from '@/server/photos/service';
import type { PhotoAlbumSourceFilter } from '@/types/photos';

export const runtime = 'nodejs';

function parseLimit(value: string | null) {
  const parsed = Number(value || '60');
  if (!Number.isFinite(parsed)) return 60;
  return Math.max(1, Math.min(200, Math.trunc(parsed)));
}

function parseOffset(value: string | null) {
  const parsed = Number(value || '0');
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function parseSource(value: string | null): PhotoAlbumSourceFilter {
  if (value === 'album_upload' || value === 'legacy_import') {
    return value;
  }

  return 'all';
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await loadPhotoAlbumList(token, request, {
      headquarterId: (url.searchParams.get('headquarter_id') || '').trim(),
      limit: parseLimit(url.searchParams.get('limit')),
      offset: parseOffset(url.searchParams.get('offset')),
      query: (url.searchParams.get('query') || '').trim(),
      reportKey: (url.searchParams.get('report_key') || '').trim(),
      siteId: (url.searchParams.get('site_id') || '').trim(),
      sortBy:
        (url.searchParams.get('sort_by') || '').trim() === 'fileName' ||
        (url.searchParams.get('sort_by') || '').trim() === 'siteName' ||
        (url.searchParams.get('sort_by') || '').trim() === 'createdAt'
          ? ((url.searchParams.get('sort_by') || '').trim() as 'fileName' | 'siteName' | 'createdAt')
          : 'capturedAt',
      sortDir: (url.searchParams.get('sort_dir') || '').trim() === 'asc' ? 'asc' : 'desc',
      source: parseSource(url.searchParams.get('source')),
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사진첩을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
