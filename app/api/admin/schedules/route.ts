import { NextResponse } from 'next/server';
import {
  fetchAdminSchedulesServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendScheduleListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(300, Number(url.searchParams.get('limit') || '200')));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
    const month = url.searchParams.get('month') || '';
    const response = await fetchAdminSchedulesServer(
      token,
      {
        assignee_user_id: url.searchParams.get('assignee_user_id') || '',
        limit,
        month,
        offset,
        planned_date: url.searchParams.get('planned_date') || '',
        query: url.searchParams.get('query') || '',
        site_id: url.searchParams.get('site_id') || '',
        status: url.searchParams.get('status') || '',
      },
      request,
    );

    return NextResponse.json(mapBackendScheduleListResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
