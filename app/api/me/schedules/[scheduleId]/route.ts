import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import { updateSingleSchedule } from '@/server/admin/automation';
import {
  appendSiteScheduleNotifications,
  buildScheduleChangeNotifications,
} from '@/server/admin/localScheduleNotifications';
import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';

export const runtime = 'nodejs';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStatus(value: unknown): SafetyInspectionSchedule['status'] | undefined {
  switch (normalizeText(value)) {
    case 'completed':
    case 'canceled':
    case 'planned':
    case 'postponed':
      return normalizeText(value) as SafetyInspectionSchedule['status'];
    default:
      return undefined;
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { scheduleId } = await context.params;
    const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const currentUser = await fetchCurrentSafetyUserServer(token, request);
    const sites = await fetchAssignedSafetySitesServer(token, request);
    const data: ControllerDashboardData = {
      assignments: [],
      contentItems: [],
      headquarters: [],
      sites,
      users: [currentUser],
    };
    const payload: Partial<SafetyInspectionSchedule> = {
      plannedDate: normalizeText(rawPayload.plannedDate) || normalizeText(rawPayload.planned_date),
      selectionReasonLabel:
        normalizeText(rawPayload.selectionReasonLabel) ||
        normalizeText(rawPayload.selection_reason_label),
      selectionReasonMemo:
        normalizeText(rawPayload.selectionReasonMemo) ||
        normalizeText(rawPayload.selection_reason_memo),
      status: normalizeStatus(rawPayload.status),
    };
    const { memo: scheduleMemo, schedule, previousSchedule, site } = updateSingleSchedule(
      data,
      decodeURIComponent(scheduleId),
      payload,
      {
        actorUserId: currentUser.id,
        actorUserName: currentUser.name,
      },
    );

    if (
      previousSchedule.assigneeUserId &&
      previousSchedule.assigneeUserId !== currentUser.id &&
      schedule.assigneeUserId !== currentUser.id
    ) {
      return NextResponse.json({ error: '수정 권한이 없는 일정입니다.' }, { status: 403 });
    }

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
    await refreshAdminAnalyticsSnapshot(token, request).catch(() => undefined);
    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정을 저장하지 못했습니다.' },
      { status: 500 },
    );
  }
}
