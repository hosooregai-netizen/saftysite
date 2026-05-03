import { NextResponse } from 'next/server';
import { invalidateAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { invalidateAdminOverviewAndReportsRouteCaches } from '@/server/admin/adminRouteInvalidation';
import { invalidateAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import {
  readRequiredSafetyAuthToken,
  reserveNextWorkerScheduleServer,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { mapBackendSchedule } from '@/server/admin/upstreamMappers';
import { mirrorWorkerScheduleToSiteMemo } from '@/server/admin/workerScheduleMirror';

export const runtime = 'nodejs';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updated = await reserveNextWorkerScheduleServer(
      token,
      {
        planned_date: normalizeText(rawPayload.plannedDate) || normalizeText(rawPayload.planned_date),
        selection_reason_label:
          normalizeText(rawPayload.selectionReasonLabel) ||
          normalizeText(rawPayload.selection_reason_label),
        selection_reason_memo:
          normalizeText(rawPayload.selectionReasonMemo) ||
          normalizeText(rawPayload.selection_reason_memo),
        site_id: normalizeText(rawPayload.siteId) || normalizeText(rawPayload.site_id),
      },
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
      { error: error instanceof Error ? error.message : '일정을 자동 배정하지 못했습니다.' },
      { status: 500 },
    );
  }
}
