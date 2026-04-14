import { NextResponse } from 'next/server';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { buildAdminScheduleQueueSnapshotResponse } from '@/server/admin/scheduleSnapshot';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await buildAdminScheduleQueueSnapshotResponse(
      token,
      {
        assigneeUserId: url.searchParams.get('assignee_user_id') || '',
        limit: Number(url.searchParams.get('limit') || '50'),
        month: url.searchParams.get('month') || '',
        offset: Number(url.searchParams.get('offset') || '0'),
        query: url.searchParams.get('query') || '',
        siteId: url.searchParams.get('site_id') || '',
        status: url.searchParams.get('status') || '',
      },
      request,
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '미선택 일정 큐를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
