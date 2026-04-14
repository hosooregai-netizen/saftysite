import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import { invalidateAdminReportsRouteCache } from '@/server/admin/reportsRouteCache';
import {
  updateAdminReportReviewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import type { ReportControllerReview } from '@/types/admin';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const review = (await request.json()) as ReportControllerReview;
    const updated = await updateAdminReportReviewServer(
      token,
      reportKey,
      {
        checked_at: review.checkedAt || null,
        checker_user_id: review.checkerUserId || null,
        note: review.note || null,
        owner_user_id: review.ownerUserId || null,
        quality_status: review.qualityStatus || 'unchecked',
      },
      request,
    );
    invalidateAdminReportsRouteCache();
    await refreshAdminAnalyticsSnapshot(token, request);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '품질 체크 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
}
