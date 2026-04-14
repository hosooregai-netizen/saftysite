import { NextResponse } from 'next/server';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const snapshot = await refreshAdminAnalyticsSnapshot(token, request);
    return NextResponse.json({
      ok: true,
      refreshedAt: snapshot.refreshedAt,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '실적/매출 스냅샷을 새로고침하지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
