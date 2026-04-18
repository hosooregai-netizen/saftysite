import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import { invalidateAdminOverviewAndReportsRouteCaches } from '@/server/admin/adminRouteInvalidation';
import { serializeReportDispatchPayload } from '@/server/admin/reportDispatchPayload';
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
      serializeReportDispatchPayload(dispatch),
      request,
    );
    invalidateAdminOverviewAndReportsRouteCaches();
    void refreshAdminAnalyticsSnapshot(token, request).catch(() => undefined);

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
