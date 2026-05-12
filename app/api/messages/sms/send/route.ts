import { NextResponse } from 'next/server';
import {
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
  sendSafetySmsServer,
} from '@/server/admin/safetyApiServer';
import { invalidateAdminOverviewAndReportsRouteCaches } from '@/server/admin/adminRouteInvalidation';
import { mapBackendSmsSendResult } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await sendSafetySmsServer(token, payload, request);
    if (payload.report_key || payload.reportKey) {
      invalidateAdminOverviewAndReportsRouteCaches();
    }
    return NextResponse.json(mapBackendSmsSendResult(result));
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
