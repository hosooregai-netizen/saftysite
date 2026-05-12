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
import { mirrorWorkerScheduleToSiteMemo } from '@/server/admin/workerScheduleMirror';
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

function hasPayloadKey(payload: Record<string, unknown>, ...keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

function readOptionalText(
  payload: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
) {
  if (Object.prototype.hasOwnProperty.call(payload, camelKey)) {
    return normalizeText(payload[camelKey]);
  }
  if (Object.prototype.hasOwnProperty.call(payload, snakeKey)) {
    return normalizeText(payload[snakeKey]);
  }
  return undefined;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const { scheduleId } = await context.params;
    const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updatePayload: Record<string, unknown> = {};
    const actualVisitDate = readOptionalText(rawPayload, 'actualVisitDate', 'actual_visit_date');
    const linkedReportKey = readOptionalText(rawPayload, 'linkedReportKey', 'linked_report_key');
    const plannedDate = readOptionalText(rawPayload, 'plannedDate', 'planned_date');
    const selectionReasonLabel = readOptionalText(
      rawPayload,
      'selectionReasonLabel',
      'selection_reason_label',
    );
    const selectionReasonMemo = readOptionalText(
      rawPayload,
      'selectionReasonMemo',
      'selection_reason_memo',
    );

    if (actualVisitDate !== undefined) {
      updatePayload.actual_visit_date = actualVisitDate;
    }
    if (linkedReportKey !== undefined) {
      updatePayload.linked_report_key = linkedReportKey;
    }
    if (plannedDate !== undefined) {
      updatePayload.planned_date = plannedDate;
    }
    if (selectionReasonLabel !== undefined) {
      updatePayload.selection_reason_label = selectionReasonLabel;
    }
    if (selectionReasonMemo !== undefined) {
      updatePayload.selection_reason_memo = selectionReasonMemo;
    }
    if (hasPayloadKey(rawPayload, 'status')) {
      const status = normalizeStatus(rawPayload.status);
      if (status) {
        updatePayload.status = status;
      }
    }

    const updated = await updateWorkerScheduleServer(
      token,
      decodeURIComponent(scheduleId),
      updatePayload,
      request,
    );
    const mapped = mapBackendSchedule(updated);
    await mirrorWorkerScheduleToSiteMemo(token, mapped, request);
    invalidateAdminDirectorySnapshot();
    invalidateAdminScheduleSnapshot();
    invalidateAdminOverviewAndReportsRouteCaches();
    return NextResponse.json(mapped);
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
