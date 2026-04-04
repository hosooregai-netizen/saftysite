import { NextResponse } from 'next/server';
import {
  fetchSmsProviderStatusServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendSmsProviderStatus } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const response = await fetchSmsProviderStatusServer(token, request);
    return NextResponse.json({
      rows: response.rows.map((row) => mapBackendSmsProviderStatus(row)),
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '문자 공급자 상태를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
