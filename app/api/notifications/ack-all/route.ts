import { NextResponse } from 'next/server';
import {
  acknowledgeAllNotificationsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    return NextResponse.json(await acknowledgeAllNotificationsServer(token, request));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 전체 읽음 처리에 실패했습니다.' },
      { status: 500 },
    );
  }
}
