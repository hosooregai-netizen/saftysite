import { NextResponse } from 'next/server';
import { buildAdminOverviewResponse } from '@/server/admin/automation';
import {
  fetchAdminCoreData,
  fetchAdminReports,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const [data, reports] = await Promise.all([
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);

    return NextResponse.json(buildAdminOverviewResponse(data, reports).alerts);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
