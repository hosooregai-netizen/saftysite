import { NextResponse } from 'next/server';
import {
  fetchAdminReportByKey,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminReport,
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
    const report = await fetchAdminReportByKey(token, reportKey, request);

    const updated = await updateAdminReport(
      token,
      {
        ...report,
        meta: {
          ...report.meta,
          dispatch,
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
      { error: error instanceof Error ? error.message : '발송 정보 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
}
