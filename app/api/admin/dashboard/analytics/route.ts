import { NextResponse } from 'next/server';
import { buildAdminAnalyticsResponse } from '@/server/admin/automation';
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
    const url = new URL(request.url);
    const [data, reports] = await Promise.all([
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);

    return NextResponse.json(
      buildAdminAnalyticsResponse(data, reports, {
        contractType: url.searchParams.get('contract_type') || '',
        headquarterId: url.searchParams.get('headquarter_id') || '',
        period: url.searchParams.get('period') || 'month',
        query: url.searchParams.get('query') || '',
        userId: url.searchParams.get('user_id') || '',
      }),
    );
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '실적/매출 대시보드를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
