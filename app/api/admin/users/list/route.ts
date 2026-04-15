import { NextResponse } from 'next/server';
import {
  fetchAdminUsersListServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAdminUsersListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await fetchAdminUsersListServer(
      token,
      {
      limit: Number(url.searchParams.get('limit') || '50'),
      offset: Number(url.searchParams.get('offset') || '0'),
      query: url.searchParams.get('query') || '',
      role: url.searchParams.get('role') || '',
      sort_by: url.searchParams.get('sort_by') || 'name',
      sort_dir: url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc',
      status: url.searchParams.get('status') || '',
      },
      request,
    );
    return NextResponse.json(mapBackendAdminUsersListResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사용자 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
