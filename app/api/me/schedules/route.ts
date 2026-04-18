import { NextResponse } from 'next/server';
import {
  fetchWorkerSchedulesServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendScheduleListResponse } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const url = new URL(request.url);
    const response = await fetchWorkerSchedulesServer(
      token,
      {
        limit: Math.max(1, Math.min(300, Number(url.searchParams.get('limit') || '200'))),
        month: url.searchParams.get('month') || '',
        offset: Math.max(0, Number(url.searchParams.get('offset') || '0')),
        siteId: url.searchParams.get('siteId') || '',
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
      { error: error instanceof Error ? error.message : '내 일정을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
