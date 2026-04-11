import {
  QUARTERLY_SUMMARY_REPORT_KIND,
  TECHNICAL_GUIDANCE_REPORT_KIND,
} from '@/lib/erpReports/shared';
import { asMapperRecord, normalizeMapperText } from '@/lib/safetyApiMappers/utils';
import type {
  ControllerQualityStatus,
  ControllerReportType,
  ReportControllerReview,
  ReportDispatchHistoryEntry,
  ReportDispatchMeta,
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

function normalizeDispatchStatus(value: unknown): ReportDispatchStatus {
  switch (value) {
    case 'normal':
    case 'warning':
    case 'overdue':
    case 'sent':
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
    deadlineDate: normalizeMapperText(record.deadlineDate),
    dispatchStatus: normalizeDispatchStatus(record.dispatchStatus),
    sentCompletedAt: normalizeMapperText(record.sentCompletedAt),
    actualSentAt: normalizeMapperText(record.actualSentAt || record.actual_sent_at),
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
      return '발송완료';
    default:
      return '-';
  }
}

export function getQualityStatusLabel(status: ControllerQualityStatus): string {
  switch (status) {
    case 'ok':
      return '확인완료';
    case 'issue':
      return '이슈';
    default:
      return '미확인';
  }
}
