import { NextResponse } from 'next/server';

import {
  deleteSafetyPhotoAssetsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateSafetyPhotoAssetsRoundServer,
} from '@/server/admin/safetyApiServer';
import { loadPhotoAlbumList } from '@/server/photos/service';
import type { PhotoAlbumSourceFilter } from '@/types/photos';

export const runtime = 'nodejs';

function createUnsupportedMutationResponse(action: 'delete' | 'round') {
  const actionLabel = action === 'delete' ? '사진 삭제' : '사진 회차 변경';
  return NextResponse.json(
    {
      error: `현재 연결된 Safety API 서버가 ${actionLabel} 기능을 아직 지원하지 않습니다. 최신 safety-server 배포본에 연결한 뒤 다시 시도해 주세요.`,
    },
    { status: 501 },
  );
}

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

function parseAll(value: string | null) {
  return value === 'true';
}

function parseItemIds(payload: unknown) {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const rawItems = Array.isArray(record.item_ids)
    ? record.item_ids
    : Array.isArray(record.itemIds)
      ? record.itemIds
      : [];
  return rawItems
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
}

function parseRoundNo(payload: unknown) {
  if (!payload || typeof payload !== 'object') return 0;
  const record = payload as Record<string, unknown>;
  const rawValue = record.round_no ?? record.roundNo;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return Math.trunc(rawValue);
  }
  if (typeof rawValue === 'string') {
    return Number.parseInt(rawValue.trim(), 10) || 0;
  }
  return 0;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await loadPhotoAlbumList(token, request, {
      headquarterId: (url.searchParams.get('headquarter_id') || '').trim(),
      all: parseAll(url.searchParams.get('all')),
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

export async function PATCH(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const body = await request.json().catch(() => ({}));
    const response = await updateSafetyPhotoAssetsRoundServer(
      token,
      {
        item_ids: parseItemIds(body),
        round_no: parseRoundNo(body),
      },
      request,
    );

    return NextResponse.json({
      affectedCount: response.affected_count,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      if (error.status === 405) {
        return createUnsupportedMutationResponse('round');
      }
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사진 회차를 변경하지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const body = await request.json().catch(() => ({}));
    const response = await deleteSafetyPhotoAssetsServer(
      token,
      {
        item_ids: parseItemIds(body),
      },
      request,
    );

    return NextResponse.json({
      affectedCount: response.affected_count,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      if (error.status === 405) {
        return createUnsupportedMutationResponse('delete');
      }
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사진을 삭제하지 못했습니다.' },
      { status: 500 },
    );
  }
}
