import { NextResponse } from 'next/server';

import {
  fetchAdminSiteServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ siteId: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { siteId } = await context.params;
    const site = await fetchAdminSiteServer(token, decodeURIComponent(siteId), request);
    return NextResponse.json(site);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '현장 상세 정보를 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
