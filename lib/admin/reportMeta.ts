import {
  QUARTERLY_SUMMARY_REPORT_KIND,
  TECHNICAL_GUIDANCE_REPORT_KIND,
} from '@/lib/erpReports/shared';
import { asMapperRecord, normalizeMapperText } from '@/lib/safetyApiMappers/utils';
import type {
  ControllerQualityStatus,
  ControllerReportType,
  ReportControllerReview,
  ReportDeliveryStatus,
  ReportDispatchHistoryEntry,
  ReportDispatchMeta,
  ReportDispatchMethod,
  ReportDispatchStatus,
} from '@/types/admin';

function normalizeQualityStatus(value: unknown): ControllerQualityStatus {
  switch (value) {
    case 'ok':
    case 'issue':
      return value;
    default:
      return 'unchecked';
  }
}

function normalizeDeliveryStatus(value: unknown): ReportDeliveryStatus {
  switch (value) {
    case 'none':
    case 'manual_checked':
    case 'sent':
    case 'failed':
      return value;
    default:
      return '';
  }
}

function normalizeDispatchMethod(value: unknown): ReportDispatchMethod {
  switch (value) {
    case 'manual':
    case 'system_email':
      return value;
    default:
      return '';
  }
}

export function normalizeControllerReportType(value: unknown): ControllerReportType {
  const normalized = normalizeMapperText(value).toLowerCase();

  switch (normalized) {
    case QUARTERLY_SUMMARY_REPORT_KIND:
    case 'quarterly_report':
      return 'quarterly_report';
    case 'bad_workplace':
      return 'bad_workplace';
    case TECHNICAL_GUIDANCE_REPORT_KIND:
    default:
      return 'technical_guidance';
  }
}

export function normalizeControllerReview(
  value: unknown,
): ReportControllerReview | null {
  const record = asMapperRecord(value);
  if (Object.keys(record).length === 0) {
    return null;
  }

  return {
    checkedAt: normalizeMapperText(record.checkedAt),
    checkerUserId: normalizeMapperText(record.checkerUserId),
    note: normalizeMapperText(record.note),
    ownerUserId: normalizeMapperText(record.ownerUserId),
    qualityStatus: normalizeQualityStatus(record.qualityStatus),
  };
}

function normalizeDispatchHistoryItem(value: unknown): ReportDispatchHistoryEntry | null {
  const record = asMapperRecord(value);
  const sentAt = normalizeMapperText(record.sentAt);
  const id = normalizeMapperText(record.id) || sentAt;
  if (!id && !sentAt) {
    return null;
  }

  return {
    id,
    memo: normalizeMapperText(record.memo),
    sentAt,
    sentByUserId: normalizeMapperText(record.sentByUserId),
  };
}

export function normalizeDispatchMeta(value: unknown): ReportDispatchMeta | null {
  const record = asMapperRecord(value);
  if (Object.keys(record).length === 0) {
    return null;
  }

  const sentHistory = Array.isArray(record.sentHistory)
    ? record.sentHistory
        .map((item) => normalizeDispatchHistoryItem(item))
        .filter((item): item is ReportDispatchHistoryEntry => Boolean(item))
    : [];

  return {
    dispatchStatus: normalizeDeliveryStatus(record.dispatchStatus || record.dispatch_status),
    dispatchMethod: normalizeDispatchMethod(record.dispatchMethod || record.dispatch_method),
    dispatchedAt: normalizeMapperText(
      record.dispatchedAt || record.dispatched_at || record.actualSentAt || record.actual_sent_at,
    ),
    dispatchCheckedBy: normalizeMapperText(record.dispatchCheckedBy || record.dispatch_checked_by),
    dispatchCheckedAt: normalizeMapperText(
      record.dispatchCheckedAt ||
        record.dispatch_checked_at ||
        record.sentCompletedAt ||
        record.sent_completed_at,
    ),
    sentHistory,
    mailboxAccountId: normalizeMapperText(record.mailboxAccountId || record.mailbox_account_id),
    mailThreadId: normalizeMapperText(record.mailThreadId || record.mail_thread_id),
    messageId: normalizeMapperText(record.messageId || record.message_id),
    recipient: normalizeMapperText(record.recipient),
    actualRecipient: normalizeMapperText(record.actualRecipient || record.actual_recipient),
    readAt: normalizeMapperText(record.readAt || record.read_at),
    replyAt: normalizeMapperText(record.replyAt || record.reply_at),
    replySummary: normalizeMapperText(record.replySummary || record.reply_summary),
  };
}

export function getDispatchStatusLabel(status: ReportDispatchStatus): string {
  switch (status) {
    case 'normal':
      return '정상';
    case 'warning':
      return '경고';
    case 'overdue':
      return '지연';
    case 'sent':
      return '발송 완료';
    default:
      return '-';
  }
}

export function getDeliveryStatusLabel(status: ReportDeliveryStatus): string {
  switch (status) {
    case 'none':
      return '미처리';
    case 'manual_checked':
      return '수동 확인';
    case 'sent':
      return '발송 완료';
    case 'failed':
      return '발송 실패';
    default:
      return '-';
  }
}

export function getDispatchMethodLabel(method: ReportDispatchMethod): string {
  switch (method) {
    case 'manual':
      return '수동';
    case 'system_email':
      return '시스템 메일';
    default:
      return '-';
  }
}

export function getQualityStatusLabel(status: ControllerQualityStatus): string {
  switch (status) {
    case 'ok':
      return '확인 완료';
    case 'issue':
      return '이슈';
    default:
      return '미확인';
  }
}
