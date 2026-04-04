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
    const { searchParams } = new URL(request.url);
    const response = await fetchWorkerSchedulesServer(
      token,
      {
        limit: searchParams.get('limit') || '',
        month: searchParams.get('month') || '',
        offset: searchParams.get('offset') || '',
        site_id: searchParams.get('siteId') || '',
        status: searchParams.get('status') || '',
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
