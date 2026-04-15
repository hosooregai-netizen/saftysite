import { NextResponse } from 'next/server';
import {
  fetchAdminHeadquartersListServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAdminHeadquartersListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await fetchAdminHeadquartersListServer(
      token,
      {
      id: url.searchParams.get('id') || '',
      limit: Number(url.searchParams.get('limit') || '30'),
      offset: Number(url.searchParams.get('offset') || '0'),
      query: url.searchParams.get('query') || '',
      sort_by: url.searchParams.get('sort_by') || 'name',
      sort_dir: url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc',
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
