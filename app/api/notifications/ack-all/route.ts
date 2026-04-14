import { NextResponse } from 'next/server';
import {
  acknowledgeAllNotificationsServer,
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import { acknowledgeAllLocalScheduleNotifications } from '@/server/admin/localScheduleNotifications';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [upstream, currentUser, sites] = await Promise.all([
      acknowledgeAllNotificationsServer(token, request),
      fetchCurrentSafetyUserServer(token, request),
      fetchAssignedSafetySitesServer(token, request).catch(() => []),
    ]);

    const acknowledgedIds = [...upstream.acknowledged_ids];
    for (const site of sites) {
      const local = acknowledgeAllLocalScheduleNotifications(site, currentUser.id);
      if (local.acknowledgedIds.length === 0) continue;
      acknowledgedIds.push(...local.acknowledgedIds);
      await updateAdminSite(token, site.id, { memo: local.memo }, request);
    }

    return NextResponse.json({ acknowledged_ids: acknowledgedIds });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 전체 읽음 처리에 실패했습니다.' },
      { status: 500 },
    );
  }
}
