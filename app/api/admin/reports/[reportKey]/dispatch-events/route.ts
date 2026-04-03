import { NextResponse } from 'next/server';
import {
  appendAdminDispatchEventServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import type { ReportDispatchHistoryEntry } from '@/types/admin';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const event = (await request.json()) as ReportDispatchHistoryEntry;
    const updated = await appendAdminDispatchEventServer(
      token,
      reportKey,
      {
        id: event.id,
        memo: event.memo || null,
        sent_at: event.sentAt,
        sent_by_user_id: event.sentByUserId || null,
      },
      request,
    );

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '발송 이력 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
}
