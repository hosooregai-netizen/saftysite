import { NextResponse } from 'next/server';
import {
  fetchAdminHeadquartersListServer,
  fetchSafetyHeadquartersServer,
  fetchSafetySitesServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { buildAdminHeadquartersListResponse } from '@/server/admin/adminDirectoryLists';
import { mapBackendAdminHeadquartersListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const headquarterId = url.searchParams.get('id') || '';
    const limit = Number(url.searchParams.get('limit') || '30');
    const offset = Number(url.searchParams.get('offset') || '0');
    const query = url.searchParams.get('query') || '';
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortDir = url.searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc';

    if (!headquarterId) {
      const [headquarters, sites] = await Promise.all([
        fetchSafetyHeadquartersServer(token, request),
        fetchSafetySitesServer(token, request),
      ]);
      return NextResponse.json(
        buildAdminHeadquartersListResponse(
          {
            assignments: [],
            headquarters,
            refreshedAt: new Date().toISOString(),
            sites,
            users: [],
          },
          {
            limit,
            offset,
            query,
            sortBy,
            sortDir,
          },
        ),
      );
    }

    const response = await fetchAdminHeadquartersListServer(
      token,
      {
      id: headquarterId,
      limit,
      offset,
      query,
      sort_by: sortBy,
      sort_dir: sortDir,
      },
      request,
    );
    return NextResponse.json(mapBackendAdminHeadquartersListResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사업장 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
