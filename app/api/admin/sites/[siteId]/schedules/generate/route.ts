import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { refreshAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import { generateSchedulesForSite, updateSiteSchedules } from '@/server/admin/automation';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { siteId } = await context.params;
    const directorySnapshot = await getAdminDirectorySnapshot(token, request);
    const data = {
      ...directorySnapshot.data,
      contentItems: [],
    };
    const site = data.sites.find((item) => item.id === siteId);
    if (!site) {
      return NextResponse.json({ error: '현장을 찾지 못했습니다.' }, { status: 404 });
    }
    const rows = generateSchedulesForSite(site, data.users);
    await updateAdminSite(token, siteId, { memo: updateSiteSchedules(site, rows) }, request);
    await refreshAdminAnalyticsSnapshot(token, request);
    await refreshAdminScheduleSnapshot(token, request).catch(() => undefined);
    return NextResponse.json({ rows });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 자동생성에 실패했습니다.' },
      { status: error instanceof Error ? 400 : 500 },
    );
  }
}
