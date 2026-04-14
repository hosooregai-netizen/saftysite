import { NextResponse } from 'next/server';
import {
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  fetchNotificationsServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import {
  getLocalScheduleNotificationsForUser,
  mergeNotificationFeeds,
} from '@/server/admin/localScheduleNotifications';
import { mapBackendNotificationFeed } from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [currentUser, upstreamFeed, assignedSites] = await Promise.all([
      fetchCurrentSafetyUserServer(token, request),
      fetchNotificationsServer(token, request),
      fetchAssignedSafetySitesServer(token, request).catch(() => []),
    ]);
    const feed = mapBackendNotificationFeed(upstreamFeed);
    const localRows = getLocalScheduleNotificationsForUser(assignedSites, currentUser.id);
    return NextResponse.json(mergeNotificationFeeds(feed, localRows));
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 피드를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
