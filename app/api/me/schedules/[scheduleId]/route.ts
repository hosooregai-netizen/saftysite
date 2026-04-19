import { NextResponse } from 'next/server';
import { invalidateAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { invalidateAdminOverviewAndReportsRouteCaches } from '@/server/admin/adminRouteInvalidation';
import { invalidateAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import {
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
  updateWorkerScheduleServer,
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { scheduleId } = await context.params;
    const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updated = await updateWorkerScheduleServer(
      token,
      decodeURIComponent(scheduleId),
      {
        actual_visit_date:
          normalizeText(rawPayload.actualVisitDate) || normalizeText(rawPayload.actual_visit_date),
        linked_report_key:
          normalizeText(rawPayload.linkedReportKey) || normalizeText(rawPayload.linked_report_key),
        planned_date: normalizeText(rawPayload.plannedDate) || normalizeText(rawPayload.planned_date),
        selection_reason_label:
          normalizeText(rawPayload.selectionReasonLabel) ||
          normalizeText(rawPayload.selection_reason_label),
        selection_reason_memo:
          normalizeText(rawPayload.selectionReasonMemo) ||
          normalizeText(rawPayload.selection_reason_memo),
        status: normalizeStatus(rawPayload.status),
      },
      request,
    );
    invalidateAdminDirectorySnapshot();
    invalidateAdminScheduleSnapshot();
    invalidateAdminOverviewAndReportsRouteCaches();
    return NextResponse.json(mapBackendSchedule(updated));
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
