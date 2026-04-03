import { NextResponse } from 'next/server';
import {
  updateSingleSchedule,
} from '@/server/admin/automation';
import {
  fetchAdminCoreData,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
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
    const result = updateSingleSchedule(data, scheduleId, payload);

    await updateAdminSite(
      token,
      result.site.id,
      {
        memo: result.memo,
      },
      request,
    );

    return NextResponse.json(result.schedule);
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
