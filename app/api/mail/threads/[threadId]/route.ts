import { NextResponse } from 'next/server';
import {
  fetchSafetyMailThreadDetailServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailThreadDetail } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { threadId } = await context.params;
    return NextResponse.json(
      mapBackendMailThreadDetail(await fetchSafetyMailThreadDetailServer(token, threadId, request)),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 스레드 상세를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
