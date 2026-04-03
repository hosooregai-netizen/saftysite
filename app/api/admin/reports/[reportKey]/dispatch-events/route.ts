import { NextResponse } from 'next/server';
import {
  fetchAdminReportByKey,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminReport,
} from '@/server/admin/safetyApiServer';
import type { ReportDispatchHistoryEntry, ReportDispatchMeta } from '@/types/admin';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const event = (await request.json()) as ReportDispatchHistoryEntry;
    const report = await fetchAdminReportByKey(token, reportKey, request);
    const currentDispatch = (report.meta.dispatch || {
      deadlineDate: '',
      dispatchStatus: '',
      sentCompletedAt: '',
      sentHistory: [],
    }) as ReportDispatchMeta;

    const updatedDispatch: ReportDispatchMeta = {
      ...currentDispatch,
      dispatchStatus:
        currentDispatch.dispatchStatus === 'sent' || event.memo.includes('발송')
          ? 'sent'
          : currentDispatch.dispatchStatus,
      sentCompletedAt: currentDispatch.sentCompletedAt || event.sentAt,
      sentHistory: [...(currentDispatch.sentHistory || []), event],
    };

    const updated = await updateAdminReport(
      token,
      {
        ...report,
        meta: {
          ...report.meta,
          dispatch: updatedDispatch,
        },
        create_revision: false,
        revision_reason: 'manual_save',
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
