import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import {
  fetchAdminCoreData,
  fetchCurrentSafetyUserServer,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import { updateSingleSchedule } from '@/server/admin/automation';
import {
  appendSiteScheduleNotifications,
  buildScheduleChangeNotifications,
} from '@/server/admin/localScheduleNotifications';
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
    const data = await fetchAdminCoreData(token, request);
    const currentUser = await fetchCurrentSafetyUserServer(token, request);
    const { memo: scheduleMemo, schedule, previousSchedule, site } = updateSingleSchedule(
      data,
      scheduleId,
      payload,
      {
        actorUserId: currentUser.id,
        actorUserName: currentUser.name,
      },
    );
    const nextNotifications = buildScheduleChangeNotifications({
      actorUser: currentUser,
      nextSchedule: schedule,
      previousSchedule,
      site,
    });
    const memo = appendSiteScheduleNotifications(
      {
        ...site,
        memo: scheduleMemo,
      },
      nextNotifications,
    );
    await updateAdminSite(token, site.id, { memo }, request);
    await refreshAdminAnalyticsSnapshot(token, request);

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
