import { NextResponse } from 'next/server';
import {
  createWorkerScheduleServer,
  fetchWorkerSchedulesServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { invalidateAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { invalidateAdminOverviewAndReportsRouteCaches } from '@/server/admin/adminRouteInvalidation';
import { invalidateAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import { mapBackendSchedule, mapBackendScheduleListResponse } from '@/server/admin/upstreamMappers';
import type { SafetyInspectionSchedule } from '@/types/admin';

export const runtime = 'nodejs';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePositiveInteger(value: unknown) {
  const normalized =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;
  return Number.isFinite(normalized) && normalized > 0 ? Math.trunc(normalized) : 0;
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

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const url = new URL(request.url);
    const response = await fetchWorkerSchedulesServer(
      token,
      {
        limit: Math.max(1, Math.min(300, Number(url.searchParams.get('limit') || '200'))),
        month: url.searchParams.get('month') || '',
        offset: Math.max(0, Number(url.searchParams.get('offset') || '0')),
        siteId: url.searchParams.get('siteId') || '',
        status: url.searchParams.get('status') || '',
      },
      request,
    );

    return NextResponse.json(mapBackendScheduleListResponse(response));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '내 일정을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const created = await createWorkerScheduleServer(
      token,
      {
        actual_visit_date:
          normalizeText(rawPayload.actualVisitDate) || normalizeText(rawPayload.actual_visit_date),
        linked_report_key:
          normalizeText(rawPayload.linkedReportKey) || normalizeText(rawPayload.linked_report_key),
        site_id: normalizeText(rawPayload.siteId) || normalizeText(rawPayload.site_id),
        round_no: normalizePositiveInteger(rawPayload.roundNo ?? rawPayload.round_no),
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
    return NextResponse.json(mapBackendSchedule(created));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '?쇱젙???앹꽦?섏? 紐삵뻽?듬땲??' },
      { status: 500 },
    );
  }
}
