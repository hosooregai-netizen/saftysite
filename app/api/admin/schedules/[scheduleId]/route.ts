import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import {
  getAdminScheduleSnapshot,
  refreshAdminScheduleSnapshot,
} from '@/server/admin/scheduleSnapshot';
import { refreshAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { updateSingleSchedule } from '@/server/admin/automation';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
  updateAdminScheduleServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendSchedule } from '@/server/admin/upstreamMappers';
import type { SafetyInspectionSchedule } from '@/types/admin';

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

function buildLocalSchedulePatch(
  payload: ReturnType<typeof normalizeSchedulePayload>,
): Partial<SafetyInspectionSchedule> {
  return {
    assigneeUserId: payload.assignee_user_id,
    plannedDate: payload.planned_date,
    selectionReasonLabel: payload.selection_reason_label,
    selectionReasonMemo: payload.selection_reason_memo,
    status: payload.status ?? undefined,
  };
}

function normalizeSchedulePayload(rawPayload: Record<string, unknown>) {
  return {
    assignee_user_id:
      normalizeText(rawPayload.assigneeUserId) || normalizeText(rawPayload.assignee_user_id),
    planned_date: normalizeText(rawPayload.plannedDate) || normalizeText(rawPayload.planned_date),
    selection_reason_label:
      normalizeText(rawPayload.selectionReasonLabel) ||
      normalizeText(rawPayload.selection_reason_label),
    selection_reason_memo:
      normalizeText(rawPayload.selectionReasonMemo) ||
      normalizeText(rawPayload.selection_reason_memo),
    status: normalizeStatus(rawPayload.status),
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { scheduleId } = await context.params;
    const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = normalizeSchedulePayload(rawPayload);
    const decodedScheduleId = decodeURIComponent(scheduleId);
    const scheduleSnapshot = await getAdminScheduleSnapshot(token, request);
    const localUpdate = updateSingleSchedule(
      {
        ...scheduleSnapshot.data,
        contentItems: [],
      },
      decodedScheduleId,
      buildLocalSchedulePatch(payload),
    );
    const updated = await updateAdminScheduleServer(
      token,
      decodedScheduleId,
      payload,
      request,
    );
    await updateAdminSite(
      token,
      localUpdate.site.id,
      { memo: localUpdate.memo },
      request,
    );
    await refreshAdminDirectorySnapshot(token, request);
    await refreshAdminAnalyticsSnapshot(token, request);
    await refreshAdminScheduleSnapshot(token, request).catch(() => undefined);

    return NextResponse.json(
      {
        ...mapBackendSchedule(updated),
        ...localUpdate.schedule,
      },
    );
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
