import { NextResponse } from 'next/server';
import { buildAdminSchedules } from '@/server/admin/automation';
import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import type { ControllerDashboardData } from '@/types/controller';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(300, Number(url.searchParams.get('limit') || '200')));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
    const month = url.searchParams.get('month') || '';
    const currentUser = await fetchCurrentSafetyUserServer(token, request);
    const sites = await fetchAssignedSafetySitesServer(token, request);
    const data: ControllerDashboardData = {
      assignments: [],
      contentItems: [],
      headquarters: [],
      sites,
      users: [currentUser],
    };
    const rows = buildAdminSchedules(data, {
      assigneeUserId: currentUser.id,
      month,
      siteId: url.searchParams.get('siteId') || '',
      status: url.searchParams.get('status') || '',
    });

    return NextResponse.json({
      limit,
      month,
      offset,
      rows: rows.slice(offset, offset + limit),
      total: rows.length,
    });
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
