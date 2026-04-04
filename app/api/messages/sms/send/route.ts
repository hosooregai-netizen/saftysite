import { NextResponse } from 'next/server';
import {
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
  sendSafetySmsServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendSmsSendResult } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(
      mapBackendSmsSendResult(await sendSafetySmsServer(token, payload, request)),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '문자를 발송하지 못했습니다.' },
      { status: 500 },
    );
  }
}
