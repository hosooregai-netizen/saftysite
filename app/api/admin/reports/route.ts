import { NextResponse } from 'next/server';
import {
  fetchAdminReportsViewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAdminReportsResponse } from '@/server/admin/upstreamMappers';
import type { SafetyAdminReportsResponse } from '@/types/admin';

export const runtime = 'nodejs';

const REPORTS_ROUTE_CACHE_TTL_MS = 1000 * 60;
const reportsRouteCache = new Map<
  string,
  {
    payload: SafetyAdminReportsResponse;
    savedAt: number;
  }
>();

function buildReportsRouteCacheKey(request: Request) {
  const url = new URL(request.url);
  return `${request.headers.get('authorization') || ''}:${url.searchParams.toString()}`;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '100')));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
    const sortBy = url.searchParams.get('sort_by') || 'updatedAt';
    const sortDir = url.searchParams.get('sort_dir') || 'desc';
    const query = (url.searchParams.get('query') || '').trim().toLowerCase();
    const cacheKey = buildReportsRouteCacheKey(request);
    const cached = reportsRouteCache.get(cacheKey);

    if (cached && Date.now() - cached.savedAt < REPORTS_ROUTE_CACHE_TTL_MS) {
      return NextResponse.json(cached.payload);
    }

    const response = await fetchAdminReportsViewServer(
      token,
      {
        assignee_user_id: url.searchParams.get('assignee_user_id') || '',
        date_from: url.searchParams.get('date_from') || '',
        date_to: url.searchParams.get('date_to') || '',
        dispatch_status: url.searchParams.get('dispatch_status') || '',
        headquarter_id: url.searchParams.get('headquarter_id') || '',
        limit,
        offset,
        quality_status: url.searchParams.get('quality_status') || '',
        query,
        report_type: url.searchParams.get('report_type') || '',
        site_id: url.searchParams.get('site_id') || '',
        sort_by: sortBy,
        sort_dir: sortDir,
        status: url.searchParams.get('status') || '',
      },
      request,
    );
    const payload = mapBackendAdminReportsResponse(response);
    reportsRouteCache.set(cacheKey, {
      payload,
      savedAt: Date.now(),
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '보고서 목록을 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
