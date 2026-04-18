import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { refreshAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import {
  fetchCurrentSafetyUserServer,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import { updateSingleSchedule } from '@/server/admin/automation';
import type { SafetyInspectionSchedule } from '@/types/admin';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { scheduleId } = await context.params;
    const payload = (await request.json()) as Partial<SafetyInspectionSchedule>;
    const directorySnapshot = await getAdminDirectorySnapshot(token, request);
    const data = {
      ...directorySnapshot.data,
      contentItems: [],
    };
    const currentUser = await fetchCurrentSafetyUserServer(token, request);
    const { memo: scheduleMemo, schedule, site } = updateSingleSchedule(
      data,
      scheduleId,
      payload,
      {
        actorUserId: currentUser.id,
        actorUserName: currentUser.name,
      },
    );
    await updateAdminSite(token, site.id, { memo: scheduleMemo }, request);
    await refreshAdminAnalyticsSnapshot(token, request);
    await refreshAdminScheduleSnapshot(token, request).catch(() => undefined);

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 저장에 실패했습니다.' },
      { status: error instanceof Error ? 400 : 500 },
    );
  }
}
