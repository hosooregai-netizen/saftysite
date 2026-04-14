import { NextResponse } from 'next/server';
import { readRequiredAdminToken, SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { buildAdminScheduleLookupsSnapshotResponse } from '@/server/admin/scheduleSnapshot';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const response = await buildAdminScheduleLookupsSnapshotResponse(token, request);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '관제 일정 필터 옵션을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
