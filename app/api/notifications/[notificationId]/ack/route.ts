import { NextResponse } from 'next/server';
import {
  acknowledgeNotificationServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { notificationId } = await context.params;
    return NextResponse.json(
      await acknowledgeNotificationServer(token, notificationId, request),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.' },
      { status: 500 },
    );
  }
}
