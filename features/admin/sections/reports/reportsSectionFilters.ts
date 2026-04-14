import { isClosedReport } from '@/lib/admin/lifecycleStatus';
import type {
  ControllerQualityStatus,
  ControllerReportRow,
  ReportDispatchMeta,
} from '@/types/admin';
import type { ReportReviewForm } from './reportsSectionTypes';

export const REPORT_PAGE_SIZE = 100;
export const REPORT_PRESET_PAGE_SIZE = 500;

export type OverviewReportsPreset = 'badWorkplaceOverdue' | 'issueBundle' | 'siteOverdueBundle';

export const EMPTY_REVIEW_FORM: ReportReviewForm = {
  note: '',
  ownerUserId: '',
  qualityStatus: 'unchecked' as ControllerQualityStatus,
};

export function formatDateTime(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateOnly(value: string) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function isCompletedReportStatus(row: ControllerReportRow) {
  return isClosedReport(row);
}

export function isBadWorkplaceOverdue(row: ControllerReportRow, today = new Date()) {
  if (row.reportType !== 'bad_workplace' || isCompletedReportStatus(row)) return false;
  const monthToken = row.reportMonth || row.updatedAt.slice(0, 7);
  const matched = monthToken.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return false;
  const deadline = new Date(Number(matched[1]), Number(matched[2]), 0);
  deadline.setHours(0, 0, 0, 0);
  deadline.setDate(deadline.getDate() + 7);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  return deadline.getTime() < todayStart.getTime();
}

export function isOverviewOverdue(row: ControllerReportRow, today = new Date()) {
  if (row.reportType === 'quarterly_report') {
    return row.dispatchStatus === 'overdue';
  }

  if (row.reportType === 'bad_workplace') {
    return isBadWorkplaceOverdue(row, today);
  }

  return false;
}

export function filterRowsForOverviewPreset(
  rows: ControllerReportRow[],
  preset: OverviewReportsPreset | null,
  today = new Date(),
) {
  if (!preset) return rows;

  if (preset === 'badWorkplaceOverdue') {
    return rows.filter((row) => isBadWorkplaceOverdue(row, today));
  }

  if (preset === 'issueBundle') {
    return rows.filter((row) => row.qualityStatus === 'issue' || isOverviewOverdue(row, today));
  }

  return rows.filter((row) => isOverviewOverdue(row, today));
}

export function buildDispatchMeta(row: ControllerReportRow): ReportDispatchMeta {
  return row.dispatch ?? {
    dispatchStatus: '',
    dispatchMethod: '',
    dispatchedAt: '',
    dispatchCheckedBy: '',
    dispatchCheckedAt: '',
    actualRecipient: '',
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
