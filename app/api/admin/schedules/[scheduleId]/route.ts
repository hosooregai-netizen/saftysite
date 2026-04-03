import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminScheduleServer,
} from '@/server/admin/safetyApiServer';
import { mapBackendSchedule } from '@/server/admin/upstreamMappers';
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
    const updated = await updateAdminScheduleServer(
      token,
      scheduleId,
      {
        assignee_name: payload.assigneeName || undefined,
        assignee_user_id: payload.assigneeUserId || undefined,
        exception_memo: payload.exceptionMemo || undefined,
        exception_reason_code: payload.exceptionReasonCode || undefined,
        linked_report_key: payload.linkedReportKey || undefined,
        planned_date: payload.plannedDate || undefined,
        status: payload.status || undefined,
      },
      request,
    );

    return NextResponse.json(mapBackendSchedule(updated));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
}
