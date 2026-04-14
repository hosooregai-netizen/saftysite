import { NextResponse } from 'next/server';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { buildAdminScheduleCalendarSnapshotResponse } from '@/server/admin/scheduleSnapshot';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const response = await buildAdminScheduleCalendarSnapshotResponse(
      token,
      {
        assigneeUserId: url.searchParams.get('assignee_user_id') || '',
        month: url.searchParams.get('month') || '',
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
      { error: error instanceof Error ? error.message : '관제 캘린더를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
