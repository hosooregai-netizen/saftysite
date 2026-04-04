import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  startGoogleMailConnectionServer,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(await startGoogleMailConnectionServer(token, payload, request));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '구글 메일 연결을 시작하지 못했습니다.' },
      { status: 500 },
    );
  }
}
