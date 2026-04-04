import { NextResponse } from 'next/server';
import {
  completeGoogleMailConnectionServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailAccount } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(
      mapBackendMailAccount(await completeGoogleMailConnectionServer(token, payload, request)),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '구글 메일 연결을 완료하지 못했습니다.' },
      { status: 500 },
    );
  }
}
