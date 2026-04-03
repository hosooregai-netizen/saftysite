import { NextResponse } from 'next/server';
import {
  generateSchedulesForSite,
  updateSiteSchedules,
} from '@/server/admin/automation';
import {
  fetchAdminCoreData,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { siteId } = await context.params;
    const data = await fetchAdminCoreData(token, request);
    const site = data.sites.find((item) => item.id === siteId);

    if (!site) {
      return NextResponse.json({ error: '현장을 찾지 못했습니다.' }, { status: 404 });
    }

    const rows = generateSchedulesForSite(site, data.users);
    const memo = updateSiteSchedules(site, rows);

    await updateAdminSite(
      token,
      site.id,
      {
        memo,
      },
      request,
    );

    return NextResponse.json({ rows });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 자동생성에 실패했습니다.' },
      { status: 500 },
    );
  }
}
