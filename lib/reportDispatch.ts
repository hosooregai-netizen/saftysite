import type { ReportDispatchMeta } from '@/types/admin';

const COMPLETED_DISPATCH_STATUSES = new Set(['sent', 'manual_checked']);

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
  dispatch: ReportDispatchMeta | null | undefined,
): ReportDispatchMeta {
  return {
    ...createEmptyReportDispatchMeta(),
    ...(dispatch ?? {}),
    sentHistory: Array.isArray(dispatch?.sentHistory) ? [...dispatch.sentHistory] : [],
  };
}

export function isReportDispatchCompleted(
  dispatch: Pick<ReportDispatchMeta, 'dispatchStatus'> | null | undefined,
) {
  const status = dispatch?.dispatchStatus?.trim() || '';
  return COMPLETED_DISPATCH_STATUSES.has(status);
}

export function buildToggledReportDispatch(
  currentDispatch: ReportDispatchMeta | null | undefined,
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
