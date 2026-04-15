import { NextResponse } from 'next/server';
import {
  fetchAdminSitesListServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAdminSitesListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await fetchAdminSitesListServer(
      token,
      {
      assignment: url.searchParams.get('assignment') || '',
      headquarter_id: url.searchParams.get('headquarter_id') || '',
      limit: Number(url.searchParams.get('limit') || '50'),
      offset: Number(url.searchParams.get('offset') || '0'),
      query: url.searchParams.get('query') || '',
      site_id: url.searchParams.get('site_id') || '',
      sort_by: url.searchParams.get('sort_by') || 'last_visit_date',
      sort_dir: url.searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc',
      status: url.searchParams.get('status') || '',
      },
      request,
    );
    return NextResponse.json(mapBackendAdminSitesListResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '현장 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
