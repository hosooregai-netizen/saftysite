import { NextResponse } from 'next/server';
import {
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
  updateWorkerScheduleServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendSchedule } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { scheduleId } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const response = await updateWorkerScheduleServer(
      token,
      decodeURIComponent(scheduleId),
      payload,
      request,
    );
    return NextResponse.json(mapBackendSchedule(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정을 저장하지 못했습니다.' },
      { status: 500 },
    );
  }
}
