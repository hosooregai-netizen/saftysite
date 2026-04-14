import type { ReportDispatchMeta } from '@/types/admin';

export function serializeReportDispatchPayload(dispatch: ReportDispatchMeta) {
  return {
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
  };
}
