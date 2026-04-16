import { NextResponse } from 'next/server';
import { buildAdminSitesListResponse } from '@/server/admin/adminDirectoryLists';
import {
  fetchAdminDirectoryData,
  fetchAdminSitesListServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAdminSitesListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

function parseFilters(url: URL) {
  return {
    assignment: url.searchParams.get('assignment') || '',
    headquarterId: url.searchParams.get('headquarter_id') || '',
    limit: Number(url.searchParams.get('limit') || '50'),
    offset: Number(url.searchParams.get('offset') || '0'),
    query: url.searchParams.get('query') || '',
    siteId: url.searchParams.get('site_id') || '',
    sortBy: url.searchParams.get('sort_by') || 'last_visit_date',
    sortDir: url.searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc',
    status: url.searchParams.get('status') || '',
  } as const;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const filters = parseFilters(url);

  try {
    const token = readRequiredAdminToken(request);
    const response = await fetchAdminSitesListServer(
      token,
      {
        assignment: filters.assignment,
        headquarter_id: filters.headquarterId,
        limit: filters.limit,
        offset: filters.offset,
        query: filters.query,
        site_id: filters.siteId,
        sort_by: filters.sortBy,
        sort_dir: filters.sortDir,
        status: filters.status,
      },
      request,
    );
    return NextResponse.json(mapBackendAdminSitesListResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      if (error.status >= 500) {
        try {
          const token = readRequiredAdminToken(request);
          const directoryData = await fetchAdminDirectoryData(token, request);
          return NextResponse.json(
            buildAdminSitesListResponse(
              {
                ...directoryData,
                refreshedAt: new Date().toISOString(),
              },
              filters,
            ),
          );
        } catch {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
      }
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '현장 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
