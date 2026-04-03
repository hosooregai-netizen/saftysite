import { NextResponse } from 'next/server';
import {
  generateAdminSchedulesServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendSchedule } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { siteId } = await context.params;
    const response = await generateAdminSchedulesServer(token, siteId, request);
    return NextResponse.json({ rows: response.rows.map((row) => mapBackendSchedule(row)) });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 자동생성에 실패했습니다.' },
      { status: 500 },
    );
  }
}
