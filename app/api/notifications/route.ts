import { NextResponse } from 'next/server';
import {
  fetchNotificationsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendNotificationFeed } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    return NextResponse.json(
      mapBackendNotificationFeed(await fetchNotificationsServer(token, request)),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 피드를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
