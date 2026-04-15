import { NextResponse } from 'next/server';
import { buildAdminHeadquartersListResponse } from '@/server/admin/adminDirectoryLists';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const snapshot = await getAdminDirectorySnapshot(token, request);
    const response = buildAdminHeadquartersListResponse(
      {
        ...snapshot.data,
        refreshedAt: snapshot.refreshedAt,
      },
      {
      id: url.searchParams.get('id') || '',
      limit: Number(url.searchParams.get('limit') || '30'),
      offset: Number(url.searchParams.get('offset') || '0'),
      query: url.searchParams.get('query') || '',
      sortBy: url.searchParams.get('sort_by') || 'name',
      sortDir: url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc',
      },
    );
    return NextResponse.json(response);
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
