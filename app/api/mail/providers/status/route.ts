import { NextResponse } from 'next/server';
import {
  fetchMailProviderStatusServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendMailProviderStatus } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { searchParams } = new URL(request.url);
    const response = await fetchMailProviderStatusServer(
      token,
      {
        google_redirect_uri: searchParams.get('googleRedirectUri') || '',
        naver_redirect_uri: searchParams.get('naverRedirectUri') || '',
      },
      request,
    );
    return NextResponse.json({
      rows: response.rows.map((item) => mapBackendMailProviderStatus(item)),
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '메일 공급자 상태를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
