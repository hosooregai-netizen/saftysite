import { NextResponse } from 'next/server';
import {
  acknowledgeNotificationServer,
  fetchAssignedSafetySitesServer,
  fetchCurrentSafetyUserServer,
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import {
  acknowledgeLocalScheduleNotification,
  isLocalScheduleNotificationId,
} from '@/server/admin/localScheduleNotifications';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { notificationId } = await context.params;
    const decodedNotificationId = decodeURIComponent(notificationId);
    if (isLocalScheduleNotificationId(decodedNotificationId)) {
      const [currentUser, sites] = await Promise.all([
        fetchCurrentSafetyUserServer(token, request),
        fetchAssignedSafetySitesServer(token, request).catch(() => []),
      ]);
      for (const site of sites) {
        const acknowledged = acknowledgeLocalScheduleNotification(
          site,
          decodedNotificationId,
          currentUser.id,
        );
        if (!acknowledged.acknowledged) continue;
        await updateAdminSite(token, site.id, { memo: acknowledged.memo }, request);
        return NextResponse.json({ acknowledged_ids: acknowledged.acknowledgedIds });
      }

      return NextResponse.json({ acknowledged_ids: [] });
    }

    return NextResponse.json(
      await acknowledgeNotificationServer(token, decodedNotificationId, request),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.' },
      { status: 500 },
    );
  }
}
