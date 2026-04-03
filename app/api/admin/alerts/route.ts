import { NextResponse } from 'next/server';
import {
  fetchAdminAlertsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendAlert } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    return NextResponse.json(
      (await fetchAdminAlertsServer(token, request)).map((item) => mapBackendAlert(item)),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
