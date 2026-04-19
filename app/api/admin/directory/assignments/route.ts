import { NextResponse } from 'next/server';
import {
  fetchAdminAssignmentsPageServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const rows = await fetchAdminAssignmentsPageServer(
      token,
      {
        active_only: url.searchParams.get('active_only') !== 'false',
        limit: Number(url.searchParams.get('limit') || '500'),
        offset: Number(url.searchParams.get('offset') || '0'),
        site_id: url.searchParams.get('site_id') || '',
        user_id: url.searchParams.get('user_id') || '',
      },
      request,
    );
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '배정 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
