import { NextResponse } from 'next/server';
import { buildAdminSitesListResponse } from '@/server/admin/adminDirectoryLists';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const snapshot = await getAdminDirectorySnapshot(token, request);
    const response = buildAdminSitesListResponse(
      {
        ...snapshot.data,
        refreshedAt: snapshot.refreshedAt,
      },
      {
      assignment: url.searchParams.get('assignment') || '',
      headquarterId: url.searchParams.get('headquarter_id') || '',
      limit: Number(url.searchParams.get('limit') || '50'),
      offset: Number(url.searchParams.get('offset') || '0'),
      query: url.searchParams.get('query') || '',
      siteId: url.searchParams.get('site_id') || '',
      sortBy: url.searchParams.get('sort_by') || 'last_visit_date',
      sortDir: url.searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc',
      status: url.searchParams.get('status') || '',
      },
    );
    return NextResponse.json(response);
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
