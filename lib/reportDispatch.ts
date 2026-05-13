import type {
  ReportDispatchHistoryEntry,
  ReportDispatchMeta,
  ReportDispatchMethod,
  ReportDeliveryStatus,
} from '@/types/admin';

const COMPLETED_DISPATCH_STATUSES = new Set(['sent', 'manual_checked']);
const DELIVERY_STATUSES = new Set(['none', 'manual_checked', 'sent', 'failed']);
const DISPATCH_METHODS = new Set(['manual', 'system_email']);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readText(record: Record<string, unknown>, camelKey: string, snakeKey?: string) {
  return normalizeText(record[camelKey]) || normalizeText(snakeKey ? record[snakeKey] : undefined);
}

function normalizeDeliveryStatus(value: unknown): ReportDeliveryStatus {
  const normalized = normalizeText(value);
  return DELIVERY_STATUSES.has(normalized) ? (normalized as ReportDeliveryStatus) : '';
}

function normalizeDispatchMethod(value: unknown): ReportDispatchMethod {
  const normalized = normalizeText(value);
  return DISPATCH_METHODS.has(normalized) ? (normalized as ReportDispatchMethod) : '';
}

function normalizeHistoryItem(value: unknown): ReportDispatchHistoryEntry | null {
  const record = asRecord(value);
  const sentAt = readText(record, 'sentAt', 'sent_at');
  const id = readText(record, 'id') || sentAt;
  if (!id && !sentAt) {
    return null;
  }

  return {
    id,
    memo: readText(record, 'memo'),
    sentAt,
    sentByUserId: readText(record, 'sentByUserId', 'sent_by_user_id'),
  };
}

function normalizeHistory(value: unknown): ReportDispatchHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeHistoryItem(item))
    .filter((item): item is ReportDispatchHistoryEntry => Boolean(item));
}

export function createEmptyReportDispatchMeta(): ReportDispatchMeta {
  return {
    actualRecipient: '',
    dispatchStatus: '',
    dispatchMethod: '',
    dispatchedAt: '',
    dispatchCheckedBy: '',
    dispatchCheckedAt: '',
    mailboxAccountId: '',
    mailThreadId: '',
    messageId: '',
    readAt: '',
    recipient: '',
    replyAt: '',
    replySummary: '',
    sentHistory: [],
  };
}

export function normalizeReportDispatchMeta(
  dispatch: unknown,
): ReportDispatchMeta {
  const record = asRecord(dispatch);
  const base = createEmptyReportDispatchMeta();

  return {
    ...base,
    dispatchStatus: normalizeDeliveryStatus(readText(record, 'dispatchStatus', 'dispatch_status')),
    dispatchMethod: normalizeDispatchMethod(readText(record, 'dispatchMethod', 'dispatch_method')),
    dispatchedAt:
      readText(record, 'dispatchedAt', 'dispatched_at') ||
      readText(record, 'actualSentAt', 'actual_sent_at'),
    dispatchCheckedBy: readText(record, 'dispatchCheckedBy', 'dispatch_checked_by'),
    dispatchCheckedAt:
      readText(record, 'dispatchCheckedAt', 'dispatch_checked_at') ||
      readText(record, 'sentCompletedAt', 'sent_completed_at'),
    sentHistory: normalizeHistory(record.sentHistory ?? record.sent_history),
    mailboxAccountId: readText(record, 'mailboxAccountId', 'mailbox_account_id'),
    mailThreadId: readText(record, 'mailThreadId', 'mail_thread_id'),
    messageId: readText(record, 'messageId', 'message_id'),
    recipient: readText(record, 'recipient'),
    actualRecipient: readText(record, 'actualRecipient', 'actual_recipient'),
    readAt: readText(record, 'readAt', 'read_at'),
    replyAt: readText(record, 'replyAt', 'reply_at'),
    replySummary: readText(record, 'replySummary', 'reply_summary'),
  };
}

export function isReportDispatchCompleted(
  dispatch: unknown,
) {
  const status = normalizeReportDispatchMeta(dispatch).dispatchStatus;
  return COMPLETED_DISPATCH_STATUSES.has(status);
}

export function buildToggledReportDispatch(
  currentDispatch: unknown,
  options: {
    currentUserId: string;
    nextCompleted: boolean;
    historyMemo?: string;
    now?: string;
  },
): ReportDispatchMeta {
  const base = normalizeReportDispatchMeta(currentDispatch);
  const now = options.now || new Date().toISOString();
  const nextHistory = [
    ...base.sentHistory,
    {
      id: `manual-dispatch-${now}`,
      memo:
        options.historyMemo ||
        (options.nextCompleted ? '발송으로 변경' : '미발송으로 변경'),
      sentAt: now,
      sentByUserId: options.currentUserId,
    },
  ];

  if (options.nextCompleted) {
    return {
      ...base,
      dispatchStatus: 'manual_checked',
      dispatchMethod: 'manual',
      dispatchCheckedBy: options.currentUserId,
      dispatchCheckedAt: now,
      sentHistory: nextHistory,
    };
  }

  return {
    ...base,
    dispatchStatus: 'none',
    dispatchCheckedBy: '',
    dispatchCheckedAt: '',
    sentHistory: nextHistory,
  };
}
