import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminReportDispatchServer,
} from '@/server/admin/safetyApiServer';
import type { ReportDispatchMeta } from '@/types/admin';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const dispatch = (await request.json()) as ReportDispatchMeta;
    const updated = await updateAdminReportDispatchServer(
      token,
      reportKey,
      {
        dispatch_status: dispatch.dispatchStatus || null,
        dispatch_method: dispatch.dispatchMethod || null,
        dispatched_at: dispatch.dispatchedAt || null,
        dispatch_checked_by: dispatch.dispatchCheckedBy || null,
        dispatch_checked_at: dispatch.dispatchCheckedAt || null,
        mailbox_account_id: dispatch.mailboxAccountId || null,
        mail_thread_id: dispatch.mailThreadId || null,
        message_id: dispatch.messageId || null,
        recipient: dispatch.recipient || null,
        actual_recipient: dispatch.actualRecipient || null,
        read_at: dispatch.readAt || null,
        reply_at: dispatch.replyAt || null,
        reply_summary: dispatch.replySummary || null,
        sent_history: (dispatch.sentHistory || []).map((item) => ({
          id: item.id,
          memo: item.memo || null,
          sent_at: item.sentAt,
          sent_by_user_id: item.sentByUserId || null,
        })),
      },
      request,
    );
    await refreshAdminAnalyticsSnapshot(token, request);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '발송 정보 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
}
